interface ErrorBannerProps {
  title: string
  description: string
  onRetry: () => void
  retryLabel?: string
}

export default function ErrorBanner({
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 p-4 border border-ink-750 rounded-lg bg-ink-900"
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-small text-ink-400">{description}</span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex-none h-9 px-3.5 rounded-md border border-ink-700 bg-transparent text-small font-medium text-ink-100 hover:bg-ink-800"
      >
        {retryLabel}
      </button>
    </div>
  )
}
