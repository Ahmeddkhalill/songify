using Songify.Application.Contracts.Playlists;

namespace Songify.Application.Services;

public interface IPlaylistService
{
    Task<Result<IReadOnlyList<PlaylistSummaryResponse>>> GetAllAsync(int userId, CancellationToken cancellationToken = default);

    Task<Result<PlaylistDetailResponse>> GetByIdAsync(int userId, int playlistId, CancellationToken cancellationToken = default);

    Task<Result<PlaylistSummaryResponse>> CreateAsync(int userId, CreatePlaylistRequest request, CancellationToken cancellationToken = default);

    Task<Result> UpdateAsync(int userId, int playlistId, UpdatePlaylistRequest request, CancellationToken cancellationToken = default);

    Task<Result> DeleteAsync(int userId, int playlistId, CancellationToken cancellationToken = default);

    Task<Result> AddSongAsync(int userId, int playlistId, AddSongToPlaylistRequest request, CancellationToken cancellationToken = default);

    Task<Result> RemoveSongAsync(int userId, int playlistId, int songId, CancellationToken cancellationToken = default);

    Task<Result> ReorderSongAsync(int userId, int playlistId, int songId, ReorderSongRequest request, CancellationToken cancellationToken = default);
}
