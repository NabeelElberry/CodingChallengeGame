using CodingChallengeReal.Repositories.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CodingChallengeReal.Misc
{
    [Authorize]   
    public class MatchHub: Hub
    {
        private readonly IMatchRepository _matchRepository;

        public MatchHub(IMatchRepository matchRepository) {
            _matchRepository = matchRepository;
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

        public async Task JoinMatchRoom(string matchId)
        {
            Console.WriteLine("In Join Match Room");
            var userId = Context.User?.FindFirst("user_id").Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("Unverified User");
                throw new HubException("Unauthenticated");
            }

            Console.WriteLine("Made Match");
            var match = await _matchRepository.GetAsync(matchId);

            if (match == null || (match.user1 != userId && match.user2 != userId))
            {
                Console.WriteLine("User attempted to join match not intended for them");
                throw new HubException("Unauthorized");
            }
            Console.WriteLine($"Joined Match room of match {matchId} and room {Context.ConnectionId}");
            await Groups.AddToGroupAsync(Context.ConnectionId, matchId);
            await Clients.Group(matchId).SendAsync("UserJoined", Context.ConnectionId);
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
