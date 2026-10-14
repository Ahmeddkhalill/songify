import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-fg font-semibold hover:bg-accent-500 disabled:bg-ink-800 disabled:text-ink-500 disabled:hover:bg-ink-800',
  secondary:
    'border border-ink-700 bg-transparent text-ink-200 font-medium hover:border-ink-600 disabled:text-ink-500',
  ghost: 'bg-transparent text-ink-300 font-medium hover:bg-ink-800 hover:text-ink-100',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export default function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`flex items-center justify-center gap-2 h-10 px-4 rounded-md text-body ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
