namespace CodingChallengeReal.DTO
{
    public class UserPMatchDTO
    {
        public string id { get; set; }
        public string pk => $"u#{id}";
        public string sk { get; set; } // should be m#{matchId}
        public Boolean isWinner { get; set; }
        public string opponentId { get; set; }
        public string problemSetId { get; set; }

        public UserPMatchDTO(string sk, Boolean isWinner, string opponentId, string problemSetId)
        {
            this.sk = sk;
            this.isWinner = isWinner;
            this.opponentId = opponentId;
            this.problemSetId = problemSetId;
        }
    }
}
