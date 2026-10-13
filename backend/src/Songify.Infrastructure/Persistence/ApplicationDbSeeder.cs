using System.Reflection;
using System.Text.Json;

namespace Songify.Infrastructure.Persistence;

public static class ApplicationDbSeeder
{
    private const string SeedResourceName =
        "Songify.Infrastructure.Persistence.SeedData.songs.json";

    public static async Task SeedAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken = default)
    {
        if (await context.Songs.AnyAsync(cancellationToken))
            return;

        var seedSongs = await LoadSeedSongsAsync(cancellationToken);

        if (seedSongs.Count == 0)
            return;

        var seededAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var songs = seedSongs
            .Select(s => new Song
            {
                Title = s.Title,
                Artist = s.Artist,
                Album = s.Album,
                DurationInSeconds = s.DurationInSeconds,
                CoverImageUrl = s.CoverImageUrl,
                PreviewUrl = s.PreviewUrl,
                CreatedAt = seededAt
            })
            .ToList();

        await context.Songs.AddRangeAsync(songs, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task<List<SeedSong>> LoadSeedSongsAsync(CancellationToken cancellationToken)
    {
        await using var stream = Assembly
            .GetExecutingAssembly()
            .GetManifestResourceStream(SeedResourceName);

        if (stream is null)
            return [];

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        var songs = await JsonSerializer
            .DeserializeAsync<List<SeedSong>>(stream, options, cancellationToken);

        return songs ?? [];
    }

    private sealed record SeedSong(
        string Title,
        string Artist,
        string? Album,
        int DurationInSeconds,
        string? CoverImageUrl,
        string? PreviewUrl);
}