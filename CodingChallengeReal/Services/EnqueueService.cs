using System.Numerics;
using CodingChallengeReal.DTO;
using StackExchange.Redis;

namespace CodingChallengeReal.Services
{
    public class EnqueueService
    {
        private readonly IDatabase _redis;
        private readonly int _bucketSize = 100;
        private string redisConnection = "localhost";
        public EnqueueService(IConnectionMultiplexer connectionMultiplexer)
        {
            _redis = connectionMultiplexer.GetDatabase();
        }

        public (int, int) EnqueuePlayer(string playerId, double elo)
        {
            (int, int) min_max = EloHelper.GetBucketRange(elo);
            string queueKey = EloHelper.GetBucketKey(elo);
            _redis.ListRightPush(queueKey, playerId);
            Console.WriteLine($"Enqueued {playerId} into {queueKey}");
            return min_max;
        }

        public async Task<MatchResultDTO?> AttemptMatchPlayer(int minBucket, int maxBucket, string playerId)
        {
            bool matchFound = false;
            var key = $"elo_queue_{minBucket}_{maxBucket}";
            var matchedSetKey = "matched_players_set";
            var matchHashKey = "match_pairs"; // stores all current matches, with the pairs of players
            var startTime = DateTime.UtcNow;

            if (await _redis.SetContainsAsync(matchedSetKey, playerId)) // player already in match, do nothing
            {
                await _redis.ListRemoveAsync(key, playerId);
                return null;
            }

            await _redis.ListRemoveAsync(key, playerId); // remove so player can't match with themselvs
            // while we haven't found a match, and we haven't exceeded 10 seconds in the same bucket, keep searching 
            while (startTime.AddSeconds(10) > DateTime.UtcNow)
            {
                var opponent = await _redis.ListRightPopAsync(key); // opponent popped
                var player = (RedisValue)playerId;

                if (opponent.HasValue) // anyone in the queue
                {

                    // Check if opponent is already matched
                    if (!await _redis.SetContainsAsync(matchedSetKey, opponent))
                    {

                        // players are currently engaged in match
                        await _redis.SetAddAsync(matchedSetKey, playerId);
                        await _redis.SetAddAsync(matchedSetKey, opponent);
                        Console.WriteLine($"Opponent in Enqueue Service: {opponent}"); 

                        HashEntry[] hashEntryArr = { new HashEntry(playerId, opponent), new HashEntry(opponent, playerId) };

                        Console.WriteLine($"hash entry arr: {string.Join(", ", hashEntryArr.Select(h => $"{h.Name}={h.Value}"))}");


                        // match recorded in hash to see who was matched with
                        try
                        {
                            // ... all the code to prepare the hashEntryArr ...

                            await _redis.HashSetAsync(matchHashKey, hashEntryArr);

                            // This line will only run if the HashSetAsync call succeeds.
                            // If you don't see this, it failed.
                            Console.WriteLine($"Successfully added hash entries for {playerId} and {opponent}.");

                            return new MatchResultDTO
                            {
                                Opponent = opponent,
                                IsInitiator = true,
                            };
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Caught exception {ex}");
                        }
                            return new MatchResultDTO
                        {
                            Opponent = opponent,
                            IsInitiator = true,
                        };
                    }
                    else
                    {
                        // Put back if already matched
                        await _redis.ListRightPushAsync(key, opponent);
                    }
                }

                // player matched with someone earlier as a non-initiator, so return good result
                var result = await _redis.HashGetAsync(matchHashKey, playerId);

                if (result.HasValue)
                {

                    var opponentId = (string) result;
                    await _redis.SetAddAsync(matchedSetKey, playerId);
                    await _redis.HashDeleteAsync(matchHashKey, new RedisValue[] { playerId, opponentId });
                    Console.WriteLine("Deleting a match");
                    return new MatchResultDTO
                    {
                        Opponent = opponentId,
                        IsInitiator = false
                    };
                }
                await Task.Delay(200);
            }



            // no match was found
            await _redis.ListRightPushAsync(key, playerId);
            return null;
        }


        public async Task FinalizeMatchAsync(string playerA, string playerB)
        {
            var matchedSetKey = "matched_players_set";
            var matchHashKey = "match_pairs";

            await _redis.SetRemoveAsync(matchedSetKey, new RedisValue[] { playerA, playerB });
            await _redis.HashDeleteAsync(matchHashKey, new RedisValue[] { playerA, playerB });
        }

    }
}