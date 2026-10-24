# Media update — current motion logo and responsive photos

## Current motion logo

The source selected for this website is the user-supplied `MFM NEW THUMNAIL (MOTION LOGO).mp4` from MEDIA BACKUP1.rar. The separately supplied `MFM MOTION LOGO.mp4` is the old/previous logo and is **not** used as the current motion logo.

- Public file: `/media/new-motion-logo.mp4`.
- Format: H.264 video with AAC audio, 640 × 360, 6.780227 seconds.
- File size: 928,733 bytes.
- The public video is a byte-for-byte copy of the supplied current source; SHA-256: `ee17309b4c15eabf66585fb7266f58b9b80cddc03e8f190ebb3942a4001bede0`.
- Use only with user-controlled playback. It need not autoplay or preload on mobile.

`/media/new-motion-poster.webp` is a 640 × 360 still captured at 3.0 seconds, before the closing text. It shows the MFM logo centered against the supplied purple/magenta atmosphere. The 23,808-byte poster retains the supplied visual identity and is appropriate as a calm initial state and reduced-motion fallback. No church metadata has been added to the image.

## Responsive service photographs

These are smaller versions of already verified regional service photographs. Each is 640 × 360 WebP. They preserve the original image composition and use quality 82 to reduce mobile transfer size.

| Small file                         |  Bytes | Existing larger variant                    |
| ---------------------------------- | -----: | ------------------------------------------ |
| `regional-fellowship-small.webp`   | 35,850 | `regional-fellowship.webp` (1,400 × 788)   |
| `regional-congregation-small.webp` | 39,594 | `regional-congregation.webp` (1,000 × 563) |
| `regional-thanksgiving-small.webp` | 41,550 | `regional-thanksgiving.webp` (1,000 × 563) |
| `regional-prayer-small.webp`       | 35,468 | `regional-prayer.webp` (1,000 × 563)       |

Use width descriptors and an appropriate `sizes` attribute for responsive image selection. The four mobile photos total 152,462 bytes; adding the motion poster totals 176,270 bytes. The video itself should download only when playback is requested.

See `CONTENT-SOURCES.md` for photograph provenance. Captions should describe the regional archive rather than inventing dates, names, schedules, or current leadership roles.
