using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;

namespace CodingChallengeReal.Repositories.Interface
{
    public interface ISolutionRepository
    {
        public Task<SolutionDTO> GetAsync(Guid id);
        public Task<bool> AddAsync(Solution solution);
        public Task<bool> DeleteAsync(Guid id);
        public Task<bool> UpdateAsync(Guid id, Solution solution);
    }
}
