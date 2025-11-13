namespace CodingChallengeReal.Domains
{
    public class Question
    {
        public string QuestionText { get; set; }
        public List<string> AnswerChoices { get; set; }
        public int CorrectAnswer { get; set; }
    }
}
