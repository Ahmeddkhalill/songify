using FluentValidation;

namespace Songify.Application.Contracts.Playlists;

public class CreatePlaylistRequestValidator : AbstractValidator<CreatePlaylistRequest>
{
    public CreatePlaylistRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);
    }
}
