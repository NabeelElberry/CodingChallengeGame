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
        [JsonPropertyName("title")]
        public string Title { get; set; }
        [JsonPropertyName("description")]
        public string Description { get; set; }
        [JsonPropertyName("difficulty")]
        public int Difficulty { get; set; }
        [JsonPropertyName("sample_test_cases")]
        public List<TestCaseDTO> SampleTestCases { get; set; }
        [JsonPropertyName("hidden_test_cases")]
        public List<TestCaseDTO> HiddenTestCases { get; set; }
        [JsonPropertyName("boilerplate")]
        public Dictionary<string, string> Boilerplate { get; set; }
        [JsonPropertyName("method_name")]
        public String MethodName { get; set; }
        [JsonPropertyName("compare_func")]
        public Dictionary<String, String> CompareFunc { get; set; }


    }
}
