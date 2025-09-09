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
    public class ProblemSetController: Controller
    {
        private readonly IProblemSetRepository _questionRepository;
        private readonly IMapper _mapper;

        public ProblemSetController(IProblemSetRepository questionRepository, IMapper mapper)
        {
            this._questionRepository = questionRepository;
            this._mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> AddQuestionAsync(AddProblemSetDTO addQuestionRequest)
        {
            var uid = User.FindFirst("user_id")?.Value;
            var email = User.FindFirst("email")?.Value;
            var role = User.FindFirst("role")?.Value;

            Console.WriteLine($"UID: {uid}, EMAIL: {email}, ROLE: {role}");

            ProblemSet question = _mapper.Map<ProblemSet>(addQuestionRequest);
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
        public async Task<IActionResult> UpdateQuestionAsync(Guid id, AddProblemSetDTO addQuestionRequest)
        {
            ProblemSetDTO originalQuestion = await _questionRepository.GetAsync(id);

            if (originalQuestion == null)
            {
                return Ok(false);
            }
            originalQuestion.Questions = addQuestionRequest.Questions;
            var updatedUser = await _questionRepository.UpdateAsync(id, _mapper.Map<ProblemSet>(originalQuestion));

            return Ok(updatedUser);
        }
    }
}
