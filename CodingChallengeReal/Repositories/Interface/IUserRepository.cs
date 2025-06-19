using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;

namespace CodingChallengeReal.Repositories.Interface
{
    public interface IUserRepository
    {

        public Task<UserDTO> GetAsync(Guid id);
        public Task<bool> AddAsync(User user);
        public Task<bool> DeleteAsync(Guid id);
        public Task<bool> UpdateAsync(Guid id, User user);
    }
}
