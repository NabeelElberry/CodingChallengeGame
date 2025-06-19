namespace CodingChallengeReal.Domains
{
    public class User
    {
        public string id { get; set; }
        public string pk => $"u#{id}";
        public string sk { get; set; }
        public string username { get; set; }
        public string password { get; set; }
        public string email { get; set; }
        public int mmr { get; set; }
    }
}
