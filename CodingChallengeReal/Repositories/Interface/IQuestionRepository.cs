using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;

namespace CodingChallengeReal.Repositories.Interface
{
    public interface IQuestionRepository
    {
        public Task<QuestionDTO> GetAsync(Guid id);
        public Task<bool> AddAsync(Question question);
        public Task<bool> DeleteAsync(Guid id);
        public Task<bool> UpdateAsync(Guid id, Question question);

    }
}
