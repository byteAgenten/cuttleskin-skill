# Speedometer example

A speedometer graphic driven by the cuttleskin browser bundle (`cuttleskin.iife.js`):

- `speedometer.svg`: the graphic (needle, colored arc segment, digital readout)
- `speedometer.config.json`: cuttleskin configuration with the variable `speed` (0–200 km/h)
  - `rotate` on `#needle`: -120° at 0 km/h to +120° at 200 km/h, animated
  - `text` on `#speed-text`: bound to the formatted value of `speed`
  - `stroke-color` on `#speed-band`: green (0) → yellow (100) → red (200)
- `lcars.svg`: second speedometer in a sci-fi console style inspired by LCARS (classes/IDs prefixed `lc-`,
  because styles of inline SVGs apply to the whole page)
- `lcars.config.json`: cuttleskin configuration of the second speedometer, also driven by `speed`
  - `rotate` on `#lc-needle`, `text` (bind) on `#lc-speed-text`
  - `opacity` on the 20 segments `#lc-seg-0` … `#lc-seg-19`: each lights up within its 10 km/h range
  - `text` frames on `#lc-status-text`: IMPULSE (0), WARP (from 100), RED ALERT (from 170)
  - `fill-color` on the frame elbows: lavender (0) → orange (100) → red (200)
- `cyberpunk.svg` / `cyberpunk.config.json`: neon style (prefix `cp-`)
  - `stroke-color` and `stroke-width` on the neon ring `#cp-ring`: cyan → magenta → red, 3 → 12 px
  - `text` (bind) and `fill-color` on the readout, plus two offset copies that fade in via `opacity`
    from 150 km/h as a glitch effect
  - `text` frames on `#cp-status-text`: CRUISE, BOOST (100), OVERDRIVE (150), SYSTEM CRITICAL (180)
- `comic.svg` / `comic.config.json`: comic style (prefix `cm-`)
  - `rotate` with `elastic` easing: the arrow wobbles into position
  - `text` frames in the speech bubble: Gemütlich…, Läuft! (60), Zügig! (120), WAHNSINN! (170);
    `fill-color` heats the bubble up
  - `opacity` on motion lines (80–120 km/h) and the starburst (160–170 km/h), `scale` with `backout`
    easing lets the starburst pop up
- `retro-led.svg` / `retro-led.config.json`: 1970s/80s LED dashboard (prefix `rl-`)
  - `opacity` with `step` easing on 20 LEDs: each switches on (no fading) once its 10 km/h step is reached
  - `opacity` with `step` easing on the lamps: ECO below 60 km/h, OVER from 180 km/h
  - `text` (bind) on the digital readout in front of a dimmed "888"
- `pixel.svg` / `pixel.config.json` / `pixel/*.png`: pixel art on a 160×120 grid (prefix `px-`)
  - `image-url` swaps the car sprite (32×10 px PNGs, scaled up pixelated via
    `imageRendering: "speed"`): `car-slow.png`, `car-fast.png` (100), `car-turbo.png` (150);
    `app.js` sets the asset root `pixel/` via `graphic.setAssetRoot`
  - `translate` moves the car along the road (frames only change x)
  - `fill-color` turns the sky from day to dusk, `opacity` with `step` easing on 10 bar blocks
  - `text` (bind) and `text` frames (IDLE, GO!, TURBO!)
  - the configuration sets `settings.imageRendering: "speed"` for pixelated image scaling
  - the car images live in `pixel/`; upload them in the portal editor under “Images”
