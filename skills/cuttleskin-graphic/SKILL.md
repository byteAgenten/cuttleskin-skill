---
name: cuttleskin-graphic
description: Creates, edits and validates cuttleskin graphics – an SVG file plus a configuration (cuttleskin.config.json) whose variables drive individual SVG elements through transformations (rotation, position, scale, color, opacity, text, image, motion along a path). Use when a new cuttleskin graphic is to be drawn, an existing graphic or its configuration changed, a configuration explained or checked for errors, or when someone wants an animated or data-driven SVG display (gauge, speedometer, dial, clock, status display, level indicator, switch, map) for cuttleskin, a website or Home Assistant.
---

# Creating cuttleskin graphics

A cuttleskin graphic consists of two files:

- **SVG**: the drawing. Every element that should change has a unique `id`.
- **Configuration** (`cuttleskin.config.json`, named `<name>.config.json` in the examples):
  - **Variables**: the inputs of the graphic, e.g. `speed` from 0 to 200 or `doorOpen` yes/no.
  - **Transformations**: each one binds a variable to a property of an SVG element.
  - **Frames**: values of a transformation at positions of the variable, e.g. `$min` → −120°, `$max` → 120°. The runtime interpolates in between. Every transformation has its own frames.

The cuttleskin runtime reads both files, sets the variable values from outside and applies the transformations to the SVG. Graphics are edited, tested and exported in the cuttleskin portal (https://cuttleskin.com).

The examples are in `examples/` inside the skill folder, the validator is `scripts/validate.mjs`. Paths such as `examples/speedometer/…` refer to that folder.


The full reference of all fields is in [reference/config-schema.md](reference/config-schema.md), proven patterns are in [reference/patterns.md](reference/patterns.md). Both reference files are written in German.

## Workflow

1. **Clarify the requirements.** Which states should the graphic show? Which inputs are there? For every input decide:
   - Type: `number` with minimum and maximum, `boolean` or `text`.
   - Default value.
   - What visibly happens.

   Ask about unclear value ranges or units instead of guessing.

2. **Design the variables.** As few as possible, named after the domain, in camelCase (`speed`, `seatDriverBelted`). One variable may drive several transformations.
3. **Draw the SVG** following the rules below:
   - First the static drawing.
   - Then every moving or changing part as its own element or group with an `id`.
4. **Write the configuration.**
   - One transformation per effect.
   - Frames as a list with position `at`: at `$min`/`$max` or `false`/`true`, plus further positions as needed.
5. **Validate** with the script (see below). Fix all errors, weigh the warnings.
6. **Preview** if possible.
   - In the portal (https://cuttleskin.com): “New graphic”, paste SVG source and configuration, then move through the values with the playhead in the editor.


7. **Document.** For every graphic a short `README.md` with a table of the variables, following `examples/car-status/README.md`.

## Rules for the SVG

- Root element `<svg xmlns="http://www.w3.org/2000/svg" viewBox="…">`. Always set `viewBox`, otherwise the graphic does not scale.
- At most 1 MiB.
- No `<script>`, no `on…` attributes.
- `<use>` only with references inside the SVG (`href="#id"`). The portal removes external references.
- **IDs**:
  - Only on elements that are addressed.
  - Unique, descriptive, in kebab-case.
  - In larger graphics with a common prefix, e.g. `car-door-fl`.
- **Colors as presentation attributes** (`fill="#e2e8f0"`), not in `<style>` blocks with `!important`.
  - The runtime writes inline styles; they override attributes and normal CSS rules, but not `!important`.
- **Use groups deliberately:**
  - For movement (rotate, translate, scale) put the parts that belong together into a `<g id="…">`.
  - For color changes address the element whose color should change. A fill on a group is only inherited by children **without** their own `fill`.
  - Put movement and color on different elements if needed, e.g. `car-door-fl` rotates, `car-door-fl-panel` turns orange.
- **Choose pivot points deliberately.**
  - A needle or a door rotates around a fixed point (`origin: { "x": …, "y": … }` in the element's coordinate system, see the reference).
  - If the needle is drawn in its zero position, e.g. pointing straight up, the frame values are directly the angle relative to that position.
- **Text**:
  - Put dynamic text into its own `<text>` or `<tspan>` with an `id`; its content is replaced completely.
  - Set `text-anchor` appropriately (e.g. `middle`) so that changing lengths do not shift the text.
- **Initial state**: the SVG should look sensible without the runtime, ideally in the state of the default values.

## Configuration in brief

```json
{
  "variables": [
    {
      "name": "speed",
      "type": "number",
      "minimum": 0,
      "maximum": 200,
      "defaultValue": 0
    }
  ],
  "transformations": [
    {
      "name": "needle_angle",
      "type": "rotate",
      "element": "needle",
      "variable": "speed",
      "origin": { "x": 150, "y": 150 },
      "transition": { "duration": 400, "easing": "easeout" },
      "frames": [
        { "at": "$min", "value": -120 },
        { "at": "$max", "value": 120 }
      ]
    },
    {
      "name": "band_color",
      "type": "stroke-color",
      "element": "speed-band",
      "variable": "speed",
      "frames": [
        { "at": "$min", "value": "#22c55e" },
        { "at": 100, "value": "#eab308", "label": "medium" },
        { "at": "$max", "value": "#ef4444" }
      ]
    },
    {
      "name": "speed_text",
      "type": "text",
      "element": "speed-text",
      "variable": "speed",
      "bind": true
    }
  ]
}
```

| Type                          | Frame value      | Effect                                                           |
| ----------------------------- | ---------------- | ---------------------------------------------------------------- |
| `rotate`                      | number (degrees) | rotation around `origin`                                         |
| `translate`                   | `{ "x", "y" }`   | movement (offset in `<svg>` coordinates)                         |
| `scale`                       | `{ "x", "y" }`   | factor around `origin`                                           |
| `opacity`                     | number **0–1**   | opacity; at 0 also invisible to clicks                           |
| `fill-color` / `stroke-color` | CSS color        | fill or stroke color, interpolated                               |
| `stroke-width`                | number           | line width                                                       |
| `text`                        | string           | text content; with `"bind": true` the rounded variable value     |
| `image-url`                   | string           | `href` of an `<image>`; with `bind` directly the variable value  |
| `motion-path`                 | number **0–100** | position on the path `path` in % of its length; `orient` rotates |

A frame is `{ "at": position, "value": value }`, optionally with `easing` (curve up to the next frame) and `label` (description). Positions per variable type:

| Variable type | Allowed positions `at`                    | Behavior between frames                    |
| ------------- | ----------------------------------------- | ------------------------------------------ |
| `number`      | `"$min"`, `"$max"`, a number in the range | linear interpolation (or easing per frame) |
| `boolean`     | `false`, `true`                           | switches                                   |
| `text`        | any text                                  | switches when the text matches exactly     |

`default` on the transformation applies wherever no frame matches, e.g. for unknown texts.

## Validate

Needs only Node.js 18 or later, no packages:

```sh
node <skill-folder>/scripts/validate.mjs <name>.svg <name>.config.json
```


The script checks:

- the configuration with the same parser as the cuttleskin portal;
- that every referenced `id` exists in the SVG and none occurs twice;
- root element and size of the SVG;
- typical mistakes, e.g. `text` on an element that is not a `<text>`, `rotate` without `origin`, unused variables, former formats (`center`, `axis`, `keyFrames`, frames as an object with names).

Exit code 1 on errors. Only hand over when no errors are reported.

## Pitfalls

- **Opacity** is given as 0–1, not in percent. The editor shows percent, 0–1 is stored.
- **Frame positions** must match the variable.
  - `"$min"`/`"$max"` only for `number`, `false`/`true` (without quotes) only for `boolean`.
  - Each position at most once per transformation.
  - Frames have no names and variables have no `keyFrames`. If several transformations should act at the same threshold, each gets a frame with the same `at`.
- **Invalid entries are dropped silently.** The runtime leaves out faulty variables or transformations and shows the rest. Therefore always run the validator.
- **Transformations on the same element add up**, in the order of `priority` (higher first). For rotation plus movement put both on the same element or split them across nested groups.
- **`translate` is an offset**, not an absolute position. `{ "x": 0, "y": 0 }` is the drawn position.
- **Numbers in `bind` text** are rounded to integers. Units belong in a separate, static `<text>`.
- **No if-then between variables.** Solve combinations with layers. Example: `seatBelted` colors the person, `seatOccupied` shows them; on empty seats the color is not visible.
- **Transitions**: `transition` animates value changes at runtime (duration in ms). For needles 300–500 ms with `easeout`, for colors `linear`, for hard switches none.

## Examples

| File                                                     | Shows                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `examples/speedometer/speedometer.svg` + `.config.json`  | needle (`rotate`), color band over 3 frames, bound text                         |
| `examples/speedometer/lcars.*`, `retro-led.*`, `pixel.*` | many segments that are shown and hidden one after the other                     |
| `examples/speedometer/comic.*`, `cyberpunk.*`            | effects from a threshold on, through additional frames                          |
| `examples/car-status/car-status.*`                       | 15 `boolean` variables: doors rotate around hinges, show/hide, color changes    |
| `examples/climate/climate.*`                             | combined instrument: two segment arcs, colors and status text for two variables |
| `examples/weather-oracle/weather-oracle.*`               | three instruments in one graphic, level via `scale`, day/night via opacity      |
| `examples/metro-map/metro-map.*`                         | trains follow their line via `motion-path`, disruption as `boolean` with text   |
| `examples/grand-prix/grand-prix.*`                       | `motion-path` with `"orient": true`, car shape via `<use>` and `currentColor`   |
| `examples/sepia/sepia.*`                                 | organic figure: many transformations on one variable, mood levels               |
| `examples/solar-system/solar-system.*`                   | 60 transformations from a generator (`generate.mjs`), counter-rotation for text |
| `examples/chronograph/chronograph.*`                     | watch with hands, sub-dials and date; shading and facets in pure SVG            |

Before a new graphic, read the best matching example and adopt its structure.
