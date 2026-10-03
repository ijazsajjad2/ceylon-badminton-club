import { Suspense, lazy, useState } from 'react'
import { MasonryPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/masonry.css'
import { GALLERY_PHOTOS } from '../data/gallery.js'

// Lazy-load the lightbox (+ its plugins) only when a visitor first opens a
// photo — keeps that heavy code out of the initial page bundle.
const GalleryLightbox = lazy(() => import('./GalleryLightbox.jsx'))

const toSlide = (p) => ({
  src: p.src,
  width: p.width,
  height: p.height,
  alt: p.alt,
  title: p.caption,
  description: 'Ceylon Badminton Club · Riyadh',
})

export default function AdvancedGallery({ photos = GALLERY_PHOTOS }) {
  const [index, setIndex] = useState(-1)
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const categories = ['All', ...new Set(photos.map(photo => photo.tag).filter(Boolean))]
  const filtered = photos.filter(photo => (category === 'All' || photo.tag === category) && `${photo.caption} ${photo.tag}`.toLowerCase().includes(query.trim().toLowerCase()))
  // Derive slides from the SAME array the grid renders, so the clicked index
  // always lines up with the lightbox slide.
  const slides = filtered.map(toSlide)

  return (
    <div className="rpa-gallery">
      <div className="gallery-tools"><div className="session-filters" role="group" aria-label="Photo categories">{categories.map(tag => <button key={tag} aria-pressed={category === tag} onClick={() => { setCategory(tag); setIndex(-1) }}>{tag}</button>)}</div><label className="gallery-search">Search club photos<input type="search" placeholder="Try team or trophy…" value={query} onChange={event => { setQuery(event.target.value); setIndex(-1) }}/></label></div>
      <p className="gallery-results" role="status">{filtered.length} of {photos.length} club moments</p>
      <MasonryPhotoAlbum
        photos={filtered}
        spacing={12}
        columns={(w) => (w < 480 ? 2 : w < 900 ? 3 : 4)}
        componentsProps={{ image: { loading: 'lazy', decoding: 'async' } }}
        onClick={({ index: i }) => setIndex(i)}
        render={{
          extras: (_, { photo }) => (
            <span className="ph-overlay" aria-hidden="true">
              {photo.tag && <span className="ph-tag">{photo.tag}</span>}
              <span className="ph-cap">{photo.caption}</span>
            </span>
          ),
        }}
      />
      {!filtered.length && <div className="session-empty"><h3>No photos found</h3><p>Try another category or search.</p><button className="btn btn-ghost" onClick={() => { setCategory('All'); setQuery('') }}>Show all photos</button></div>}
      {index >= 0 && (
        <Suspense fallback={null}>
          <GalleryLightbox open={index >= 0} close={() => setIndex(-1)} index={index} slides={slides} />
        </Suspense>
      )}
    </div>
  )
}
