namespace Songify.Application.Contracts.Songs;

public record PlaylistSongResponse(
    int Id,
    string Title,
    string Artist,
    string? Album,
    int DurationInSeconds,
    string? CoverImageUrl,
    string? PreviewUrl,
    int Position,
    DateTime AddedAt);
