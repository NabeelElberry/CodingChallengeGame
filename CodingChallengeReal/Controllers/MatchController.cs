using AutoMapper;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Misc;
using CodingChallengeReal.Repositories.Implementation;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;

namespace CodingChallengeReal.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class MatchController : Controller
    {
        private readonly IMatchService _matchService;
        private readonly IHubContext<MatchHub> _matchHub;
        private readonly EnqueueService _enqueueService;
        private readonly IMatchRepository _matchRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public MatchController(IMatchRepository matchRepository, IMapper mapper, IUserRepository userRepository, EnqueueService enqueueService, IHubContext<MatchHub> matchHub, IMatchService matchService)
        {
            _matchService = matchService;
            _matchHub = matchHub;
            _enqueueService = enqueueService;
            _matchRepository = matchRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

    
        [HttpPost]
        public async Task<IActionResult> AddMatchAsync(AddMatchDTO addMatchRequest)
        {
            var match = await _matchService.AddMatchAsync(addMatchRequest);

            return Ok(match);
        }


        [HttpGet]
        public async Task<IActionResult> GetMatchAsync(String id)
        {
            var matchDTO = await _matchRepository.GetAsync(id);
            return Ok(matchDTO);
        }


        [HttpDelete]
        public async Task<IActionResult> DeleteMatchAsync(Guid id)
        {
            var deletedUserBool = await _matchRepository.DeleteAsync(id);

            return Ok(deletedUserBool);
        }


        [HttpPut]
        public async Task<IActionResult> UpdateMatchAsync(Guid id, AddMatchDTO addMatchDTO)
        {
            MatchDTO match = await _matchRepository.GetAsync(id.ToString());

            if (match == null)
            {
                return Ok(false);
            }
            match.user1 = addMatchDTO.user1;
            match.user2 = addMatchDTO.user2;
            match.winner = addMatchDTO.winner;
            match.question_id = addMatchDTO.question_id;
            match.winning_soln_code = addMatchDTO.winning_soln_code;
            var updatedUser = await _matchRepository.UpdateAsync(id, _mapper.Map<Match>(match));

            return Ok(updatedUser);
        }

        [HttpPost]
        [Route("/queueUsers")]
        public async Task<IActionResult> QueueUsersTogetherAsync(string userId, int mmr)
        {
            int searchRadius = 0;
            (int, int) min_max = _enqueueService.EnqueuePlayer(userId, mmr); // enqueue the player into redis database
            var min = min_max.Item1;
            var max = min_max.Item2;
            var original = $"elo_queue_{min}_{max}";
            // find user in specific elo bracket, if none found expand out after 10 seconds
           MatchResultDTO? result = null;

            // does 10 different brackets
            for (int r = 0; r < 10; r++)
            {
                // go through all the brackets up to searchRadius, guaranteed to be at least 1
                for (int i = 0; i < r; i++)
                {

                    var offset = searchRadius * 100;

                    var lowerBucket = original;
                    var upperBucket = $"elo_queue_{min + (offset)}_{max + (offset)}";
                    if (min != 0)
                    {
                        lowerBucket = $"elo_queue_{min - (offset)}_{max - (offset)}";
                    }

                    Console.WriteLine("Searching original...");
                    result = await _enqueueService.AttemptMatchPlayer(min, max, userId); // search original bracket


                    if (lowerBucket != original && result == null) // actually search the lower bucket if different than original bracket, and match not found
                    {
                        result = await _enqueueService.AttemptMatchPlayer(min - offset, max - offset, userId);

                        Console.WriteLine($"Searching lower bucket {min - offset} {max - offset}");
                    }
                    if (result == null) // search upper bracket if nothing was found in lower
                    {
                        result = await _enqueueService.AttemptMatchPlayer(min + offset, max + offset, userId);
                        Console.WriteLine($"Searching upper bucket {min + offset} {max + offset}");
                    }

                    if (result != null) // match was found, stop queueing
                    {
                        if (result?.Opponent != null && result.IsInitiator) // only one match will be made depending on who the "initiator" was.
                        {
                            AddMatchDTO matchDto = new AddMatchDTO(userId, result.Opponent, null, null, null);
                            var match = await _matchService.AddMatchAsync(matchDto); // makes a match in DB

                            await _matchHub.Clients.User(userId).SendAsync("MatchFound", match.id);
                            await _matchHub.Clients.User(result.Opponent.Value).SendAsync("MatchFound", match.id);
                            Console.WriteLine($"userId: {userId}, OPPONENT VAL: {result.Opponent.Value}, OPPONENT: {result.Opponent}");
                            
                            return Ok(matchDto);
                        } else
                        {
                            return Ok(true);
                        }

                    }
                    Console.WriteLine($"Found match in search radius {searchRadius}: {result != null}");
                }
                searchRadius += 1;
            }


            return Ok(null);

        }
        [HttpGet("debug-claims")]
        public IActionResult DebugClaims()
        {
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"{claim.Type}: {claim.Value}");
            }

            return Ok("Check console output.");
        }
    }
    
}
