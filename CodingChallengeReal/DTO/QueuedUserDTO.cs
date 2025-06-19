using System.Text.Json.Serialization;

namespace CodingChallengeReal.DTO
{
    public class QueuedUserDTO
    {
        [JsonPropertyName("id")]
        public string id { get; set; }
        [JsonPropertyName("pk")]
        public string pk => $"eq#{id}";
        [JsonPropertyName("sk")]
        public string sk { get; set; }
        [JsonPropertyName("mmr")]
        public int MMR { get; set; }
    }
}
