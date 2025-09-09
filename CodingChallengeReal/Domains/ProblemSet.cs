namespace CodingChallengeReal.Domains
{
    public class ProblemSet
    {
        public string id { get; set; }
        public string pk => $"ps#{id}";
        public string sk = "meta";
        public List<Question> Questions { get; set; }

    }
}
