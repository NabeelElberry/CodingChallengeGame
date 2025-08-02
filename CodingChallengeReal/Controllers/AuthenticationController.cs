using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace CodingChallengeReal.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthenticationController: Controller
    {
        // if this returns anything then it's verified, since it's authorized endpoint
        [Authorize]
        [HttpGet]
        public IActionResult GetAuthenticationStatus() => Ok(new { valid = true });
        
    }
}
