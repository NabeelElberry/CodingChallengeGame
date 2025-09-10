using CodingChallengeReal.DTO;
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


        local matchListName   = KEYS[1] -- match key as set
        local playerOneId = KEYS[2]
        local playerTwoId  = KEYS[3]

        -- logic is simple, just make a list with matchListName as the list name, and two values inside it 
        -- structure looks like this: List: {matchListName} Values: {playerOneId-

        redis.call('HSET', matchKey, 'level:' ..  playerOneId, 1, 'level:' .. playerTwoId, 1)";

        const string luaEditScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }

        local matchListName   = KEYS[1] -- match key as set
        local playerId = KEYS[2]
        local newValue  = KEYS[3]

        -- logic is simple, edits the field to be whatever new value

        redis.call('HSET', matchKey, 'level:' ..  playerId, newValue)";


        const string luaGetScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }
 

        local matchListName   = KEYS[1] -- match key as set
        local playerId = KEYS[2]


        -- logic is simple, edits the field to be whatever new value

        redis.call('HGET', matchKey, 'level:' ..  playerId)";

        public async Task<String> CreateGameManager(string matchId, string playerOneId, string playerTwoId) 
        {
            var scriptResult = await _redis.ScriptEvaluateAsync(luaInsertScript, // arguments for the script
                    new RedisKey[] { matchId, playerOneId, playerTwoId } // key
                );
            return scriptResult.ToString();
        }

        public async Task<String> EditGameManager(string matchId, string playerId, int newValue)
        {
            var scriptResult = await _redis.ScriptEvaluateAsync(luaInsertScript, // arguments for the script
                new RedisKey[] { matchId, playerId, newValue.ToString() } // key
            );
            return scriptResult.ToString();
        }

        public async Task<String> GetCurrentLevel(string matchId, string playerId)
        {
            var scriptResult = await _redis.ScriptEvaluateAsync(luaInsertScript, // arguments for the script
                new RedisKey[] { matchId, playerId } // key
            );
            return scriptResult.ToString();
        }
    }
}
