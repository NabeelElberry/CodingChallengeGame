using CodingChallengeReal.Domains;
using System.Text.Json.Serialization;

namespace CodingChallengeReal.DTO
{
    public class ProblemSetDTO
    {
        [JsonPropertyName("id")]
        public string id { get; set; }
        [JsonPropertyName("pk")]
        public string pk => $"ps#{id}";
        [JsonPropertyName("sk")]
        public string sk = "meta";
        [JsonPropertyName("questions")]
        public List<Question> Questions { get; set; }


    }
}
