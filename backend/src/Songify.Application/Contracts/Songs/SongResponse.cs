namespace Songify.Application.Contracts.Songs;

public record SongResponse(
    int Id,
    string Title,
    string Artist,
    string? Album,
    int DurationInSeconds,
    string? CoverImageUrl,
    string? PreviewUrl);
