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

// The lightbox + its plugins are heavy and only needed once a visitor taps a
// photo, so this whole module is lazy-loaded (see AdvancedGallery). Keeping the
// imports here keeps them out of the initial bundle.
export default function GalleryLightbox({ open, close, index, slides }) {
  return (
    <Lightbox
      open={open}
      close={close}
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
  )
}
