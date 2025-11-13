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
        private readonly IProblemSetRepository _questionRepository;
        private readonly IMapper _mapper;
        private readonly MatchManager _matchManager;
        // private readonly String Judge0URL = "http://107.23.165.87:2358";



        public MatchController(IMatchRepository matchRepository, IMapper mapper, IProblemSetRepository questionRepository, EnqueueService enqueueService, IHubContext<MatchHub> matchHub, IMatchService matchService, Matchmaker matchmaker,
            MatchManager matchManager)
        {
            _matchService = matchService;
            _matchHub = matchHub;
            _enqueueService = enqueueService;
            _matchRepository = matchRepository;
            _questionRepository = questionRepository;
            _mapper = mapper;
            _matchmaker = matchmaker;
            _matchManager = matchManager;
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


            // COME BACK TO THIS
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

        /// <summary>
        /// This endpoint gets the partner of the UID given, goes through redis hash "match_pairs" and retrieves the partner
        /// if they exist
        /// </summary>
        /// <param name="uid"></param>
        /// <returns></returns>
        [HttpGet("/getMatchInfoForPlayer")]
        public async Task<IActionResult> GetMatchInfo([FromQuery] string uid, [FromQuery] Guid problemSetId)
        {
            var hashEntries = await _matchManager.GetMatchInfoForPlayer(uid, problemSetId);
            Dictionary<String, String> values = new Dictionary<String, String>();
            foreach (var entry in hashEntries)
            {
                values.Add(entry.Name, entry.Value);
                Console.WriteLine($"name: {entry.Name} value: {entry.Value}");
            }


           return Ok(values);
        }

        [HttpPost("/editPlayerLevel")]
        public async Task<IActionResult> EditPlayerLevel([FromQuery] string uid, [FromQuery] int newLevel)
        {
            return Ok(await _matchManager.EditLevelManager(uid, newLevel));
        }

        [HttpPost("/editPlayerTime")]
        public async Task<IActionResult> EditPlayerTime([FromQuery] string uid, [FromQuery] int newTime)
        {
            return Ok(await _matchManager.EditTimeManager(uid, newTime));
        }
    }
}



