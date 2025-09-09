using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;

namespace CodingChallengeReal.Repositories.Interface
{
    public interface IProblemSetRepository
    {
        public Task<ProblemSetDTO> GetAsync(Guid id);
        public Task<bool> AddAsync(ProblemSet question);
        public Task<bool> DeleteAsync(Guid id);
        public Task<bool> UpdateAsync(Guid id, ProblemSet question);
    }
}
