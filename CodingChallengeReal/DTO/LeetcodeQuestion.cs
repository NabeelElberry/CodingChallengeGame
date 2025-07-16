namespace CodingChallengeReal.DTO
{
    public class LeetcodeQuestion
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string TitleSlug { get; set; }
        public bool PaidOnly { get; set; }
        public string Difficulty { get; set; }
        public string FunctionSignature { get; set; }
        public string ExampleInput { get; set; }
        public string ExampleOutput { get; set; }
        public string Status { get; set; }
        public string Description { get; set; }

        public ICollection<TopicTag> TopicTags { get; set; }
    }

    public class TopicTag
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
