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
    public class ProblemSetController : Controller
    {
        private readonly IProblemSetRepository _problemSetRepository;
        private readonly IMapper _mapper;

        public ProblemSetController(IProblemSetRepository questionRepository, IMapper mapper)
        {
            this._problemSetRepository = questionRepository;
            this._mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> AddQuestionAsync(AddProblemSetDTO addPSRequest)
        {
            var uid = User.FindFirst("user_id")?.Value;
            var email = User.FindFirst("email")?.Value;
            var role = User.FindFirst("role")?.Value;

            Console.WriteLine($"UID: {uid}, EMAIL: {email}, ROLE: {role}");

            ProblemSet problemSet = _mapper.Map<ProblemSet>(addPSRequest);
            problemSet.id = Guid.NewGuid().ToString();
            await _problemSetRepository.AddAsync(problemSet);

            return Ok(problemSet);
        }

        [HttpGet]
        public async Task<IActionResult> GetQuestionAsync(Guid id)
        {
            var questionDTO = await _problemSetRepository.GetAsync(id);
            return Ok(questionDTO);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteQuestionAsync(Guid id)
        {
            var deletedUserBool = await _problemSetRepository.DeleteAsync(id);


            return Ok(deletedUserBool);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateQuestionAsync(Guid id, AddProblemSetDTO addQuestionRequest)
        {
            ProblemSetDTO originalQuestion = await _problemSetRepository.GetAsync(id);

            if (originalQuestion == null)
            {
                return Ok(false);
            }
            originalQuestion.Questions = addQuestionRequest.Questions;
            var updatedUser = await _problemSetRepository.UpdateAsync(id, _mapper.Map<ProblemSet>(originalQuestion));

            return Ok(updatedUser);
        }
        [HttpGet("/getQuestionByIdAndQuestionNumber")]
        public async Task<IActionResult> GetQuestionInformationByProblemSetIDAndQuestionNumber(Guid id, int questionNumber)
        {
            ProblemSetDTO problemSet = await _problemSetRepository.GetAsync(id);
            if (questionNumber < problemSet.Questions.Count)
            {
                return Ok(problemSet.Questions[questionNumber]);
            } else
            {
                return NotFound("Number was out of scope");
            }

        }
    }
}
