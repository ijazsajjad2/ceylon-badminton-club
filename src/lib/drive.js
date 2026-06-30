// Google Drive video helpers.
//
// How posting a club match video works:
//   1. In Google Drive, right-click the video → Share → "Anyone with the link" (Viewer).
//   2. Copy the link. It looks like one of these:
//        https://drive.google.com/file/d/FILE_ID/view?usp=sharing
//        https://drive.google.com/open?id=FILE_ID
//        https://drive.google.com/uc?id=FILE_ID&export=download
//      …or the user can just paste the bare FILE_ID.
//   3. We extract FILE_ID and build:
//        embed  → https://drive.google.com/file/d/FILE_ID/preview   (iframe player)
//        poster → https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000  (still frame)
//
// No API key needed — these endpoints work for any link-shared file. If a file is NOT
// shared publicly the iframe shows Drive's own "need access" screen, which we warn about.

const ID_RE = /[-\w]{25,}/ // Drive file ids are long URL-safe strings

export function extractDriveId(input) {
  if (!input) return null
  const str = String(input).trim()

  // Common explicit patterns first (more reliable than the generic id regex).
  const patterns = [
    /\/file\/d\/([-\w]{25,})/, // /file/d/<id>/
    /[?&]id=([-\w]{25,})/, // ?id=<id> or &id=<id>
    /\/d\/([-\w]{25,})/, // /d/<id>
  ]
  for (const re of patterns) {
    const m = str.match(re)
    if (m) return m[1]
  }
  // Bare id pasted on its own.
  if (/^[-\w]{25,}$/.test(str)) return str
  // Last resort: any long token in the string.
  const loose = str.match(ID_RE)
  return loose ? loose[0] : null
}

export function driveEmbedUrl(id) {
  return `https://drive.google.com/file/d/${id}/preview`
}

export function driveThumbUrl(id, width = 1000) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`
}

export function driveOpenUrl(id) {
  return `https://drive.google.com/file/d/${id}/view`
}

export function isDriveLink(input) {
  return !!extractDriveId(input)
}

// Normalises a pasted link/id into the bits we store + render.
export function parseDriveVideo(input) {
  const id = extractDriveId(input)
  if (!id) return { ok: false, error: 'Could not find a Google Drive file ID in that link.' }
  return {
    ok: true,
    id,
    embed: driveEmbedUrl(id),
    thumb: driveThumbUrl(id),
    open: driveOpenUrl(id),
  }
}
