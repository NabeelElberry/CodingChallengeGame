using AutoMapper;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodingChallengeReal.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class QueueController: Controller
    {
        private readonly IQueueRepository _queueRepository;
        private readonly IMapper _mapper;

        public QueueController(IQueueRepository queueRepository, IMapper mapper)
        {
            _queueRepository = queueRepository;
            _mapper = mapper;

        }
        [HttpPost]
        public async Task<IActionResult> EnqueueUser(AddQueuedUserDTO queuedUserDTO)
        {
            var enqueuedUser = _mapper.Map<QueuedUser>(queuedUserDTO);
            enqueuedUser.sk = "meta";
            bool result = await _queueRepository.AddAsync(enqueuedUser);

            return Ok(result);
        }
    }
}
