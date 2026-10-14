import { useEffect, useState, type FormEvent } from 'react'
import type { ApiError } from '../api/client'
import { updatePlaylist } from '../api/playlists'
import Button from './Button'
import Dialog from './Dialog'

interface RenamePlaylistDialogProps {
  open: boolean
  onClose: () => void
  playlistId: number
  initialName: string
  initialDescription: string | null
  onRenamed: (name: string, description: string | null) => void
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    'fieldErrors' in error
  )
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="m-0 flex gap-1.5 items-center text-caption font-normal text-danger-400">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16.5v.01" />
      </svg>
      {message}
    </p>
  )
}

const fieldBase = 'rounded-md border bg-ink-950 text-ink-100 text-body-lg focus:border-ink-400'

export default function RenamePlaylistDialog({
  open,
  onClose,
  playlistId,
  initialName,
  initialDescription,
  onRenamed,
}: RenamePlaylistDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setDescription(initialDescription ?? '')
      setNameError(null)
      setDescriptionError(null)
      setPending(false)
    }
  }, [open, initialName, initialDescription])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()

    if (pending) {
      return
    }

    const trimmedName = name.trim()
    const trimmedDescription = description.trim() || null
    setNameError(null)
    setDescriptionError(null)

    if (trimmedName.length === 0) {
      setNameError('Enter a name.')
      return
    }

    setPending(true)

    try {
      await updatePlaylist(playlistId, { name: trimmedName, description: trimmedDescription })
      onRenamed(trimmedName, trimmedDescription)
    } catch (error) {
      if (!isApiError(error)) {
        setNameError('Something went wrong.')
        return
      }

      if (error.code === 'Playlist.DuplicateName') {
        setNameError(error.message)
      } else if (error.status === 400 && error.fieldErrors) {
        const nameMessage = error.fieldErrors.name?.[0]
        const descriptionMessage = error.fieldErrors.description?.[0]

        if (nameMessage) {
          setNameError(nameMessage)
        }
        if (descriptionMessage) {
          setDescriptionError(descriptionMessage)
        }
        if (!nameMessage && !descriptionMessage) {
          setNameError(error.message)
        }
      } else {
        setNameError(error.message)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy="rename-playlist-title">
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <h2 id="rename-playlist-title" className="m-0 text-subhead">
          Rename playlist
        </h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rename-name" className="text-small font-medium text-ink-300">
            Name
          </label>
          <input
            id="rename-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setNameError(null)
            }}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? 'rename-name-error' : undefined}
            className={`h-11 px-3 ${fieldBase} ${nameError ? 'border-danger-500' : 'border-ink-700'}`}
          />
          {nameError && <FieldError id="rename-name-error" message={nameError} />}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rename-description" className="text-small font-medium text-ink-300">
            Description <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            id="rename-description"
            rows={2}
            placeholder="What’s it for?"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              setDescriptionError(null)
            }}
            aria-invalid={descriptionError ? true : undefined}
            aria-describedby={descriptionError ? 'rename-description-error' : undefined}
            className={`px-3 py-2.5 leading-[22px] resize-none placeholder:text-ink-500 ${fieldBase} ${
              descriptionError ? 'border-danger-500' : 'border-ink-700'
            }`}
          />
          {descriptionError && (
            <FieldError id="rename-description-error" message={descriptionError} />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
