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

        

        private string GenerateRandomizedAnswerOrder(int amountOfQuestions)
        {
            int run = 0;
            string finalString = "";
            while (run < amountOfQuestions)
            {
                List<int> intList = new List<int>() { 0,1,2,3 };
                
                Random random = Random.Shared;
                int totalNumInArr = 3;
                for (int i = totalNumInArr; i >= 0; i--)
                {
                    totalNumInArr--;
                    int randomIndex = random.Next(0, i + 1);
                    finalString += intList[randomIndex];
                    intList.RemoveAt(randomIndex);
                }
                run++;
            }

            return finalString;
        } 

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

            //var isInitiator = await _redis.ScriptEvaluateAsync(checkIfInitiator, new RedisKey[] { playerOneId });
            //string isInitiatorStr = isInitiator.ToString();
            //Console.WriteLine($"Is Initiator: {isInitiator}, playerOneId: ${playerOneId}");
            //// case where we aren't initiator
            //// if we're not the initiator, we wait for the initiator to create the match details
            //if (isInitiatorStr == "0")
            //{

            //    var scriptPopulated = await _redis.ScriptEvaluateAsync(checkIfRedisHashPopulated, new RedisKey[] { Util.Key(playerOneId, playerTwoId) });

            //    Console.WriteLine($"Script Populated Result ? {scriptPopulated.ToString()}");

            //    //while ((int)scriptPopulated == 0) // this is the wait
            //    //{
            //    //    await Task.Delay(100);
            //    //    scriptPopulated = await _redis.ScriptEvaluateAsync(checkIfRedisHashPopulated, new RedisKey[] { Util.Key(playerOneId, playerTwoId) });
            //    //    // Console.WriteLine("Rerunning");
            //    //}

            //    return "Not initiator";
            //}

            
            // initiator creates match information
            Random random = Random.Shared;
            string minigameOrderString = "";
            HashSet<int> problems = new HashSet<int>();
            int amountOfRounds = 5; // total number of rounds to play
            // the minigames currently correspond in this order: 0 = dino game, 1 = drag and drop game, 2 = space invaders
            int[] minigameOrderArray = new int[amountOfRounds]; 
            const int totalNumberOfGames = 3; // generates from 0-2, update to be the amount of minigames we have total
            // generating MINIGAME order
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
            
            int questionsAdded = 0;
            string questions = "";

            MixHashArrayDS mixHashArrayDS = new MixHashArrayDS();

            for (int i = 0; i < amountOfQuestionsInProblemSet; i++) // add all possible options for questions, for the amount of rounds we need
            {
                mixHashArrayDS.Insert(i);
            }

            // adding consistent answer choice ordering to the each of the minigames

            Dictionary<int, List<string>> orderHolder = new Dictionary<int, List<string>>();
            orderHolder.Add(0, new List<string>());
            orderHolder.Add(1, new List<string>());
            orderHolder.Add(2, new List<string>());
   
            for (int i = 0; i < minigameOrderArray.Length; i++)
            {
                int amountOfAnswers = 0;
                //Console.WriteLine($"{i}th run");
                int currentMiniGame = minigameOrderArray[i];
             
                string answerOrder = "";
                int x = 0;
                if (currentMiniGame == 0 || currentMiniGame == 1) // dino game, drag and drop, generate about 200 
                {
                    // generates 200 letters for minigame 1 or 2
                    amountOfAnswers = 200;
                    //Console.WriteLine("Minigame 0 or 1 chosen");
                    while (x < amountOfAnswers)
                    {
                        answerOrder += getRandomLetter();
                        x++;
                    }

                } else if (currentMiniGame == 2) // space invaders
                {

                    amountOfAnswers = 12;
           
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

                    for (int z = 0; z < amountOfAnswers; z++)
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


            Console.WriteLine("INFO: ", playerOneId, playerTwoId, minigameOrderString, questions, problemSetId.ToString(), JsonConvert.SerializeObject(convertedDict).ToString());

            // removing last underscore from minigame order string
            minigameOrderString = minigameOrderString.TrimEnd('_');

            var scriptResult = await _redis.ScriptEvaluateAsync(LuaScripts.luaInsertScript, // arguments for the script
                    new RedisKey[] { matchId }, // key
                    new RedisValue[]
                    {
                        playerOneId, playerTwoId, minigameOrderString, questions, problemSetId.ToString(), JsonConvert.SerializeObject(convertedDict).ToString(), GenerateRandomizedAnswerOrder(amountOfRounds)
                    }

                );
            Console.WriteLine($"Questions: {questions}");
            // Console.WriteLine($"Script Result: {scriptResult}");
           
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

            var scriptResult = await _redis.ScriptEvaluateAsync(LuaScripts.luaEditLevelScript, // arguments for the script
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
            Console.WriteLine("Edit time manager");
            var scriptResult = await _redis.ScriptEvaluateAsync(LuaScripts.luaEditTimeScript, // arguments for the script
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

            var scriptResult = await _redis.ScriptEvaluateAsync(LuaScripts.luaGetLevelAndGameOrderScript, // arguments for the script
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

            var scriptResult = await _redis.ScriptEvaluateAsync(LuaScripts.luaGetTimeScript, // arguments for the script
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

        public async Task<HashEntry[]> GetMatchInfoForPlayer(string uid)
        {

            Console.WriteLine($"UID : {uid}");
            var partner = await GetPartner(uid);
            if (partner == null) return Array.Empty<HashEntry>();

            var matchKey = Util.Key(uid, partner);

            // Console.WriteLine($"MatchKey: {matchKey}");

            var ready = await _redis.HashGetAsync(matchKey, "minigameOrder");
            while (ready.IsNull)
            {
                ready = await _redis.HashGetAsync(matchKey, "minigameOrder");
                await Task.Delay(100);
                //Console.WriteLine("UserX ", uid, " is waiting...");
            }

            return await _redis.HashGetAllAsync(matchKey);

        }

        public async Task<bool> CheckIfPlayerInMatch(string uid)
        {
            var opponentId = (await _redis.ScriptEvaluateAsync(LuaScripts.getOpposingPlayerByPlayer, new RedisKey[] { uid })).ToString();
            if (opponentId != null)
            {
                string key = Util.Key(uid, opponentId);
                return await _redis.KeyExistsAsync(key);
            }
            
            return false;
        }

        public async Task<string> GetLevelForPlayer(string uid)
        {
            var opponentId = (await _redis.ScriptEvaluateAsync(LuaScripts.getOpposingPlayerByPlayer, new RedisKey[] { uid })).ToString();
            if (opponentId != null)
            {
                string key = Util.Key(uid, opponentId);
                return (await _redis.ScriptEvaluateAsync(LuaScripts.getLevelForPlayer, new RedisKey[] {uid, key})).ToString();
            }

            return null;
        }

        private char getRandomLetter()
        {
            Random random = Random.Shared;
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
