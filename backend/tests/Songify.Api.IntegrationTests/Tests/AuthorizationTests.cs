namespace Songify.Api.IntegrationTests.Tests;

public class AuthorizationTests(SongifyApiFactory factory) : IntegrationTestBase(factory)
{
    [Theory]
    [InlineData("GET", "/api/playlists")]
    [InlineData("GET", "/api/playlists/1")]
    [InlineData("POST", "/api/playlists")]
    [InlineData("PUT", "/api/playlists/1")]
    [InlineData("DELETE", "/api/playlists/1")]
    [InlineData("POST", "/api/playlists/1/songs")]
    [InlineData("DELETE", "/api/playlists/1/songs/1")]
    [InlineData("PUT", "/api/playlists/1/songs/1/position")]
    [InlineData("GET", "/api/songs")]
    [InlineData("GET", "/api/songs/1")]
    [InlineData("POST", "/api/songs")]
    [InlineData("PUT", "/api/songs/1")]
    [InlineData("DELETE", "/api/songs/1")]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized(string method, string url)
    {
        var client = CreateClient();

        var response = await client.SendAsync(new HttpRequestMessage(new HttpMethod(method), url));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithMalformedToken_ReturnsUnauthorized()
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "this.is.not.a.jwt");

        var response = await client.GetAsync("/api/playlists");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Owner_CanReadBackOwnPlaylist()
    {
        var owner = await RegisterUserAsync();

        var created = await owner.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("My Mix", null));
        var summary = (await created.Content.ReadFromJsonAsync<PlaylistSummaryResponse>())!;

        var read = await owner.Client.GetAsync($"/api/playlists/{summary.Id}");

        read.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = (await read.Content.ReadFromJsonAsync<PlaylistDetailResponse>())!;
        detail.Id.Should().Be(summary.Id);
        detail.Name.Should().Be("My Mix");
    }

    [Fact]
    public async Task OtherUser_CannotAccessForeignPlaylist()
    {
        var owner = await RegisterUserAsync();
        var intruder = await RegisterUserAsync();

        var created = await owner.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Private", null));
        var summary = (await created.Content.ReadFromJsonAsync<PlaylistSummaryResponse>())!;
        var id = summary.Id;

        var read = await intruder.Client.GetAsync($"/api/playlists/{id}");
        var update = await intruder.Client.PutAsJsonAsync($"/api/playlists/{id}", new UpdatePlaylistRequest("Hijacked", null));
        var delete = await intruder.Client.DeleteAsync($"/api/playlists/{id}");
        var addSong = await intruder.Client.PostAsJsonAsync($"/api/playlists/{id}/songs", new AddSongToPlaylistRequest(1));

        read.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        update.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        delete.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        addSong.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAll_ReturnsOnlyCallersOwnPlaylists()
    {
        var alice = await RegisterUserAsync();
        var bob = await RegisterUserAsync();

        await alice.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Alice One", null));
        await alice.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Alice Two", null));
        await bob.Client.PostAsJsonAsync("/api/playlists", new CreatePlaylistRequest("Bob One", null));

        var aliceList = (await alice.Client.GetFromJsonAsync<List<PlaylistSummaryResponse>>("/api/playlists"))!;
        var bobList = (await bob.Client.GetFromJsonAsync<List<PlaylistSummaryResponse>>("/api/playlists"))!;

        aliceList.Should().HaveCount(2);
        aliceList.Select(p => p.Name).Should().BeEquivalentTo("Alice One", "Alice Two");
        bobList.Should().ContainSingle().Which.Name.Should().Be("Bob One");
    }
}
