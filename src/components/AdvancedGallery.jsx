import { useState } from 'react'
import { MasonryPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/masonry.css'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import 'yet-another-react-lightbox/plugins/captions.css'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow'
import { GALLERY_PHOTOS } from '../data/gallery.js'

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
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Zoom, Thumbnails, Captions, Counter, Fullscreen, Slideshow]}
        carousel={{ finite: false, padding: '24px' }}
        counter={{ container: { style: { top: 'unset', bottom: 0, left: 0 } } }}
        thumbnails={{ position: 'bottom', width: 96, height: 64, border: 0, gap: 8, padding: 0, borderRadius: 8 }}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        captions={{ showToggle: true, descriptionTextAlign: 'center' }}
        styles={{ root: { '--yarl__color_backdrop': 'rgba(6,9,20,0.94)' } }}
        animation={{ fade: 280, swipe: 320 }}
      />
    </div>
  )
}
