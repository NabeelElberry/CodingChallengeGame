namespace CodingChallengeReal.Services
{
    public static class EloHelper
    {
        public static (int, int) GetBucketRange(double elo, int bucketSize = 100)
        {
            int baseBucket = ((int)elo / bucketSize) * bucketSize;
            return (baseBucket, baseBucket + bucketSize - 1);
        }

        public static string GetBucketKey(double elo)
        {
            var (min, max) = GetBucketRange(elo);
            return ($"elo_queue_{min}_{max}");
        }
    }
}
