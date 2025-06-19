using CodingChallengeReal.Domains;

namespace CodingChallengeReal.Repositories.Interface
{
    public interface IQueueRepository
    {
        public Task<bool> AddAsync(QueuedUser user);
    }
}
