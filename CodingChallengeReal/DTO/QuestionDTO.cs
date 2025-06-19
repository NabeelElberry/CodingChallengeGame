using System.Text.Json.Serialization;

namespace CodingChallengeReal.DTO
{
    public class QuestionDTO
    {
        [JsonPropertyName("id")]
        public string id { get; set; }
        [JsonPropertyName("pk")]
        public string pk => $"q#{id}";
        [JsonPropertyName("sk")]
        public string sk { get; set; }
        [JsonPropertyName("name")]
        public string name { get; set; }
        [JsonPropertyName("description")]
        public string description { get; set; }
        [JsonPropertyName("difficulty")]
        public int difficulty { get; set; }
    }
}
