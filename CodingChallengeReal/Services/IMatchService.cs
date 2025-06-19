using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;

namespace CodingChallengeReal.Services
{
    public interface IMatchService
    {

        public Task<Match> AddMatchAsync(AddMatchDTO addMatchRequest);
    }
}
