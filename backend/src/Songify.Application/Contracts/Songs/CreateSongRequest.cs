namespace Songify.Application.Contracts.Songs;

public record CreateSongRequest(
    string Title,
    string Artist,
    string? Album,
    int DurationInSeconds,
    string? CoverImageUrl,
    string? PreviewUrl);
