namespace CodingChallengeReal.Misc
{
    public class Util
    {
        public static string Key(string u1, string u2) => string.CompareOrdinal(u1, u2) < 0 ? $"{u1}:{u2}" : $"{u2}:{u1}";
    }
}
