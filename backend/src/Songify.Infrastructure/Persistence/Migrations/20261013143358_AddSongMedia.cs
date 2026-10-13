using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Songify.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSongMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                table: "Songs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreviewUrl",
                table: "Songs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "PreviewUrl",
                table: "Songs");
        }
    }
}
