# cuttleskin graphic skill

An Agent Skill for Claude that creates, edits and validates **cuttleskin graphics**: animated,
data-driven SVGs such as gauges, dials, clocks, status displays and maps.

A cuttleskin graphic consists of two files:

- an **SVG** whose changing elements carry an `id`, and
- a **`cuttleskin.config.json`** with variables (e.g. `speed` from 0 to 200) and transformations
  that bind each variable to a property of an SVG element: rotation, position, scale, color,
  opacity, text, image or motion along a path.

Edit, preview and export the graphics in the cuttleskin editor at
[cuttleskin.com](https://cuttleskin.com), and use them on your own websites or in Home Assistant.

The skill contains the rules for drawing such SVGs, a full reference of the configuration,
proven patterns, a validator (`scripts/validate.mjs`, Node.js 18+, no dependencies) and 14
example graphics. The skill text is written in German; Claude applies it in any language.

## Install

### Claude Code

```text
/plugin marketplace add byteAgenten/cuttleskin-skill
/plugin install cuttleskin-graphic@cuttleskin
```

### Claude apps (claude.ai, desktop)

Download the folder `skills/cuttleskin-graphic` as a ZIP and upload it under
**Settings → Capabilities → Skills**.

## Example prompts

1. “Create a cuttleskin graphic of a retro speedometer from 0 to 240 km/h with a needle, a color
   band from green to red and a digital readout.”
2. “Make a cuttleskin graphic of a house from above showing which windows are open (one yes/no
   variable per window) and the indoor temperature as text.”
3. “Check this cuttleskin.config.json against my SVG and fix every error the validator reports.”

## Validate a graphic

```sh
node skills/cuttleskin-graphic/scripts/validate.mjs gauge.svg gauge.config.json
```

The validator uses the same parser as the cuttleskin portal and checks that every referenced
`id` exists. It exits with code 1 on errors.

## Privacy

The skill works locally on your files. It sends no data anywhere and collects nothing. The
cuttleskin portal has its own [privacy policy](https://cuttleskin.com/datenschutz).

## Support

Questions and issues: [GitHub issues](https://github.com/byteAgenten/cuttleskin-skill/issues) or
kontakt@byteagenten.de.

## License

[MIT](LICENSE) © byteAgenten GmbH
