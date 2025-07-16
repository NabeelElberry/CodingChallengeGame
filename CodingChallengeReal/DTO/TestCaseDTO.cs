using System.Text.Json.Serialization;

namespace CodingChallengeReal.DTO
{
    public class TestCaseDTO
    {
        [JsonPropertyName("input")]
        public string Input { get; set; }

        [JsonPropertyName("expected_output")]
        public string Output { get; set; }
    }
}
