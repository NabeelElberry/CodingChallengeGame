namespace CodingChallengeReal.DTO
{
    public class AddMatchDTO
    {
        public string user1 { get; set; }
        public string user2 { get; set; }
        public int? winner { get; set; }
        public string? question_id { get; set; }
        public string? winning_soln_code { get; set; }
    
        public AddMatchDTO(string user1, string user2, int? winner, string? q_id, string? winning_soln_code) { 
            this.user1 = user1;
            this.user2 = user2;
            this.winner = winner;
            this.question_id = q_id;
            this.winning_soln_code = winning_soln_code;
        }

        public AddMatchDTO() { }
    }
}
