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
  // Derive slides from the SAME array the grid renders, so the clicked index
  // always lines up with the lightbox slide.
  const slides = photos.map(toSlide)

  return (
    <div className="rpa-gallery">
      <MasonryPhotoAlbum
        photos={photos}
        spacing={12}
        columns={(w) => (w < 480 ? 2 : w < 900 ? 3 : 4)}
        componentsProps={{ image: { loading: 'lazy', decoding: 'async' } }}
        onClick={({ index: i }) => setIndex(i)}
      />
      {index >= 0 && (
        <Suspense fallback={null}>
          <GalleryLightbox open={index >= 0} close={() => setIndex(-1)} index={index} slides={slides} />
        </Suspense>
      )}
    </div>
  )
}
