namespace Songify.Application.Contracts.Playlists;

public record PlaylistSummaryResponse(
    int Id,
    string Name,
    string? Description,
    int SongCount,
    int TotalDurationInSeconds,
    IReadOnlyList<string> CoverImageUrls,
    DateTime CreatedAt,
    DateTime UpdatedAt);
