using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model.Internal.MarshallTransformations;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Misc;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using System.CodeDom;

namespace CodingChallengeReal.Services
{
    public class QueueHandler
    {

        private readonly IDatabase _redis;
        private readonly string InQueueStr = "ids_in_queue";
        public QueueHandler(IConnectionMultiplexer redisConnection)
        {
            _redis = redisConnection.GetDatabase();
        }


        private async Task<bool> CheckForCancellation(string playerId, string baseQueueKey)
        {
            bool inQueue = await _redis.SetContainsAsync(InQueueStr, playerId);
            if (!inQueue)
            {
                Console.WriteLine($"Queue cancel received in AttemptMatchPlayer for : {playerId} in elo {baseQueueKey}");
                // they're already removed from the compQueue hash in the cancel queue function
                await _redis.ListRemoveAsync(baseQueueKey, playerId); // remove them from the queue
                return true; // was removed from the queue so stop searching
            }
            return false;
        }

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
            var loopNumber = 2;

            await _redis.ListLeftPushAsync(queueKey, playerId); // add the player to the elo at the left of the list
            await _redis.SetAddAsync(InQueueStr, playerId); // TODO: MAKE SURE TO CHANGE THIS TO BE DYNAMIC FOR CASUAL MODE

            // will keep running until the time per bucket is done, 
            while (minBucket-(loopNumber*100) > minElo || maxBucket+(loopNumber*100) < maxElo)
            {
                // stop queueing in the big loop
                bool cancelled = await CheckForCancellation(playerId, queueKey);
                if (cancelled) return null;

                Console.WriteLine($"Checking {queueKey} for player: {playerId}");
                // check for the default queue key first
                var result = await CheckForMatch(queueKey, playerId, perBucketTimeout, queueKey);
                if (result != null)
                {
                    Console.WriteLine($"Found result in {queueKey} for player: {playerId}");
                    return result; 
                }

                // go through all buckets starting from the closest ones, then up to the new max, which will increase by 100 everytime
                // eg, elo is 550 => 500 => (500, 600) => ((500, 600), (400, 500), (600, 700)) => ((500,600), (400, 500), (600, 700), (300, 400), (700, 800)), etc...
                for (int i = 1; i < loopNumber; i++) 
                {
                    // stop queueing in sub loops
                    cancelled = await CheckForCancellation(playerId, queueKey);
                    if (cancelled) return null;
                    Console.WriteLine($"Current I: {i}, loopNumber: {loopNumber}");
                    if (maxBucket + (i * 100) <= 1000)
                    {
                        queueKeyUpper = $"elo_{minBucket + (i * 100)}_{maxBucket + (i * 100)}"; // key for the bucket
                        Console.WriteLine($"Checking {queueKeyUpper} for player: {playerId}...");
                        result = await CheckForMatch(queueKeyUpper, playerId, perBucketTimeout, queueKey);
                        if (result != null)
                        {
                            Console.WriteLine($"Found result in {queueKeyUpper}  for player: {playerId}");
                            return result;
                        }
                    }

                    if (minBucket - (i * 100) > 0)
                    {
                        
                        queueKeyLower = $"elo_{minBucket - (i * 100)}_{maxBucket - (i * 100)}";
                        Console.WriteLine($"Checking {queueKeyLower}  for player: {playerId}...");
                        result = await CheckForMatch(queueKeyLower, playerId, perBucketTimeout, queueKey);
                        if (result != null)
                        {
                            Console.WriteLine($"Found result in {queueKeyLower}  for player: {playerId}");
                            return result;
                        }
                    }
                }
                loopNumber += 1;
            }

            await _redis.ListRightPushAsync(queueKey, playerId); // readd the player to the queue if nothing was found
            return null;
        }
        
        private async Task<MatchResultDTO> CheckForMatch(string queueKey, string playerId, int timeToCheck, string baseQueueKey)
        {
            var matchedSet = (RedisKey)"all_matched"; // matched set stores all users in a match
            var matchedHashmap = (RedisKey)"match_pairs"; // stores the pairs in match with each other
            RedisResult[] result = [];
            var deadline = DateTime.UtcNow + TimeSpan.FromSeconds(timeToCheck);
            while (result.IsNullOrEmpty() && DateTime.UtcNow < deadline)
            {
                var scriptResult = await _redis.ScriptEvaluateAsync(LuaScripts.makeMatchScript, // arguments for the script
                    new RedisKey[] { queueKey, matchedSet, matchedHashmap }, // keys
                    new RedisValue[] { playerId } // player queueing
                );

                if (scriptResult.IsNull)
                {
                    // No match yet—wait a bit before trying again
                    bool cancelled = await CheckForCancellation(playerId, queueKey);
                    if (cancelled) return null;
                    await Task.Delay(200);
                    
                } else
                {
                    result = ((RedisResult[]?)scriptResult);
                }
            }

            if (result.Length != 0) // match found break out
            {
                if (result.Length == 1) // we are busy, just return null.
                {
                    return null;
                }

                var role = (string)result[0];
                var opponent = (string)result[1];

                Console.WriteLine($"Got something! role: {role} opponent {opponent}");
                await _redis.SetRemoveAsync(InQueueStr, playerId); // removing from the comp queue
                return new MatchResultDTO
                {
                    Opponent = opponent,
                    IsInitiator = role == "initiator"
                };
                
            }
            return null; 
        }

        public async Task<bool> CancelPlayerQueue(string playerId) 
        {
            return await _redis.SetRemoveAsync(InQueueStr, playerId);
        }
    }
}
