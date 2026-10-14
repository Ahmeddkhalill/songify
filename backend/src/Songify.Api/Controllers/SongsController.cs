using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Songify.Api.Extensions;
using Songify.Application.Contracts.Common;
using Songify.Application.Contracts.Songs;
using Songify.Application.Services;

namespace Songify.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class SongsController(ISongService songService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] RequestFilters filters, CancellationToken cancellationToken)
    {
        var result = await songService.SearchAsync(filters, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : result.ToProblem();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await songService.GetByIdAsync(id, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : result.ToProblem();
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSongRequest request, CancellationToken cancellationToken)
    {
        var result = await songService.CreateAsync(User.GetUserId()!.Value, request, cancellationToken);

        return result.IsSuccess ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value) : result.ToProblem();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateSongRequest request, CancellationToken cancellationToken)
    {
        var result = await songService.UpdateAsync(User.GetUserId()!.Value, id, request, cancellationToken);

        return result.IsSuccess ? NoContent() : result.ToProblem();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await songService.DeleteAsync(User.GetUserId()!.Value, id, cancellationToken);

        return result.IsSuccess ? NoContent() : result.ToProblem();
    }
}
