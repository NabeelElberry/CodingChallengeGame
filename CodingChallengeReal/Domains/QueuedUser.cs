namespace CodingChallengeReal.Domains
{
    public class QueuedUser
    {
        public string id { get; set; }
        public string pk => $"eq#{id}";
        public string sk { get; set; }
        public int MMR { get; set; }
    }
}
