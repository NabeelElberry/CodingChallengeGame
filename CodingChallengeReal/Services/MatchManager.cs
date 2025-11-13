using CodingChallengeReal.DTO;
using CodingChallengeReal.Misc;
using CodingChallengeReal.Repositories.Interface;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Http.HttpResults;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;
using System.CodeDom;
using System.Linq.Expressions;
using System.Management;

namespace CodingChallengeReal.Services
{
    public class MatchManager
    {
        private readonly IDatabase _redis;
        private readonly IProblemSetRepository _problemSetRepository;

        public MatchManager(IConnectionMultiplexer redisConnection, IProblemSetRepository problemSetRepository)
        {
            _redis = redisConnection.GetDatabase();
            _problemSetRepository = problemSetRepository;
        }

        const string luaInsertScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }


        local matchKey   = KEYS[1] -- match key as set
        local playerOneId = ARGV[1]
        local playerTwoId  = ARGV[2]
        local minigameOrder = ARGV[3]
        local questionOrder = ARGV[4]
        local problemSetId = ARGV[5]
        local gameAnswerOrder = ARGV[6]

        -- logic is simple, just make a list with matchKey as the list name, and two values inside it 
        -- structure looks like this: List: {matchKey} Values: {playerOneId-

        redis.call('HSET', matchKey, 'level:' ..  playerOneId, 0, 'level:' .. playerTwoId, 0, 'minigameOrder', minigameOrder, 'time:' .. playerOneId, 0, 'time:' .. playerTwoId, 0, 'questionOrder', questionOrder, 'problemSetId', problemSetId, 'fullAnswerOrder', gameAnswerOrder)
        return true;

";

        const string luaEditLevelScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }

        local matchKey   = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local newValue  = ARGV[2]

        -- logic is simple, edits the field to be whatever new value

        redis.call('HSET', matchKey, 'level:' ..  playerId, newValue)
        return true;
";


        const string luaEditTimeScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }

        local matchKey   = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local newValue  = ARGV[2]

        -- logic is simple, edits the field to be whatever new value

        redis.call('HSET', matchKey, 'time:' ..  playerId, newValue)
        return true;
";


        const string luaGetLevelAndGameOrderScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }
 

        local matchKey = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local returnArr = {}

        -- Gets an array with index 1 as level, index 2 is order of game
        
        returnArr[1] = redis.call('HGET', matchKey, 'level:' ..  playerId)
        returnArr[2] = redis.call('HGET', matchKey, 'minigameOrder')
        return returnArr;";

        const string luaGetTimeScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }
 

        local matchKey = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local returnArr = {}

        -- logic is simple, edits the field to be whatever new value
        
        local time = redis.call('HGET', matchKey, 'time:' ..  playerId)
        
        return time;";



        const string checkIfInitiator = @"
        -- KEYS = {playerId}
        
        local playerId = KEYS[1]

        local returnVal = redis.call('SISMEMBER', 'initiators', playerId)
    
        return returnVal;
        ";

        const string checkIfRedisHashPopulated = @"
        -- KEYS = { matchKey }

        local matchKey = KEYS[1]
        local check = redis.call('HGET', matchKey, 'minigameOrder') 
        return check
        ";

        /// <summary>
        /// Run this when a game is created, makes a redis hash which sets both players level to 0. 
        /// Generates minigameOrder, questionOrder.
        /// </summary>
        /// <param name="matchId"></param>
        /// <param name="playerOneId"></param>
        /// <param name="playerTwoId"></param>
        /// <returns></returns>
        public async Task<String> CreateGameManager(string matchId, string playerOneId, string playerTwoId, Guid problemSetId) 
        {

            var isInitiator = await _redis.ScriptEvaluateAsync(checkIfInitiator, new RedisKey[] { playerOneId });
            string isInitiatorStr = isInitiator.ToString();
            Console.WriteLine($"Is Initiator: {isInitiator}, playerOneId: ${playerOneId}");
            if (isInitiatorStr == "0")
            {

                var scriptPopulated = await _redis.ScriptEvaluateAsync(checkIfRedisHashPopulated, new RedisKey[] { Util.Key(playerOneId, playerTwoId) });

                Console.WriteLine($"Script Populated Result ? {scriptPopulated.ToString()}");

                while (scriptPopulated.IsNull)
                {
                    scriptPopulated = await _redis.ScriptEvaluateAsync(checkIfRedisHashPopulated, new RedisKey[] { Util.Key(playerOneId, playerTwoId) });
                    
                    Console.WriteLine("Rerunning");
                    await Task.Delay(100);
                }

                return "Not initiator";
            }

            

            Random random = new Random();
            string minigameOrderString = "";
            HashSet<int> problems = new HashSet<int>();
            int amountOfRounds = 5; // total number of rounds to play
            // the minigames currently correspond in this order: 0 = dino game, 1 = drag and drop game, 2 = space invaders
            int[] minigameOrderArray = new int[amountOfRounds]; 
            const int totalNumberOfGames = 3; // generates from 0-2, update to be the amount of minigames we have total
            // generating minigame order
            for (int i = 0; i < amountOfRounds; i++)
            {
                int number = random.Next(0, totalNumberOfGames); 
                minigameOrderString += number.ToString();
                minigameOrderArray[i] = number;
            }
            // generating question order
            // there must be at least 5 questions in every problem set, and questions cannot be repeated
            
            // make a set, containing all numbers from 1-k, where k is the amount of questions in a problemset
            // take a number, remove it, do this X times (X = amount of questions per round)
            // O(k) here, with a overhead of a set with size K, since all set operations are O(1) shouldn't be too bad ?
            var problemSet = await _problemSetRepository.GetAsync(problemSetId);

            Console.WriteLine($"Problem Set: {problemSet.pk} Questions: {problemSet.Questions}");

            int amountOfQuestionsInProblemSet = problemSet.Questions.Count; // adjust this once we get proper data, for now use placeholder of 10
            //int amountOfQuestionsInProblemSet = 10;
            
            int questionsAdded = 0;
            string questions = "";

            MixHashArrayDS mixHashArrayDS = new MixHashArrayDS();

            for (int i = 0; i < amountOfQuestionsInProblemSet; i++) // add all possible options for questions, for the amount of rounds we need
            {
                mixHashArrayDS.Insert(i);
            }

            // adding consistent ordering to the each of the minigames

            Dictionary<int, List<string>> orderHolder = new Dictionary<int, List<string>>();
            orderHolder.Add(0, new List<string>());
            orderHolder.Add(1, new List<string>());
            orderHolder.Add(2, new List<string>());



            //Console.WriteLine("MINIGAME ORDER ARRAY: {0}", string.Join(", ", minigameOrderArray)); // logging contents of this array

            
            for (int i = 0; i < minigameOrderArray.Length; i++)
            {
                amountOfRounds = 0;
                //Console.WriteLine($"{i}th run");
                int currentMiniGame = minigameOrderArray[i];
             
                string answerOrder = "";
                int x = 0;
                if (currentMiniGame == 0 || currentMiniGame == 1) // dino game, drag and drop, generate about 200 
                {
                    amountOfRounds = 200;
                    //Console.WriteLine("Minigame 0 or 1 chosen");
                    while (x < amountOfRounds)
                    {
                        answerOrder += getRandomLetter();
                        x++;
                    }

                } else if (currentMiniGame == 2) // space invaders
                {
                    //Console.WriteLine("Minigame 2 chosen");
                    amountOfRounds = 12;
                    //answerChoicesLeft = new Dictionary<char, int>();


                    // this system ensures at least 2 of each answer choices, and then 4 more random ones
                    var choicesLeft = new List<(char c, int num)>
                    {
                        ('A', 2),
                        ('B', 2),
                        ('C', 2),
                        ('D', 2)
                    };

                    // add four more random choices (since there's 12 enemies)
                    for (int z = 0; z < 4; z++)
                    {
                        int number = random.Next(0, 3); // 0-3 is the amount of answer choices we have (A,B,C,D)

                        choicesLeft[number] = (choicesLeft[number].c, choicesLeft[number].num + 1);
                    }

                    for (int z = 0; z < amountOfRounds; z++)
                    {
                        int number = random.Next(0, choicesLeft.Count); // picks between 0-3 (A,B,C,D)
                        var tuple = choicesLeft[number]; // picks a random letter
                        answerOrder += tuple.c.ToString(); // use that letter, then subtract it to take it out from queue

                        //Console.WriteLine($"Tuple: {tuple.c}, {tuple.num}");
                        choicesLeft[number] = (tuple.c, tuple.num - 1);

                        if (choicesLeft[number].num == 0) // we will have 2 of it at least, so remove it from pickings
                        {
                            choicesLeft.Remove((choicesLeft[number].c, 0));
                        }
                    } 
                }
                
                List<String> newList;
                // getting the old list, adding this new thing to it, and then setting that as the new list for the redis hash
               
                //Console.WriteLine($"Answer Order: {answerOrder}");
                newList = orderHolder[currentMiniGame];

                //Console.WriteLine("New List: {0}", string.Join(", ", newList));
                newList.Add(answerOrder);
                orderHolder[currentMiniGame] = newList;
            }

            // converting into different dict for a better readability for JSON
            Dictionary<string, List<string>> convertedDict = new Dictionary<string, List<string>>();
           
            foreach (var item in orderHolder)
            {
                var stringKey = item.Key == 0 ? "zero" : item.Key == 1 ? "one" : "two";

                convertedDict.Add(stringKey, item.Value);
            }
            
            while (questionsAdded < 5) // pick 5 random questions
            {
                var newElement = mixHashArrayDS.GetRandomElement(); // generate new random integer
                questions += $"{newElement}_";
                mixHashArrayDS.Remove(newElement);
                questionsAdded++;
            }

            var scriptResult = await _redis.ScriptEvaluateAsync(luaInsertScript, // arguments for the script
                    new RedisKey[] { matchId }, // key
                    new RedisValue[]
                    {
                        playerOneId, playerTwoId, minigameOrderString, questions, problemSetId.ToString(), JsonConvert.SerializeObject(convertedDict).ToString()
                    }

                );

            Console.WriteLine($"Script Result: {scriptResult}");
           
            return scriptResult.ToString();
        }

        /// <summary>
        /// Run this when updating the player's level, should run every time they move up.
        /// </summary>
        /// <param name="matchId"></param>
        /// <param name="playerId"></param>
        /// <param name="newValue"></param>
        /// <returns>True, if no issues</returns>
        public async Task<String> EditLevelManager(string playerId, int newValue)
        { 
            var opponent = await GetPartner(playerId);
            var matchId = Util.Key(playerId, opponent);

            var scriptResult = await _redis.ScriptEvaluateAsync(luaEditLevelScript, // arguments for the script
                new RedisKey[] { matchId }, // key
                new RedisValue[] { playerId, newValue.ToString() } // args
            );
            return scriptResult.ToString();
        }

        /// <summary>
        /// Edits the current time for a specific player
        /// </summary>
        /// <param name="matchId"></param>
        /// <param name="playerId"></param>
        /// <param name="newValue"></param>
        /// <returns>True, if no issues</returns>
        public async Task<String> EditTimeManager(string playerId, int newValue)
        {
            var opponent = await GetPartner(playerId);
            var matchId = Util.Key(playerId, opponent);

            var scriptResult = await _redis.ScriptEvaluateAsync(luaEditTimeScript, // arguments for the script
                new RedisKey[] { matchId }, // key
                new RedisValue[] { playerId, newValue.ToString() } // args
            );
            return scriptResult.ToString();
        }

        /// <summary>
        /// Simple get method for the player's current level.
        /// </summary>
        /// <param name="matchId"></param>
        /// <param name="playerId"></param>
        /// <returns></returns>

        public async Task<String> GetCurrentLevel(string playerId)
        {
            var opponent = await GetPartner(playerId);
            var matchId = Util.Key(playerId, opponent);

            var scriptResult = await _redis.ScriptEvaluateAsync(luaGetLevelAndGameOrderScript, // arguments for the script
                new RedisKey[] { matchId }, // key
                new RedisValue[]
                {
                     playerId
                } // args
            );
            return scriptResult.ToString();
        }

        /// <summary>
        /// Simple get method for the time spent so far in game, per player.
        /// </summary>
        /// <param name="playerId"></param>
        /// <returns></returns>
        public async Task<String> GetCurrentTime(string playerId)
        {
            var opponent = await GetPartner(playerId);
            var matchId = Util.Key(playerId, opponent);

            var scriptResult = await _redis.ScriptEvaluateAsync(luaGetTimeScript, // arguments for the script
                new RedisKey[] { matchId }, // key
                new RedisValue[]
                {
                     playerId
                } // args
            );
            return scriptResult.ToString();
        }



        /// <summary>
        /// Finds whether there is a partner for specific uid by going through "match_pairs" hash,
        /// 
        /// </summary>
        /// <param name="uid"></param>
        /// <returns>If there is a partner return the UID, otherwise return null</returns>
        public async Task<String> GetPartner(string uid)
        {
            var returnVal = await _redis.HashGetAsync("match_pairs", uid);
            return !returnVal.IsNull ? returnVal.ToString() : null;
        }

        public async Task<HashEntry[]> GetMatchInfoForPlayer(string uid, Guid problemSetId)
        {
            var partner = await GetPartner(uid);
            var matchKey = Util.Key(uid, partner);

            Console.WriteLine($"MatchKey: {matchKey}");

            var hashEntries = await _redis.HashGetAllAsync(matchKey);


            if (hashEntries.Length < 8)
            {
                await CreateGameManager(matchKey, uid, partner, problemSetId);

                return await _redis.HashGetAllAsync(matchKey);
            }
            foreach (var entry in hashEntries)
            {
                
                Console.WriteLine($"name: {entry.Name} value: {entry.Value}");
            }
            return hashEntries;
        }

        private char getRandomLetter()
        {
            Random random = new Random();
            int number = random.Next(4);
            if (number == 0)
            {
                return 'A';
            } else if (number == 1)
            {
                return 'B';
            } else if (number == 2)
            {
                return 'C';
            } else
            {
                return 'D';
            }
        }
    }
}
