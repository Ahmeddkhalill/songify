using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Songify.Api.Extensions;
using Songify.Application.Contracts.Playlists;
using Songify.Application.Services;

namespace Songify.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PlaylistsController(IPlaylistService playlistService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await playlistService.GetAllAsync(User.GetUserId()!.Value, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : result.ToProblem();
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await playlistService.GetByIdAsync(User.GetUserId()!.Value, id, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : result.ToProblem();
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePlaylistRequest request, CancellationToken cancellationToken)
    {
        var result = await playlistService.CreateAsync(User.GetUserId()!.Value, request, cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value)
            : result.ToProblem();
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdatePlaylistRequest request, CancellationToken cancellationToken)
    {
        var result = await playlistService.UpdateAsync(User.GetUserId()!.Value, id, request, cancellationToken);

        return result.IsSuccess ? NoContent() : result.ToProblem();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await playlistService.DeleteAsync(User.GetUserId()!.Value, id, cancellationToken);

        return result.IsSuccess ? NoContent() : result.ToProblem();
    }

    [HttpPost("{id:int}/songs")]
    public async Task<IActionResult> AddSong(int id, AddSongToPlaylistRequest request, CancellationToken cancellationToken)
    {
        var result = await playlistService.AddSongAsync(User.GetUserId()!.Value, id, request, cancellationToken);

        return result.IsSuccess ? NoContent() : result.ToProblem();
    }

    [HttpDelete("{id:int}/songs/{songId:int}")]
    public async Task<IActionResult> RemoveSong(int id, int songId, CancellationToken cancellationToken)
    {
        var result = await playlistService.RemoveSongAsync(User.GetUserId()!.Value, id, songId, cancellationToken);

        return result.IsSuccess ? NoContent() : result.ToProblem();
    }

    [HttpPut("{id:int}/songs/{songId:int}/position")]
    public async Task<IActionResult> ReorderSong(int id, int songId, ReorderSongRequest request, CancellationToken cancellationToken)
    {
        var result = await playlistService.ReorderSongAsync(User.GetUserId()!.Value, id, songId, request, cancellationToken);

        return result.IsSuccess ? NoContent() : result.ToProblem();
    }
}
