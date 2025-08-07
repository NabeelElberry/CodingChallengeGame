using StackExchange.Redis;

namespace CodingChallengeReal.DTO
{
    public class MatchResultDTO
    {
        public RedisValue? Opponent { get; set; }
        public bool IsInitiator { get; set; } // ← true only if you found someone
    }

}
