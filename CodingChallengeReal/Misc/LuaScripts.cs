namespace CodingChallengeReal.Misc
{
    public class LuaScripts
    {


        public static string luaInsertScript = @"
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

        public static string luaEditLevelScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }

        local matchKey   = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local newValue  = ARGV[2]

        -- logic is simple, edits the field to be whatever new value
    
        local prevVal = redis.call('HGET', matchKey, 'level:' .. playerId)
        
        redis.call('HSET', matchKey, 'level:' ..  playerId, prevVal + newValue)
        return true;
";


        public static string luaEditTimeScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }

        local matchKey   = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local newValue  = ARGV[2]

        -- logic is simple, edits the field to be whatever new value

        redis.call('HSET', matchKey, 'time:' ..  playerId, newValue)
        return true;
";


        public static string luaGetLevelAndGameOrderScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }
 

        local matchKey = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local returnArr = {}

        -- Gets an array with index 1 as level, index 2 is order of game
        
        returnArr[1] = redis.call('HGET', matchKey, 'level:' ..  playerId)
        returnArr[2] = redis.call('HGET', matchKey, 'minigameOrder')
        return returnArr;";

        public static string luaGetTimeScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }
 

        local matchKey = KEYS[1] -- match key as set
        local playerId = ARGV[1]
        local returnArr = {}

        -- logic is simple, edits the field to be whatever new value
        
        local time = redis.call('HGET', matchKey, 'time:' ..  playerId)
        
        return time;";



        public static string checkIfInitiator = @"
        -- KEYS = {playerId}
        
        local playerId = KEYS[1]

        local returnVal = redis.call('SISMEMBER', 'initiators', playerId)
    
        return returnVal;
        ";

        public static string checkIfRedisHashPopulated = @"
        -- KEYS = { matchKey }

        local matchKey = KEYS[1]
        return redis.call('HEXISTS', matchKey, 'minigameOrder')
        ";

        public static string makeMatchScript = @"
        -- KEYS = { queueKey, matchedSetKey, matchHashKey }
        -- ARGV = { playerId }

        local queueKey   = KEYS[1]
        local matchedSet = KEYS[2] -- stores all users
        local matchHash  = KEYS[3] -- stores user pairs
        local me         = ARGV[1]

        -- 0) If I'm marked busy (initiator from a previous match), don't requeue.
        if redis.call('SISMEMBER', matchedSet, me) == 1 then
          redis.call('LREM', queueKey, 0, me)
          return { 'busy'}
        end

        -- 1) If someone already paired me, I'm the joiner.
        local theirOpp = redis.call('HGET', matchHash, me)
        if theirOpp then -- mark me busy
          redis.call('LREM', queueKey, 0, me)
          redis.call('SADD', matchedSet, me)
          return { 'joiner', theirOpp }
        end

        -- 2) Not enough people in line
        if redis.call('LLEN', queueKey) < 2 then
          return nil
        end

        -- 3) Remove me so I don't self-match
        redis.call('LREM', queueKey, 0, me)

        -- 4) Try to pop an opponent
        local opp = redis.call('RPOP', queueKey)
        if opp then
          -- Opponent must not be busy (initiator elsewhere) and must not be hash-paired already
          if redis.call('SISMEMBER', matchedSet, opp) == 0 and redis.call('HEXISTS', matchHash, opp) == 0 then
            -- Mark ONLY ME (initiator) busy
            redis.call('SADD', matchedSet, me)
            -- Record pairing both ways
            redis.call('HSET', matchHash, me, opp, opp, me)
            -- Ensure opp not lingering in queue
            redis.call('LREM', queueKey, 0, opp)
            redis.call('SADD', 'initiators', me) -- adding myself to a set of initiators
            return { 'initiator', opp }
          else
            -- Put them back if they were busy/paired
            redis.call('RPUSH', queueKey, opp)
          end
        end

        -- 5) Nothing to do
        return nil

        ";

        public static string lua_script = @"
        -- KEYS = { queueKey}
        -- ARGV = { playerId }
           
        local key = KEYS[1]
        -- whether or not the user declined
        local accepted = ARGV[1]    
        
        if redis.call('HEXISTS', key, 'init') == 0 then
            redis.call('HSET', key, 'init', 2)
        end
        local getKey = tonumber(redis.call('HGET', key, 'init'))

    
        -- case where someone else before you declined
        if getKey == -10 then
            return 'declined'
        end

        if accepted == 'false' or accepted == 'False' or not accepted then

            if getKey == 1 then
                return 'accepted_declined'
            else 
                redis.call('HSET', key, 'init', -10)
                return 'declined_first'
            end
            
        else
            
            if getKey == 2 then
                -- decrements by 1
                redis.call('HINCRBY', key, 'init', -1)
                return 'first_accepted'
            elseif getKey == 1 then
                return 'make_match'
            end
        end

        ";


        public static string getOpposingPlayerByPlayer = @"
        -- KEYS = { matchKey }

        local userIdKey = KEYS[1]
        return redis.call('HGET', 'match_pairs', userIdKey)
        ";

        public static string removeTracesFromRedis = @"
        -- KEYS = {uid1, uid2, togetherKey}

        local uid1 = KEYS[1]
        local uid2 = KEYS[2]
        local tgtKey = KEYS[3]

        -- deleting from match pairs
        redis.call('HDEL', 'match_pairs', uid1)
        redis.call('HDEL', 'match_pairs', uid2)
        
        -- deleting from initiators
        if redis.call('SISMEMBER', 'initiators', uid1) == 1 then
            redis.call('SREM', 'initiators', uid1) 
        else 
            redis.call('SREM', 'initiators', uid2) 
        end

        -- deleting from all_matched
        redis.call('SREM', 'all_matched', uid1)
        redis.call('SREM', 'all_matched', uid2)        

        redis.call('DEL', tgtKey)
        ";

        public static string getLevelForPlayer = @"

        -- KEYS = {uid, togetherKey}

        local uid = KEYS[1]
        local tgtKey = KEYS[2]

        local levelKey = 'level:' .. uid

        return redis.call('HGET' tgtKey, levelKey)
        ";
    }
}
