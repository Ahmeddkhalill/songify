using Microsoft.AspNetCore.Mvc;

namespace Songify.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    [HttpGet("boom")]
    public IActionResult Boom()
    {
        throw new InvalidOperationException("boom");
    }
}
