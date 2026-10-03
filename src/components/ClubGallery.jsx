import { lazy, Suspense, useState } from 'react'
import { FEATURED } from '../data/gallery.js'

const Gallery = lazy(() => import('./AdvancedGallery.jsx'))
const Lightbox = lazy(() => import('./GalleryLightbox.jsx'))
const featured = FEATURED.slice(0, 4)

export default function ClubGallery() {
  const [expanded, setExpanded] = useState(false)
  const [index, setIndex] = useState(-1)
  return <>
    {expanded ? <Suspense fallback={<p role="status">Loading club photos…</p>}><Gallery/></Suspense> : <div className="club-mosaic">{featured.map((photo, i) => <button className={`mosaic-photo mosaic-photo-${i}`} key={photo.src} onClick={() => setIndex(i)} aria-label={`View photo: ${photo.caption}`}><img src={photo.src} alt={photo.caption} width={photo.width} height={photo.height} loading="lazy" decoding="async"/><span className="mosaic-caption"><small>{i === 0 ? 'THE PEOPLE BEHIND THE GAME' : 'CEYLON BADMINTON CLUB'}</small><strong>{photo.caption}</strong><span aria-hidden="true">↗</span></span></button>)}</div>}
    <button className="btn btn-ghost gallery-expand" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? 'Show highlights' : 'Explore & search all photos'} ↗</button>
    {index >= 0 && <Suspense fallback={<p role="status">Opening photo…</p>}><Lightbox open close={() => setIndex(-1)} index={index} slides={featured.map(photo => ({ ...photo, alt: photo.caption, title: photo.caption }))}/></Suspense>}
  </>
}
