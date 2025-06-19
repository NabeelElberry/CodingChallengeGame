using System.Text.Json.Serialization;

namespace CodingChallengeReal.DTO
{
    public class AddQuestionDTO
    {
        public string name { get; set; }
        public string description { get; set; }
        public int difficulty { get; set; }
    }
}
