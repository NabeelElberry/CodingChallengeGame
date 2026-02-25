using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Interface;
using CodingChallengeReal.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;
using System.Runtime.InteropServices;

namespace CodingChallengeReal.Misc
{
    [Authorize]   
    public class MatchHubSignalR: Hub
    {
        private readonly IMatchRepository _matchRepository;
        private readonly IDatabase _redis;
        private readonly IMatchService _matchService;
        private readonly MatchManager _matchManager;
        static string Key(string u1, string u2) => string.CompareOrdinal(u1, u2) < 0 ? $"{u1}:{u2}" : $"{u2}:{u1}";
        public MatchHubSignalR(IMatchRepository matchRepository, IConnectionMultiplexer redisConnection, IMatchService matchService, MatchManager matchManager) {
            _matchRepository = matchRepository;
            _redis = redisConnection.GetDatabase();
            _matchService = matchService;
            _matchManager = matchManager;
        }


        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();

            Console.WriteLine($"Client connected: ✅");

            foreach (var claims in Context.User.Claims)
            {
                Console.WriteLine($"Claim: {claims}");
            }
        }




       
        private async Task RemoveInformationFromRedis(string uid1, string uid2)
        {
            Console.WriteLine($"UID: {uid1} UID2: {uid2} tgtKey: {Key(uid1, uid2)}");
            await _redis.ScriptEvaluateAsync(LuaScripts.removeTracesFromRedis, new RedisKey[] { uid1, uid2, Key(uid1, uid2) });
        }

        public async Task JoinMatchRoom(bool accepted, Guid problemSetId)
        {
            Console.WriteLine("In Join Match Room");
            var userId = Context.User?.FindFirst("user_id").Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("Unverified User");
                throw new HubException("Unauthenticated");
            }
            var opponentId = (await _redis.ScriptEvaluateAsync(LuaScripts.getOpposingPlayerByPlayer, new RedisKey[] { userId })).ToString();
            Console.WriteLine($"UID: {userId} OID: {opponentId}" );
            var key = Key(userId, opponentId);
            await Groups.AddToGroupAsync(Context.ConnectionId, key);
            // should only be created once per match
            //if (await _redis.HashGetAsync(key, "init") == RedisValue.Null)
            //{
            //    await _redis.HashSetAsync(key, "init", 2);

            //}
    
            
            // 5 cases, returning make_match, first_accepted, declined, declined early
            // if make_match, both have accepted, should actually make the match in the DB,
            //  and return something to the websockets for BOTH users
            // if first_accepted, I don't think we should do anything tbh
            // if declined_early or declined, send one to EACH caller, not both
            // if accepted_declined, then send a signal out to BOTH that it's declined.

            var scriptResult = await _redis.ScriptEvaluateAsync(LuaScripts.lua_script, new RedisKey[] { key }, new RedisValue[] { accepted ? "true" : "false"});
            var scriptResultString = scriptResult.ToString();
            Console.WriteLine($"Script Result {scriptResult.ToString()}");
            if (scriptResultString.Equals("make_match"))
            {
                Console.WriteLine("Both accepted!!!!!!!!!!!!!!!!!!!");
                await _matchService.AddMatchAsync(new AddMatchDTO(userId, opponentId, 0));

                //var isInitiator = await _redis.ScriptEvaluateAsync(checkIfInitiator, new RedisKey[] { userId });

                //Console.WriteLine("Checking if user: ", userId, " is initiator: ", isInitiator, " type: ", isInitiator.GetType(), " and user2 is ", opponentId);
                //if ((int)isInitiator == 1)
                //{
                    await _matchManager.CreateGameManager(key, userId, opponentId, problemSetId);
                    Console.WriteLine("UserXXX ", userId, " was initiator!");
                //}

                await Clients.Group(key).SendAsync("MatchAccepted"); // send to BOTH
                Console.WriteLine("Match accepted");
            } else if (scriptResultString.Equals("declined"))
            {
                await Clients.Group(key).SendAsync("MatchDeclined"); // send to EACH CALLER
        
                Console.WriteLine("Match declined");
                await RemoveInformationFromRedis(userId, opponentId);


            }
            else if (scriptResultString.Equals("accepted_declined"))
            { 
                await Clients.Group(key).SendAsync("MatchDeclined"); // send to BOTH
                Console.WriteLine("Match declined in accepted_declined");
                await RemoveInformationFromRedis(userId, opponentId);
            } else // first_accepted, don't do anything
            {
                Console.WriteLine("First accepted");
            }
        }
        /// <summary>
        /// Receives signal from frontend that updates both clients when the match is over
        /// 
        /// </summary>
        /// <param name="winningUser"></param>
        /// <returns></returns>

        public async Task ReceivedClientWin()
        {
            var winningUserId = Context.User?.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(winningUserId)) return;

            // get the opposing players ID so we can get the key to notify them
            Console.WriteLine("Winning userID: ", winningUserId);
            var opposingUserId = await _redis.HashGetAsync("match_pairs", winningUserId);
            Console.WriteLine("Opposing userID: ", opposingUserId);
            if (opposingUserId != RedisValue.Null)
            {
                string matchKey = Key(winningUserId, opposingUserId);
                await Clients.User(winningUserId).SendAsync("MatchWinner");
                await Clients.User(opposingUserId).SendAsync("MatchLoser");

                await RemoveInformationFromRedis(winningUserId, opposingUserId);
            }
        }

        public async Task SendCode(string matchId, string code)
        {
            var userId = Context.User?.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId)) return;

            Console.WriteLine($"Received matchId {matchId} userId {userId} code {code}");
            await Clients.Group(matchId).SendAsync("ReceiveCode", userId, code);
        }



        public async Task SubmitAnswer(string matchId, string code)
        {
            var userId = Context.User?.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId)) return;
            // Optionally: Judge0 integration here
            await Clients.Group(matchId).SendAsync("ReceiveSubmission", userId, code);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst("user_id")?.Value;
            if (string.IsNullOrEmpty(userId)) return;
            // Optionally handle disconnect
            await base.OnDisconnectedAsync(exception);
        }
    }
}
