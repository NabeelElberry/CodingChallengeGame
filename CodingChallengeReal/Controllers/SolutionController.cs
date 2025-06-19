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
    public class SolutionController:Controller
    {
        private readonly ISolutionRepository _solutionRepository;
        private readonly IMapper _mapper;

        public SolutionController(ISolutionRepository solutionRepository, IMapper mapper)
        {
            this._solutionRepository = solutionRepository;
            this._mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> AddQuestionAsync(AddSolutionDTO addSolutionRequest)
        {
            Solution solution = _mapper.Map<Solution>(addSolutionRequest);
            solution.id = Guid.NewGuid().ToString();
            solution.sk = "meta";
            await _solutionRepository.AddAsync(solution);

            return Ok(solution);
        }

        [HttpGet]
        public async Task<IActionResult> GetQuestionAsync(Guid id)
        {
            var solutionDTO = await _solutionRepository.GetAsync(id);
            return Ok(solutionDTO);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteQuestionAsync(Guid id)
        {
            var deletedUserBool = await _solutionRepository.DeleteAsync(id);

            return Ok(deletedUserBool);
        }
        [HttpPut]
        public async Task<IActionResult> UpdateQuestionAsync(Guid id, AddSolutionDTO addSolutionRequest)
        {
            SolutionDTO originalSolution = await _solutionRepository.GetAsync(id);

            if (originalSolution == null)
            {
                return Ok(false);
            }
            originalSolution.name = addSolutionRequest.name;
            originalSolution.description = addSolutionRequest.description;
            originalSolution.difficulty = addSolutionRequest.difficulty;
            var updatedUser = await _solutionRepository.UpdateAsync(id, _mapper.Map<Solution>(originalSolution));

            return Ok(updatedUser);
        }
    }
}
