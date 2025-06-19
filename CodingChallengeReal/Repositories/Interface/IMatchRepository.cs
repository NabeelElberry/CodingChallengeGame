using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;

namespace CodingChallengeReal.Repositories.Interface
{
    public interface IMatchRepository
    {
        public Task<MatchDTO> GetAsync(string id);
        public Task<bool> AddAsync(Match match);
        public Task<bool> DeleteAsync(Guid id);
        public Task<bool> UpdateAsync(Guid id, Match match);
    }
}
