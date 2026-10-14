const base =
  'relative aspect-square rounded-lg overflow-hidden bg-ink-850 transition-shadow group-hover:shadow-[0_0_0_1px_var(--color-ink-600)]'

export default function PlaylistCover({ coverImageUrls }: { coverImageUrls: string[] }) {
  if (coverImageUrls.length >= 4) {
    return (
      <div className={base}>
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {coverImageUrls.slice(0, 4).map((url, index) => (
            <img key={index} src={url} alt="" className="w-full h-full object-cover" />
          ))}
        </div>
      </div>
    )
  }

  if (coverImageUrls.length > 0) {
    return (
      <div className={base}>
        <img src={coverImageUrls[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className={`${base} grid place-items-center text-ink-600 border border-ink-750`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </svg>
    </div>
  )
}
