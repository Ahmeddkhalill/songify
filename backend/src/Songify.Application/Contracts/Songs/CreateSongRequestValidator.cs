using FluentValidation;

namespace Songify.Application.Contracts.Songs;

public class CreateSongRequestValidator : AbstractValidator<CreateSongRequest>
{
    public CreateSongRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Artist)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Album)
            .MaximumLength(200);

        RuleFor(x => x.DurationInSeconds)
            .GreaterThan(0)
            .LessThanOrEqualTo(3600);

        RuleFor(x => x.CoverImageUrl)
            .MaximumLength(500)
            .Must(SongUrl.IsValid)
            .When(x => x.CoverImageUrl is not null);

        RuleFor(x => x.PreviewUrl)
            .MaximumLength(500)
            .Must(SongUrl.IsValid)
            .When(x => x.PreviewUrl is not null);
    }
}
