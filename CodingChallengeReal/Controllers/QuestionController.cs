using AutoMapper;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Implementation;
using CodingChallengeReal.Repositories.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodingChallengeReal.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class QuestionController: Controller
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly IMapper _mapper;

        public QuestionController(IQuestionRepository questionRepository, IMapper mapper)
        {
            this._questionRepository = questionRepository;
            this._mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> AddQuestionAsync(AddQuestionDTO addQuestionRequest)
        {
            var uid = User.FindFirst("user_id")?.Value;
            var email = User.FindFirst("email")?.Value;
            var role = User.FindFirst("role")?.Value;

            Console.WriteLine($"UID: {uid}, EMAIL: {email}, ROLE: {role}");

            Question question = _mapper.Map<Question>(addQuestionRequest);
            question.id = Guid.NewGuid().ToString();
            question.sk = "meta";
            await _questionRepository.AddAsync(question);

            return Ok(question);
        }

        [HttpGet]
        public async Task<IActionResult> GetQuestionAsync(Guid id)
        {
            var questionDTO = await _questionRepository.GetAsync(id);
            return Ok(questionDTO);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteQuestionAsync(Guid id)
        {
            var deletedUserBool = await _questionRepository.DeleteAsync(id);
         
            
            return Ok(deletedUserBool);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateQuestionAsync(Guid id, AddQuestionDTO addQuestionRequest)
        {
            QuestionDTO originalQuestion = await _questionRepository.GetAsync(id);

            if (originalQuestion == null)
            {
                return Ok(false);
            }
            originalQuestion.Title = addQuestionRequest.name;
            originalQuestion.Description = addQuestionRequest.description;
            originalQuestion.Difficulty = addQuestionRequest.difficulty;
            var updatedUser = await _questionRepository.UpdateAsync(id, _mapper.Map<Question>(originalQuestion));

            return Ok(updatedUser);
        }

        [Authorize(Policy = "AdminOnly")]
        [Route("AddBulk")]
        [HttpPost]
        public async Task<IActionResult> AddBulkQuestionsFromJson()
        {
            // todo
            var result = await _questionRepository.AddQuestionsFromBulk();

            return Ok(result);
        }
    }
}
