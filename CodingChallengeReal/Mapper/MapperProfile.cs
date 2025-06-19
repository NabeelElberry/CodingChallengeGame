using AutoMapper;
using CodingChallengeReal.Domains;
using CodingChallengeReal.DTO;

namespace CodingChallengeReal.Mapper
{
    public class MapperProfile: Profile
    {

        public MapperProfile()
        {
            CreateMap<UserDTO, User>().ReverseMap();
            CreateMap<AddUserDTO, User>().ReverseMap();
            CreateMap<QuestionDTO, Question>().ReverseMap();
            CreateMap<AddQuestionDTO, Question>().ReverseMap();
            CreateMap<MatchDTO, Match>().ReverseMap();
            CreateMap<AddMatchDTO, Match>().ReverseMap();
            CreateMap<QueuedUser, AddQueuedUserDTO>().ReverseMap();
            CreateMap<QueuedUser, QueuedUserDTO>().ReverseMap(); 
        }
        

    }
}
