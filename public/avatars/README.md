# Member photos

Drop each member's photo here as `<player-id>.jpg` (square, ~400×400 works
best — I'll happily optimize any photo you give me). Then in
`src/data/players.js` add a `photo` field to that player, e.g.:

    { id: 'p15', name: 'Ijaz', level: 'Advanced', joinDate: '2022-08-20', photo: '/avatars/p15.jpg' },

Avatars fall back to the initials gradient automatically if a photo is
missing or fails to load, so this is safe to roll out one member at a time.
