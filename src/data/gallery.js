// Real Ceylon Badminton Club photos (Riyadh). Served from /public/gallery.
// width/height are the true pixel dimensions — react-photo-album needs them to
// lay out the masonry grid without reflow.
// tag = category label for the grid chip (Tournament / On court / Team / Club life)
const RAW = [
  { n: 1,  w: 798,  h: 1280, cap: 'Year-end open tournament', tag: 'Tournament' },
  { n: 2,  w: 1280, h: 783,  cap: 'Open badminton meet-up', tag: 'Club life' },
  { n: 3,  w: 1024, h: 1536, cap: 'Game face on', tag: 'On court' },
  { n: 4,  w: 739,  h: 1600, cap: 'Eyes on the shuttle', tag: 'On court' },
  { n: 5,  w: 739,  h: 1600, cap: 'Ready to serve', tag: 'On court' },
  { n: 6,  w: 739,  h: 1600, cap: 'Smash incoming', tag: 'On court' },
  { n: 7,  w: 1600, h: 739,  cap: 'Doubles on court', tag: 'On court' },
  { n: 8,  w: 1600, h: 739,  cap: 'Rally in motion', tag: 'On court' },
  { n: 9,  w: 1280, h: 960,  cap: 'The full squad', tag: 'Team' },
  { n: 10, w: 1600, h: 739,  cap: 'All smiles after the game', tag: 'Club life' },
  { n: 11, w: 1600, h: 739,  cap: 'Team Ceylon', tag: 'Team' },
  { n: 12, w: 1280, h: 591,  cap: 'In club colours', tag: 'Team' },
  { n: 13, w: 1280, h: 591,  cap: 'Brothers in red & navy', tag: 'Team' },
  { n: 14, w: 739,  h: 1600, cap: 'Rackets up', tag: 'On court' },
  { n: 15, w: 1200, h: 1600, cap: 'Champions', tag: 'Tournament' },
  { n: 16, w: 1200, h: 1600, cap: 'Trophy night', tag: 'Tournament' },
  { n: 17, w: 1600, h: 1200, cap: 'Game faces', tag: 'On court' },
  { n: 18, w: 2560, h: 1706, cap: 'Good company', tag: 'Club life' },
  { n: 19, w: 1600, h: 1066, cap: 'Courtside', tag: 'On court' },
  { n: 20, w: 1600, h: 1066, cap: 'Another title for the club', tag: 'Tournament' },
  { n: 21, w: 1600, h: 1066, cap: 'Home court', tag: 'On court' },
  { n: 22, w: 1600, h: 1066, cap: 'Prize giving', tag: 'Tournament' },
  { n: 23, w: 1600, h: 1066, cap: 'Club night', tag: 'Club life' },
  { n: 24, w: 1600, h: 1066, cap: 'Celebrating together', tag: 'Club life' },
  { n: 25, w: 1600, h: 1066, cap: 'On the podium', tag: 'Tournament' },
]

const pad = (n) => String(n).padStart(2, '0')
const src = (n) => `/gallery/club-${pad(n)}.jpg`
const smSrc = (n) => `/gallery/club-${pad(n)}-sm.jpg`

// For react-photo-album (masonry layout). Each photo ships a `srcSet` with a
// 600px-wide derivative so the ~280px grid cells download a right-sized image
// (the full-res original is reserved for the lightbox zoom).
export const GALLERY_PHOTOS = RAW.map((p) => ({
  src: src(p.n),
  width: p.w,
  height: p.h,
  alt: `Ceylon Badminton Club — ${p.cap}`,
  caption: p.cap,
  tag: p.tag,
  srcSet: [
    { src: smSrc(p.n), width: 600, height: Math.round((600 * p.h) / p.w) },
    { src: src(p.n), width: p.w, height: p.h },
  ],
}))

// Real tournament / trophy moments (subset of the gallery) for the public
// "Milestones" strip. Titles are the photos' own captions — nothing invented.
// 👉 To add detail (event name, date, placing), just edit the entries below.
export const MILESTONES = [16, 15, 25, 22, 20, 1].map((n) => {
  const p = RAW.find((x) => x.n === n)
  return { src: smSrc(n), full: src(n), width: p.w, height: p.h, title: p.cap }
})

// A hand-picked subset for the compact "about" strip / hero rotation.
export const FEATURED = [11, 8, 4, 15, 9, 19].map((n) => {
  const p = RAW.find((x) => x.n === n)
  return { src: src(n), width: p.w, height: p.h, caption: p.cap }
})

export const HERO_PHOTO = src(8)
// WebP variant of the hero used via CSS image-set() (the JPEG above stays the
// universal fallback for the ~3% of browsers without WebP support).
export const HERO_WEBP = '/gallery/club-08.webp'
