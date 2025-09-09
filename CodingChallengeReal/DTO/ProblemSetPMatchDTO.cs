namespace CodingChallengeReal.DTO
{
    public class ProblemSetPMatchDTO
    {
        public string problemSetId { get; set; }
        public string pk => $"ps#{problemSetId}";
        public string sk { get; set; } // should be m#{matchId}
        public string user1 { get; set; }
        public string user2 { get; set; }

        public int winner { get; set; }
        public string playedAt { get; set; }

        public ProblemSetPMatchDTO(string sk, string user1, string user2, int winner, string problemSetID, string playedAt)
        {
            this.sk = sk;
            this.user1 = user1;
            this.user2 = user2;
            this.winner = winner;
            this.problemSetId = problemSetId;
            this.playedAt = playedAt;   
        
        }
    }
}
