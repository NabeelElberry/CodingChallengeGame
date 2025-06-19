using System.Text.Json.Serialization;

namespace CodingChallengeReal.DTO
{
    public class UserDTO
    {
        [JsonPropertyName("id")]
        public string id { get; set; }
        [JsonPropertyName("pk")]
        public string pk => $"u#{id}";
        [JsonPropertyName("sk")]
        public string sk { get; set; }
        [JsonPropertyName("username")]
        public string username { get; set; }
        [JsonPropertyName("password")]
        public string password { get; set; }
        [JsonPropertyName("email")]
        public string email { get; set; }
        [JsonPropertyName("mmr")]
        public int mmr { get; set; }
    }
}
