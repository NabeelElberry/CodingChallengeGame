using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model.Internal.MarshallTransformations;
using CodingChallengeReal.DTO;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

namespace CodingChallengeReal.Services
{
    public class Matchmaker
    {

        private readonly IDatabase _redis;

        public Matchmaker(IConnectionMultiplexer redisConnection)
        {
            _redis = redisConnection.GetDatabase();
        }

        const string lua = @"
            -- KEYS = { queueKey, matchedSetKey, matchHashKey }
            -- ARGV = { playerId }

            local queueKey    = KEYS[1]
            local matchedSet  = KEYS[2]
            local matchHash   = KEYS[3]
            local me          = ARGV[1]

            -- 5) Maybe someone else matched me in the meantime?
            local theirOpp = redis.call('HGET', matchHash, me)
            if theirOpp then
                redis.call('SADD', matchedSet, me)
                -- redis.call('HDEL', matchHash, me, theirOpp)
                -- scrub my entry in case I’m still in line somewhere
                redis.call('LREM', queueKey, 0, me)
                return { 'joiner', theirOpp }
            end


            -- 1) If I’m already matched, just clean myself up
            if redis.call('SISMEMBER', matchedSet, me) == 1 then
                redis.call('LREM', queueKey, 0, me)
                return nil
            end

            -- 2) If fewer than 2 in line, bail out (keeps the list alive)
            if redis.call('LLEN', queueKey) < 2 then
                return nil
            end

            -- 3) Remove me so I don’t self-match
            redis.call('LREM', queueKey, 0, me)

            -- 4) Try to pop someone off the right
            local opp = redis.call('RPOP', queueKey)
            if opp then
                -- If they’re free, record the match and scrub both entries
                if redis.call('SISMEMBER', matchedSet, opp) == 0 then
                -- mark busy
                redis.call('SADD', matchedSet, me, opp)
                -- record pairing
                redis.call('HSET', matchHash, me, opp, opp, me)
                -- ensure neither remains in the queue
                redis.call('LREM', queueKey, 0, opp)
                -- return initiator + opponent
                return { 'initiator', opp }
                else
                -- if they were already busy, put them back
                redis.call('RPUSH', queueKey, opp)
                end
            end

           
            

            -- 6) Nothing to do
            return nil
        ";


        public async Task<MatchResultDTO?> AttemptMatchPlayer(
            int elo,
            string playerId
            )
        {

            var minBucket = Math.Floor((decimal)elo / 100) * 100; // elo is 990, 990/100 => 9.9 => 9 => 900
            var maxBucket = (Math.Floor((decimal)elo / 100) * 100) + 100; // elo is 990, 990/100 => 9.9 => 9 => 900 => 1000, so elo bucket is 900-1000
            var perBucketTimeout = 10; // 10 seconds
            
            var queueKey = $"elo_{minBucket}_{maxBucket}"; // follows format of elo_min_max; eg elo_100_200
            var queueKeyUpper = ""; // handles searching of 1 bracket higher, queueKeyUpper will be used as the default queueKey on first loop
            var queueKeyLower = ""; // handles searching of 1 bracket lower

            var maxElo = 1000;
            var minElo = 0;
            var loopNumber = 1;

            await _redis.ListLeftPushAsync(queueKey, playerId);
            Console.WriteLine($"Pushing {queueKey} with id: {playerId}");
            Console.WriteLine("Attempting to make match...");
            // will keep running until the time per bucket is done, 
            while (minBucket-(loopNumber*100) > minElo || maxBucket+(loopNumber*100) < maxElo)
            {

                Console.WriteLine($"Checking {queueKey}");
                // check for the default queue key first
                var result = await CheckForMatch(queueKey, playerId, perBucketTimeout);
                if (result != null)
                {
                    Console.WriteLine($"Found result in {queueKey}");
                    return result; 
                }

                // go through all buckets starting from the closest ones, then up to the new max, which will increase by 100 everytime
                // eg, elo is 550 => 500 => (500, 600) => ((500, 600), (400, 500), (600, 700)) => ((500,600), (400, 500), (600, 700), (300, 400), (700, 800)), etc...
                for (int i = 0; i < loopNumber; i++) 
                {
                    Console.WriteLine($"Checking {queueKeyUpper}...");
                    if (maxBucket + (loopNumber * 100) <= 1000)
                    {
                        queueKeyUpper = $"elo_{minBucket + (loopNumber * 100)}_{maxBucket + (loopNumber * 100)}"; // key for the bucket
                        result = await CheckForMatch(queueKeyUpper, playerId, perBucketTimeout);
                        if (result != null)
                        {
                            Console.WriteLine($"Found result in {queueKeyUpper}");
                            return result;
                        }
                    }

                    Console.WriteLine($"Checking {queueKeyLower}...");

                    if (minBucket - (loopNumber * 100) >= 0)
                    {
                        queueKeyLower = $"elo_{minBucket - (loopNumber * 100)}_{maxBucket - (loopNumber * 100)}";
                        result = await CheckForMatch(queueKeyLower, playerId, perBucketTimeout);
                        if (result != null)
                        {
                            Console.WriteLine($"Found result in {queueKeyLower}");
                            return result;
                        }
                    }
                }
                loopNumber += 1;
            }

            await _redis.ListRightPushAsync(queueKey, playerId); // readd the player to the queue if nothing was found
            return null;
        }
        
        private async Task<MatchResultDTO> CheckForMatch(string queueKey, string playerId, int timeToCheck)
        {
            var matchedSet = (RedisKey)"all_matched"; // matched set stores all users in a match
            var matchedHashmap = (RedisKey)"match_pairs"; // stores the pairs in match with each other
            RedisResult[] result = [];
            var deadline = DateTime.UtcNow + TimeSpan.FromSeconds(timeToCheck);
            while (result.IsNullOrEmpty() && DateTime.UtcNow < deadline)
            {
                var scriptResult = await _redis.ScriptEvaluateAsync(lua, // arguments for the script
                    new RedisKey[] { queueKey, matchedSet, matchedHashmap }, // keys
                    new RedisValue[] { playerId } // player queueing
                );

                if (scriptResult.IsNull)
                {
                    // No match yet—wait a bit before trying again
                    await Task.Delay(200);
                } else
                {
                    result = ((RedisResult[]?)scriptResult);
                }
            }


            if (result.Length != 0) // match found break out
            {

                Console.WriteLine($"Array: {result}: array length: {result.Length}");

                foreach (RedisResult r in result)
                {
                    Console.WriteLine($"item: {r.ToString()}");
                }

                var role = (string)result[0];
                var opponent = (string)result[1];

                Console.WriteLine($"Got something! role: {role} opponent {opponent}");

                return new MatchResultDTO
                {
                    Opponent = opponent,
                    IsInitiator = role == "initiator"
                };
            }
            return null; 
        }
       

    }
}
