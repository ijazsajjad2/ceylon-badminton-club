// Central place for club contact + venue details.
// 👉 To wire the real club WhatsApp: set WHATSAPP_NUMBER (international format,
//    digits only, no +) e.g. '9665XXXXXXXX', or paste a group invite link into
//    WHATSAPP_GROUP_URL. Until then the buttons open a WhatsApp compose.

export const WHATSAPP_NUMBER = '' // e.g. '9665XXXXXXXX'
export const WHATSAPP_GROUP_URL = '' // e.g. 'https://chat.whatsapp.com/XXXXXXXX'
export const INSTAGRAM_URL = '' // e.g. 'https://instagram.com/ceylonbadmintonclub'

// Green Badminton Club, Riyadh (from the club's Google Maps pin)
export const VENUE_NAME = 'Green Badminton Club'
export const VENUE_CITY = 'Riyadh, Saudi Arabia'
export const VENUE_COORDS = { lat: 24.626675, lng: 46.7966402 }
export const MAP_SHARE_URL = 'https://maps.app.goo.gl/anz2thYmGfSub3nDA'
export const MAP_EMBED_URL = `https://www.google.com/maps?q=${VENUE_COORDS.lat},${VENUE_COORDS.lng}&z=16&output=embed`
export const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${VENUE_COORDS.lat},${VENUE_COORDS.lng}`

const JOIN_MESSAGE = "🏸 Hi! I'd love to join the Ceylon Badminton Club in Riyadh — when's the next session?"

// Opens the best available WhatsApp target (group link > number > generic compose).
export function whatsappJoin(message = JOIN_MESSAGE) {
  let url
  if (WHATSAPP_GROUP_URL) url = WHATSAPP_GROUP_URL
  else if (WHATSAPP_NUMBER) url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  else url = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener')
}
