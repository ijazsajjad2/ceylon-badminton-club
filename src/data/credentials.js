// Member login credentials.
// Passwords are stored as SHA-256 hashes (NOT plaintext) - raw passwords are
// never committed. Login hashes the entered password and compares it here, so
// the source cannot reveal anyone’s password. This is a convenience gate, not
// server-grade auth; the raw passwords were shared with members privately.
//
// To reset a password, hash the new one (browser console):
//   crypto.subtle.digest("SHA-256", new TextEncoder().encode("newpass"))
//     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))

export const CREDENTIALS = {
  tharindu:   "de5eb7ce1425699bbde22bea3764e5c98ed45eb3179d409bbae9a0c402ca4af7",
  iresh:      "c7421a88af9f56e2cbd23f0d3434a98e1b89d1c741b2834177ee6692ba1ac1a6",
  muditha:    "12cdbfd88cceaced02593673ee7d589a5e56aa26f28aee8d38810a0edec60b82",
  kitha:      "e1758ec8dea9a5f9ee0104ffd79a0f07c8eefb078e76dd3424b59b5b7fd6ea82",
  pj:         "c74944232ecc1aac06369294e569e532876529d6edab483e56859dd6eb2672b4",
  edward:     "5fa6a96d3b7b35b06aef0248b841d4b8cb7db0733049f8a9426eefc22b64252b",
  fahami:     "0d6affbc7eb4d75dc3bb444149b6f71490b782865011552455f7bb3ee01d5217",
  minshi:     "b8d255c37c8fb31a6fbf66217b36854067182cd1ba86282a55432c55b6dfa6f2",
  ramzeen:    "de1972d4934c2c7e03211568cf05e513f616d29e91f4f243b5183aa3265c61ac",
  nihad:      "2f714bb20f483d2a9c33043c1820ac6a2dd870b3c1979bf4841a38574ba14e5d",
  fazil:      "436f6a2ca5d457bba5912fab57a9a9cf83b9a0126c14054dc6884cb7a2f145f9",
  mali:       "265241b1dac0b99a21d1eac2dbca1e59b24939f428807a735cead4b659af0a6d",
  buddi:      "e73ffe17a8e15b966f4d9e97f9d49d2ff962f310e878381c69d771abde06cf5d",
  gayan:      "ef26b59fb7d11474a81f36257b0623c71a493780bfea445ddbe499e50510b3a8",
  ijaz:       "16b849db75498eb7f56f12f04288e4d2f16db503d4f37b4e2f10d8d5d1f2d7b3",
  richy:      "e7c66a922105bcb877b227f0c7f987827e7b02ed7849af368ca8bab600047cd0",
  admin:      "70f4ede8f9c641de6f127a379c54165cb728f873c3a9a1fbb8ebf933c82d56cc",
}

// The one account allowed to record match scores — the club's scorekeeper.
export const SCOREKEEPER_USERNAME = 'ijaz'

// Maps username -> player ID for personalisation.
export const USERNAME_TO_PLAYER = {
  tharindu:   "p1",
  iresh:      "p2",
  muditha:    "p3",
  kitha:      "p4",
  pj:         "p5",
  edward:     "p6",
  fahami:     "p7",
  minshi:     "p8",
  ramzeen:    "p9",
  nihad:      "p10",
  fazil:      "p11",
  mali:       "p12",
  buddi:      "p13",
  gayan:      "p14",
  ijaz:       "p15",
  richy:      "p16",
}
