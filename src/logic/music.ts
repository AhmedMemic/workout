/** Display name for an added song: the file name without its extension or track-number prefix. */
export function trackName(fileName: string): string {
  const base = fileName.replace(/\.[a-z0-9]{2,4}$/i, '')
  const clean = base.replace(/^\d{1,3}[\s._-]+/, '').replace(/_/g, ' ').trim()
  return clean || base || fileName
}

/**
 * Play order as indices into the track list, beginning with `start`.
 * Shuffled orders still begin with `start`, so tapping a song plays that song first.
 */
export function playOrder(count: number, start = 0, shuffle = false, random = Math.random): number[] {
  if (count === 0) return []
  const first = Math.min(Math.max(start, 0), count - 1)
  const rest = Array.from({ length: count }, (_, i) => i).filter((i) => i !== first)
  if (shuffle) {
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[rest[i], rest[j]] = [rest[j], rest[i]]
    }
    return [first, ...rest]
  }
  // in order, wrapping around to the songs before `start`
  return [first, ...rest.filter((i) => i > first), ...rest.filter((i) => i < first)]
}

export function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`
}
