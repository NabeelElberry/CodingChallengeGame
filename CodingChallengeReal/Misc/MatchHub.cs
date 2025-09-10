using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;

namespace CodingChallengeReal.Misc
{
    [Authorize]   
    public class MatchHub: Hub
    {
        private readonly IMatchRepository _matchRepository;
        private readonly IDatabase _redis;
        private readonly IMatchService _matchService;

        static string Key(string u1, string u2) => string.CompareOrdinal(u1, u2) < 0 ? $"{u1}:{u2}" : $"{u2}:{u1}";
        public MatchHub(IMatchRepository matchRepository, IConnectionMultiplexer redisConnection, IMatchService matchService) {
            _matchRepository = matchRepository;
            _redis = redisConnection.GetDatabase();
            _matchService = matchService;
        }


        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();

            Console.WriteLine($"Client connected: {Context.ConnectionId}");

            foreach (var claims in Context.User.Claims)
            {
                Console.WriteLine($"Claim: {claims}");
            }
        }

        const string lua_script = @"
        -- KEYS = { queueKey}
        -- ARGV = { playerId }

        local key = KEYS[1]
        -- whether or not the user declined
        local accepted = ARGV[1]    
        local getKey = tonumber(redis.call('GET', key))

    
        -- case where someone else before you declined
        if getKey == -10 then
            return 'declined'
        end

        if accepted == 'false' or accepted == 'False' or not accepted then

            if getKey == 1 then
                return 'accepted_declined'
            else 
                redis.call('SET', key, -10)
                return 'declined_first'
            end
            
        else
            if getKey == 2 then
                redis.call('DECR', key)
                return 'first_accepted'
            elseif getKey == 1 then
                return 'make_match'
            end
        end

        ";


        public async Task JoinMatchRoom(string user1, string user2, bool accepted)
        {
            Console.WriteLine("In Join Match Room");
            var userId = Context.User?.FindFirst("user_id").Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("Unverified User");
                throw new HubException("Unauthenticated");
            }

            Console.WriteLine($"Accepted: {accepted.ToString()}");
            var key = Key(user1, user2);
            await Groups.AddToGroupAsync(Context.ConnectionId, key);
            // should only be created once per match
            if (await _redis.StringGetAsync(key) == RedisValue.Null)
            {
                await _redis.StringSetAsync(key, 2);

            }
    
            

            
            // 5 cases, returning make_match, first_accepted, declined, declined early
            // if make_match, both have accepted, should actually make the match in the DB,
            //  and return something to the websockets for BOTH users
            // if first_accepted, I don't think we should do anything tbh
            // if declined_early or declined, send one to EACH caller, not both
            // if accepted_declined, then send a signal out to BOTH that it's declined.

            var scriptResult = await _redis.ScriptEvaluateAsync(lua_script, new RedisKey[] { key }, new RedisValue[] { accepted ? "true" : "false"});
            var scriptResultString = scriptResult.ToString();
            Console.WriteLine($"Script Result {scriptResult.ToString()}");
            if (scriptResultString.Equals("make_match"))
            {
                
                await _matchService.AddMatchAsync(new AddMatchDTO(user1, user2, 0));
                await Clients.Group(key).SendAsync("MatchAccepted"); // send to BOTH
                Console.WriteLine("Match accepted");
            } else if (scriptResultString.Equals("declined"))
            {
                await Clients.Group(key).SendAsync("MatchDeclined"); // send to EACH CALLER
                Console.WriteLine("Match declined");
            }
            else if (scriptResultString.Equals("accepted_declined"))
            { 
                await Clients.Group(key).SendAsync("MatchDeclined"); // send to BOTH
                Console.WriteLine("Match declined in accepted_declined");
            } else // first_accepted, don't do anything
            {
                Console.WriteLine("First accepted");
            }
        }

        public async Task AcceptOrDecline(string matchId, string user1id, string user2id, bool response)
        {
            Console.WriteLine("In accept/decline");

            var key = Key(user1id, user2id); // key for our redis list
            var keyValue = await _redis.StringGetAsync(key);
            var amount = 0;
            keyValue.TryParse(out amount);
            await Groups.AddToGroupAsync(Context.ConnectionId, matchId);
            // if it's our first acceptance or decline, initialize the key to 2
            if (keyValue == RedisValue.Null)
            {
                await _redis.StringSetAsync(Key(user1id, user2id), 2);
            }

            if (keyValue.IsInteger && amount == -10) // opponent declined already (not you)
            {
                await Clients.Caller.SendAsync("MatchDeclined");
            } 


            if (response) // accepted just decrement the key
            {
                await _redis.StringDecrementAsync(key);
            } else // declined, set the value into the negatives
            {
                
                if (keyValue == 1) // someone accepted, but you declined, so send a negative response to both
                {
                    await Clients.Group(matchId).SendAsync("MatchDeclined");
                }
                else
                {
                    await _redis.StringSetAsync(key, -10);
                    await Clients.Caller.SendAsync("MatchDeclined");
                }
            }

            // case where we should make the match
            // communicate with the DB, and communicate with players that match has been accepted
            if (await _redis.StringGetAsync(key) == 0)
            {
                await Clients.Group(matchId).SendAsync("MatchAccepted");
            }
        }



        public async Task SendCode(string matchId, string userId, string code)
        {
            Console.WriteLine($"Received matchId {matchId} userId {userId} code {code}");
            await Clients.Group(matchId).SendAsync("ReceiveCode", userId, code);
        }



        public async Task SubmitAnswer(string matchId, string userId, string code)
        {
            // Optionally: Judge0 integration here
            await Clients.Group(matchId).SendAsync("ReceiveSubmission", userId, code);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Optionally handle disconnect
            await base.OnDisconnectedAsync(exception);
        }
    }
}
