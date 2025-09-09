using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;

namespace CodingChallengeReal.Repositories.Interface
{
    public interface IMatchService
    {

        public Task<Match> AddMatchAsync(AddMatchDTO addMatchRequest);
    }
}
