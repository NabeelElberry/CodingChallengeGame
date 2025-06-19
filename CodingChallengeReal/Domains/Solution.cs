namespace CodingChallengeReal.Domains
{
    public class Solution
    {
        public string id { get; set; }
        public string pk => $"s#{id}";
        public string sk { get; set; }
        public string name { get; set; }
        public string description { get; set; }
        public int difficulty { get; set; }

    }
}
