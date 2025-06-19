using AutoMapper;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;
using CodingChallengeReal.Repositories.Implementation;
using CodingChallengeReal.Repositories.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodingChallengeReal.Controllers
{
    
    [ApiController]
    [Route("[controller]")]
    public class UserController: Controller
    {
        private readonly IUserRepository _userRepostiory;
        private readonly IMapper _mapper;

        public UserController(IUserRepository userRepository, IMapper mapper)
        {
            this._userRepostiory = userRepository;
            this._mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> AddUserAsync(AddUserDTO addUserRequest)
        {
            User user = _mapper.Map<User>(addUserRequest);
            user.mmr = 0;
            user.sk = "meta";
            await _userRepostiory.AddAsync(user);

            return Ok(user);
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetUserAsync(Guid id)
        {
            var userDTO = await _userRepostiory.GetAsync(id);
            return Ok(userDTO);
        }

        [Authorize]
        [HttpDelete]
        public async Task<IActionResult> DeleteUserAsync(Guid id)
        {
            var deletedUserBool = await _userRepostiory.DeleteAsync(id);
            return Ok(deletedUserBool);
        }

        [Authorize]
        [HttpPut]
        public async Task<IActionResult> UpdateUserAsync(Guid id, AddUserDTO updateUserRequest)
        {

            UserDTO originalUser = await _userRepostiory.GetAsync(id);
            originalUser.username = updateUserRequest.username;
            originalUser.password = updateUserRequest.password;
            originalUser.email = updateUserRequest.email;
            var updatedUser = await _userRepostiory.UpdateAsync(id, _mapper.Map<User>(originalUser));

            return Ok(updatedUser);
        }


    }
}
