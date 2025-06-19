namespace CodingChallengeReal.Domains
{
    public class Question
    {
        public string id { get; set; }
        public string pk => $"q#{id}";
        public string sk { get; set; }
        public string name { get; set; }
        public string description { get; set; }
        public int difficulty   { get; set; }

    }
}
