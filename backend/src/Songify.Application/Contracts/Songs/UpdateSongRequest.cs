namespace Songify.Application.Contracts.Songs;

public record UpdateSongRequest(
    string Title,
    string Artist,
    string? Album,
    int DurationInSeconds,
    string? CoverImageUrl,
    string? PreviewUrl);
