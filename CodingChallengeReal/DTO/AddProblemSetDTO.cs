using CodingChallengeReal.Domains;
using System.Text.Json.Serialization;

namespace CodingChallengeReal.DTO
{
    public class AddProblemSetDTO
    {
        public List<Question> Questions { get; set; }

        public AddProblemSetDTO(List<Question> questions) {
            this.Questions = questions;
        }
    }
}
