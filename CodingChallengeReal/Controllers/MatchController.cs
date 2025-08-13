using System.Diagnostics;
using System.Text.Json;
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
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using static System.Net.WebRequestMethods;

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
        private readonly Matchmaker _matchmaker;
        private readonly IMatchRepository _matchRepository;
        private readonly IQuestionRepository _questionRepository;
        private readonly IMapper _mapper;
        // private readonly String Judge0URL = "http://107.23.165.87:2358";



        public MatchController(IMatchRepository matchRepository, IMapper mapper, IQuestionRepository questionRepository, EnqueueService enqueueService, IHubContext<MatchHub> matchHub, IMatchService matchService, Matchmaker matchmaker)
        {
            _matchService = matchService;
            _matchHub = matchHub;
            _enqueueService = enqueueService;
            _matchRepository = matchRepository;
            _questionRepository = questionRepository;
            _mapper = mapper;
            _matchmaker = matchmaker;
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
            var updatedUser = await _matchRepository.UpdateAsync(id, _mapper.Map<Match>(match));

            return Ok(updatedUser);
        }

        [HttpPost]
        [Route("/queueUsers")]
        public async Task<IActionResult> QueueUsersTogetherAsync(
            [FromQuery] string userId,
            [FromQuery] int mmr,
            [FromQuery] string mode)
        {

            if (mode == "casual") // casual mode doesn't need hard searching, slam everyone into the same redis queue and search from there
            {
                var redis_queue = "queue";

                return Ok(true);
            }
            else
            { // need search matchmaking for competitive
                MatchResultDTO? result = null;
                result = await _matchmaker.AttemptMatchPlayer(mmr, userId);

                if (result != null) // match was found, return true for initiator
                {
                    if (result?.Opponent != null && result.IsInitiator) // only one match will be made depending on who the "initiator" was.
                    {
                        AddMatchDTO matchDto = new AddMatchDTO(userId, result.Opponent, null);
                        //var match = await _matchService.AddMatchAsync(matchDto); // makes a match in DB

                        await _matchHub.Clients.User(userId).SendAsync("MatchFound");
                        await _matchHub.Clients.User(result.Opponent.Value).SendAsync("MatchFound");
                        Console.WriteLine($"userId: {userId}, OPPONENT VAL: {result.Opponent.Value}, OPPONENT: {result.Opponent}");

                        return Ok(new { initiator = true, matchDto });
                    }
                    else // here we want false for the non-initiator
                    {
                        AddMatchDTO matchDto = new AddMatchDTO(userId, result.Opponent, null);
                        Console.WriteLine($"Non initiator: {result}");
                        return Ok(new { initiator = false, matchDto });
                    }

                }
                else // user was in another match, or something went wrong. Return null in this case
                {
                    return Ok(null);
                }

            }
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



