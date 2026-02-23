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
    public class MatchHub: Hub
    {
        private readonly IMatchRepository _matchRepository;
        private readonly IDatabase _redis;
        private readonly IMatchService _matchService;
        private readonly MatchManager _matchManager;
        static string Key(string u1, string u2) => string.CompareOrdinal(u1, u2) < 0 ? $"{u1}:{u2}" : $"{u2}:{u1}";
        public MatchHub(IMatchRepository matchRepository, IConnectionMultiplexer redisConnection, IMatchService matchService, MatchManager matchManager) {
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

        const string lua_script = @"
        -- KEYS = { queueKey}
        -- ARGV = { playerId }
           
        local key = KEYS[1]
        -- whether or not the user declined
        local accepted = ARGV[1]    
        
        if redis.call('HEXISTS', key, 'init') == 0 then
            redis.call('HSET', key, 'init', 2)
        end
        local getKey = tonumber(redis.call('HGET', key, 'init'))

    
        -- case where someone else before you declined
        if getKey == -10 then
            return 'declined'
        end

        if accepted == 'false' or accepted == 'False' or not accepted then

            if getKey == 1 then
                return 'accepted_declined'
            else 
                redis.call('HSET', key, 'init', -10)
                return 'declined_first'
            end
            
        else
            
            if getKey == 2 then
                -- decrements by 1
                redis.call('HINCRBY', key, 'init', -1)
                return 'first_accepted'
            elseif getKey == 1 then
                return 'make_match'
            end
        end

        ";

        const string checkIfInitiator = @"
        -- KEYS = {playerId}
        
        local playerId = KEYS[1]

        local returnVal = redis.call('SISMEMBER', 'initiators', playerId)
    
        return returnVal;
        ";


        const string getOpposingPlayerByPlayer = @"
        -- KEYS = { matchKey }

        local userIdKey = KEYS[1]
        return redis.call('HGET', 'match_pairs', userIdKey)
        ";

        const string removeTracesFromRedis = @"
        -- KEYS = {uid1, uid2, togetherKey}

        local uid1 = KEYS[1]
        local uid2 = KEYS[2]
        local tgtKey = KEYS[3]

        -- deleting from match pairs
        redis.call('HDEL', 'match_pairs', uid1)
        redis.call('HDEL', 'match_pairs', uid2)
        
        -- deleting from initiators
        if redis.call('SISMEMBER', 'initiators', uid1) == 1 then
            redis.call('SREM', 'initiators', uid1) 
        else 
            redis.call('SREM', 'initiators', uid2) 
        end

        -- deleting from all_matched
        redis.call('SREM', 'all_matched', uid1)
        redis.call('SREM', 'all_matched', uid2)        

        redis.call('DEL', tgtKey)
        ";


       
        private async Task RemoveInformationFromRedisOnDecline(string uid1, string uid2)
        {
            await _redis.ScriptEvaluateAsync(removeTracesFromRedis, new RedisKey[] { uid1, uid2, Key(uid1, uid2) });
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
            var opponentId = (await _redis.ScriptEvaluateAsync(getOpposingPlayerByPlayer, new RedisKey[] { userId })).ToString();
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

            var scriptResult = await _redis.ScriptEvaluateAsync(lua_script, new RedisKey[] { key }, new RedisValue[] { accepted ? "true" : "false"});
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
                await RemoveInformationFromRedisOnDecline(userId, opponentId);


            }
            else if (scriptResultString.Equals("accepted_declined"))
            { 
                await Clients.Group(key).SendAsync("MatchDeclined"); // send to BOTH
                Console.WriteLine("Match declined in accepted_declined");
                await RemoveInformationFromRedisOnDecline(userId, opponentId);
            } else // first_accepted, don't do anything
            {
                Console.WriteLine("First accepted");
            }
        }


        // lowkey we could organize this better,
        // having a hash where each key is a table in the hash would reduce the clutter in the main part of redis


        /// <summary>
        /// Essentially what this does is it adds a key into the redis table with user1:user2 and a value that goes up to 2
        /// However, once this is done we really should delete it since there's no point,
        /// 
        /// </summary>
        /// <param name="matchId"></param>
        /// <param name="user1id"></param>
        /// <param name="user2id"></param>
        /// <param name="response"></param>
        /// <returns></returns>
        //public async Task AcceptOrDecline(string matchId, string user1id, string user2id, bool response)
        //{
        //    Console.WriteLine("In accept/decline");

        //    var key = Key(user1id, user2id); // key for our redis list
        //    var keyValue = await _redis.StringGetAsync(key);
        //    var amount = 0;
        //    keyValue.TryParse(out amount);
        //    await Groups.AddToGroupAsync(Context.ConnectionId, matchId);
        //    // if it's our first acceptance or decline, initialize the key to 2
        //    if (keyValue == RedisValue.Null)
        //    {
        //        await _redis.HashSetAsync(Key(user1id, user2id), "init", 2);
        //    }

        //    if (keyValue.IsInteger && amount == -10) // opponent declined already (not you)
        //    {
        //        await Clients.Caller.SendAsync("MatchDeclined");
        //    } 


        //    if (response) // accepted just decrement the key
        //    {
        //        await _redis.HashDecrementAsync(key, "init");
        //    } else // declined, set the value into the negatives
        //    {
                
        //        if (keyValue == 1) // someone accepted, but you declined, so send a negative response to both
        //        {
        //            await Clients.Group(matchId).SendAsync("MatchDeclined");
        //        }
        //        else
        //        {
        //            await _redis.HashSetAsync(key, "init", -10);
        //            await Clients.Caller.SendAsync("MatchDeclined");
        //        }
        //    }

        //    // case where we should make the match
        //    // communicate with the DB, and communicate with players that match has been accepted
        //    if (await _redis.HashGetAsync(key, "init") == 0)
        //    {
        //        await Clients.Group(matchId).SendAsync("MatchAccepted");
        //    }
        //}


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
