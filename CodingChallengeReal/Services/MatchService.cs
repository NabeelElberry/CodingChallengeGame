using AutoMapper;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Interface;

namespace CodingChallengeReal.Services
{
    public class MatchService : IMatchService
    {
        private readonly IMatchRepository _matchRepository;
        private readonly IMapper _mapper;

        public MatchService(IMatchRepository matchRepository, IMapper mapper) {
            _matchRepository = matchRepository;
            _mapper = mapper;
        }

        public async Task<Match> AddMatchAsync(AddMatchDTO addMatchRequest)
        {
            Match match = _mapper.Map<Match>(addMatchRequest);
            match.id = Guid.NewGuid().ToString();
            match.sk = "meta";
            await _matchRepository.AddAsync(match);
            return match;
        }
    }
}
