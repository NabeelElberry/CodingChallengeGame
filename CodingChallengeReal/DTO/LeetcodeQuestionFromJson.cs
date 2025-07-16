using System.Reflection;

namespace CodingChallengeReal.DTO
{
    public class LeetcodeQuestionFromJson
    {
        public string Title { get; set; }
        public string Source { get; set; }
        public string Description { get; set; }
        public string Difficulty { get; set; }
        public List<string> SampleTestCases { get; set; }
        public List<string> SampleTestResults { get; set; }
        public List<string> HiddenTestCases { get; set; }
        public List<string> HiddenTestResults { get; set; }
        public Dictionary<string, string> Boilerplate { get; set; }
        public string MethodName { get; set; }


    }
}
