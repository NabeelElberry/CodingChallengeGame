namespace CodingChallengeReal.Domains
{
    public class Match
    {

        public string id { get; set; }
        public string pk => $"m#{id}";
        public string sk { get; set; }
        public string user1 { get; set; }
        public string user2 { get; set; }
        public int? winner { get; set; }

    }
}
