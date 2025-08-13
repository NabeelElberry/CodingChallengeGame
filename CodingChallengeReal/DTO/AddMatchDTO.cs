namespace CodingChallengeReal.DTO
{
    public class AddMatchDTO
    {
        public string user1 { get; set; }
        public string user2 { get; set; }
        public int? winner { get; set; }

        public AddMatchDTO(string user1, string user2, int? winner) { 
            this.user1 = user1;
            this.user2 = user2;
            this.winner = winner;
        }

        public AddMatchDTO() { }
    }
}
