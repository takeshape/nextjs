export function isInteractive({ stream = process.stdout } = {}) {
  return Boolean(stream && stream.isTTY && process.env['TERM'] !== 'dumb' && !('CI' in process.env))
}

export function isValidUrl(str: string) {
  try {
    new URL(str)
    return true
  } catch (err) {
    return false
  }
}
