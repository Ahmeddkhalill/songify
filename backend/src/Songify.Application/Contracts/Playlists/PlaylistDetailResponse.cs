using Songify.Application.Contracts.Songs;

namespace Songify.Application.Contracts.Playlists;

public record PlaylistDetailResponse(
    int Id,
    string Name,
    string? Description,
    int SongCount,
    int TotalDurationInSeconds,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<PlaylistSongResponse> Songs);
