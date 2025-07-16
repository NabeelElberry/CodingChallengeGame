namespace CodingChallengeReal.Controllers
{
    using CodingChallengeReal.DTO;
    using CodingChallengeReal.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
    [Authorize]
    [ApiController]
    [Route("admin")]
    public class AdminController: Controller
    {

        private readonly FirebaseAdminService _adminService;

        public AdminController(FirebaseAdminService adminService)
        {
            _adminService = adminService;
        }

        [Authorize]
        [HttpPost("promote")]
        public async Task<IActionResult> PromoteUser([FromBody] PromoteRequest request)
        {
            await _adminService.SetCustomUserClaimsAsync(request.uid, new { role = "admin" });
            return Ok("UID {uid} admin");
        }


    }
}
