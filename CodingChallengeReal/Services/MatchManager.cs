using CodingChallengeReal.DTO;
using CodingChallengeReal.Misc;
using StackExchange.Redis;

namespace CodingChallengeReal.Services
{
    public class MatchManager
    {
        private readonly IDatabase _redis;

        public MatchManager(IConnectionMultiplexer redisConnection)
        {
            _redis = redisConnection.GetDatabase();
        }

        const string luaInsertScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }


        local matchKey   = KEYS[1] -- match key as set
        local playerOneId = ARGV[1]
        local playerTwoId  = ARGV[2]
        local minigameOrder = ARGV[3]

        -- logic is simple, just make a list with matchKey as the list name, and two values inside it 
        -- structure looks like this: List: {matchKey} Values: {playerOneId-

        redis.call('HSET', matchKey, 'level:' ..  playerOneId, 1, 'level:' .. playerTwoId, 1, 'minigameOrder', minigameOrder)
        return true;

";

        const string luaEditScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }

        local matchKey   = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local newValue  = ARGV[2]

        -- logic is simple, edits the field to be whatever new value

        redis.call('HSET', matchKey, 'level:' ..  playerId, newValue)
        return true;
";


        const string luaGetScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }
 

        local matchKey = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local returnArr = {}

        -- logic is simple, edits the field to be whatever new value
        
        returnArr[1] = redis.call('HGET', matchKey, 'level:' ..  playerId)
        returnArr[2] = redis.call('HGET', matchKey, 'minigameOrder')
        return returnArr;";

        /// <summary>
        /// Run this when a game is created, makes a redis hash which sets both players level to 1.
        /// </summary>
        /// <param name="matchId"></param>
        /// <param name="playerOneId"></param>
        /// <param name="playerTwoId"></param>
        /// <returns></returns>
        public async Task<String> CreateGameManager(string matchId, string playerOneId, string playerTwoId) 
        {
            Random random = new Random();
            string minigameOrderString = "";
            for (int i = 0; i < 5; i++)
            {
                minigameOrderString += random.Next(0, 4).ToString();
            }

            var scriptResult = await _redis.ScriptEvaluateAsync(luaInsertScript, // arguments for the script
                    new RedisKey[] { matchId }, // key
                    new RedisValue[]
                    {
                        playerOneId, playerTwoId, minigameOrderString
                    }

                );
            return scriptResult.ToString();
        }

        /// <summary>
        /// Run this when updating the player's level, should run every time they move up.
        /// </summary>
        /// <param name="matchId"></param>
        /// <param name="playerId"></param>
        /// <param name="newValue"></param>
        /// <returns></returns>
        public async Task<String> EditGameManager(string matchId, string playerId, int newValue)
        {
            var scriptResult = await _redis.ScriptEvaluateAsync(luaEditScript, // arguments for the script
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

        public async Task<String> GetCurrentLevel(string matchId, string playerId)
        {
            var scriptResult = await _redis.ScriptEvaluateAsync(luaGetScript, // arguments for the script
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
            var partner = await GetPartner(uid);
            var matchKey = Util.Key(uid, partner);

            return await _redis.HashGetAllAsync(matchKey);
        }
    }
}
