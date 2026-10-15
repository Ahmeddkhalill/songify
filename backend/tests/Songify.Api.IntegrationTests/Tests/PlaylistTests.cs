namespace Songify.Api.IntegrationTests.Tests;

public class PlaylistTests(SongifyApiFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task Create_ReturnsCreatedWithResource()
    {
        var user = await RegisterUserAsync();

        var response = await user.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Road Trip", "For the car"));

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var summary = (await response.Content.ReadFromJsonAsync<PlaylistSummaryResponse>())!;
        summary.Id.Should().BeGreaterThan(0);
        summary.Name.Should().Be("Road Trip");
        summary.Description.Should().Be("For the car");
        summary.SongCount.Should().Be(0);
        response.Headers.Location.Should().NotBeNull();
    }

    [Fact]
    public async Task Create_WithDuplicateNameForSameUser_ReturnsConflict()
    {
        var user = await RegisterUserAsync();
        await user.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Favourites", null));

        var response = await user.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Favourites", null));

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var problem = await ReadProblemAsync(response);
        problem.GetProperty("errors").GetProperty("code").GetString().Should().Be("Playlist.DuplicateName");
    }

    [Fact]
    public async Task Create_WithSameNameForDifferentUsers_IsAllowed()
    {
        var alice = await RegisterUserAsync();
        var bob = await RegisterUserAsync();

        var aliceResponse = await alice.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Shared Name", null));
        var bobResponse = await bob.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Shared Name", null));

        aliceResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        bobResponse.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task AddSongs_ThenGet_ReturnsSongsOrderedByPositionFromZero()
    {
        var user = await RegisterUserAsync();
        var id = await CreatePlaylistAsync(user, "Mix");

        await AddSongAsync(user, id, 3);
        await AddSongAsync(user, id, 1);
        await AddSongAsync(user, id, 2);

        var detail = await GetDetailAsync(user, id);

        detail.Songs.Select(s => s.Id).Should().Equal(3, 1, 2);
        detail.Songs.Select(s => s.Position).Should().Equal(0, 1, 2);
        detail.SongCount.Should().Be(3);
    }

    [Fact]
    public async Task RemoveSong_LeavesRemainingPositionsContiguous()
    {
        var user = await RegisterUserAsync();
        var id = await CreatePlaylistAsync(user, "Mix");
        await AddSongAsync(user, id, 1);
        await AddSongAsync(user, id, 2);
        await AddSongAsync(user, id, 3);

        var removed = await user.Client.DeleteAsync($"/api/playlists/{id}/songs/2");
        removed.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await GetDetailAsync(user, id);
        detail.Songs.Select(s => s.Id).Should().Equal(1, 3);
        detail.Songs.Select(s => s.Position).Should().Equal(0, 1);
    }

    [Fact]
    public async Task ReorderSong_MovesSongAndRenumbersTheRest()
    {
        var user = await RegisterUserAsync();
        var id = await CreatePlaylistAsync(user, "Mix");
        await AddSongAsync(user, id, 1);
        await AddSongAsync(user, id, 2);
        await AddSongAsync(user, id, 3);

        var reordered = await user.Client.PutAsJsonAsync($"/api/playlists/{id}/songs/3/position", new ReorderSongRequest(0));
        reordered.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await GetDetailAsync(user, id);
        detail.Songs.Select(s => s.Id).Should().Equal(3, 1, 2);
        detail.Songs.Select(s => s.Position).Should().Equal(0, 1, 2);
    }

    [Fact]
    public async Task ReorderSong_WithOutOfRangePosition_ReturnsBadRequest()
    {
        var user = await RegisterUserAsync();
        var id = await CreatePlaylistAsync(user, "Mix");
        await AddSongAsync(user, id, 1);

        var response = await user.Client.PutAsJsonAsync($"/api/playlists/{id}/songs/1/position", new ReorderSongRequest(5));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await ReadProblemAsync(response);
        problem.GetProperty("errors").GetProperty("code").GetString().Should().Be("Playlist.InvalidPosition");
    }

    private async Task<int> CreatePlaylistAsync(AuthenticatedUser user, string name)
    {
        var response = await user.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest(name, null));
        var summary = (await response.Content.ReadFromJsonAsync<PlaylistSummaryResponse>())!;
        return summary.Id;
    }

    private static async Task AddSongAsync(AuthenticatedUser user, int playlistId, int songId)
    {
        var response = await user.Client.PostAsJsonAsync($"/api/playlists/{playlistId}/songs", new AddSongToPlaylistRequest(songId));
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    private static async Task<PlaylistDetailResponse> GetDetailAsync(AuthenticatedUser user, int playlistId) =>
        (await user.Client.GetFromJsonAsync<PlaylistDetailResponse>($"/api/playlists/{playlistId}"))!;
}
