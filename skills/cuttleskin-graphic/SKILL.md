---
name: cuttleskin-graphic
description: Erstellt, ändert und prüft Cuttleskin-Grafiken – eine SVG-Datei plus Konfiguration (cuttleskin.config.json) mit Variablen, die über Transformationen (Drehung, Position, Skalierung, Farbe, Deckkraft, Text, Bild) einzelne SVG-Elemente steuern. Verwenden, wenn eine neue Cuttleskin-Grafik gezeichnet, eine bestehende Grafik oder ihre Konfiguration angepasst, eine Konfiguration erklärt oder auf Fehler geprüft werden soll, oder wenn jemand eine animierte bzw. datengesteuerte SVG-Anzeige (Tachometer, Statusanzeige, Pegel, Schalter) für das Cuttleskin-Portal möchte.
---

# Cuttleskin-Grafiken erstellen

Eine Cuttleskin-Grafik besteht aus zwei Dateien:

- **SVG**: die Zeichnung. Jedes Element, das sich verändern soll, hat eine eindeutige `id`.
- **Konfiguration** (`cuttleskin.config.json`, in den Beispielen als `<name>.config.json`):
  - **Variablen**: die Eingänge der Grafik, z. B. `speed` von 0 bis 200 oder `doorOpen` ja/nein.
  - **Transformationen**: Jede bindet eine Variable an eine Eigenschaft eines SVG-Elements.
  - **Frames**: Werte einer Transformation an Stützstellen der Variable, z. B. `$min` → −120°, `$max` → 120°. Dazwischen interpoliert die Laufzeit. Jede Transformation hat ihre eigenen Frames.

Die Cuttleskin-Laufzeit liest beides, setzt die Variablenwerte von außen und wendet die Transformationen auf das SVG an. Im Cuttleskin-Portal (https://cuttleskin.com) werden Grafiken bearbeitet, getestet und exportiert.

Die Beispiele liegen unter `examples/` im Skill-Ordner, das Prüfskript unter `scripts/validate.mjs`. Pfade wie `examples/speedometer/…` beziehen sich auf diesen Ordner.

Die vollständige Referenz aller Felder steht in [reference/config-schema.md](reference/config-schema.md). Erprobte Muster stehen in [reference/patterns.md](reference/patterns.md).

## Ablauf

1. **Anforderung klären.** Welche Zustände soll die Grafik zeigen? Welche Eingänge gibt es? Für jeden Eingang festlegen:
   - Typ: `number` mit Minimum und Maximum, `boolean` oder `text`.
   - Standardwert.
   - Was sichtbar passiert.

   Bei unklaren Wertebereichen oder Einheiten nachfragen, statt zu raten.

2. **Variablen entwerfen.** Möglichst wenige, fachlich benannte Variablen in camelCase (`speed`, `seatDriverBelted`). Eine Variable darf mehrere Transformationen steuern.
3. **SVG zeichnen** nach den Regeln unten:
   - Erst die statische Zeichnung.
   - Dann alle beweglichen oder veränderlichen Teile als eigene Elemente oder Gruppen mit `id`.
4. **Konfiguration schreiben.**
   - Pro Wirkung eine Transformation.
   - Frames als Liste mit Position `at`: an `$min`/`$max` bzw. `false`/`true`, dazu weitere Stützstellen nach Bedarf.
5. **Prüfen** mit dem Skript (siehe unten). Alle Fehler beheben, Warnungen bewerten.
6. **Ansehen**, wenn möglich.
   - Im Portal (https://cuttleskin.com): „Neue Grafik“, SVG-Quelltext und Konfiguration einfügen, im Editor mit dem Playhead die Werte durchspielen.
7. **Dokumentieren.** Zu jeder Grafik eine kurze `README.md` mit Variablentabelle, nach dem Vorbild von `examples/car-status/README.md`.

## Regeln für das SVG

- Wurzelelement `<svg xmlns="http://www.w3.org/2000/svg" viewBox="…">`. `viewBox` immer setzen, sonst skaliert die Grafik nicht.
- Höchstens 1 MiB.
- Kein `<script>`, keine `on…`-Attribute.
- `<use>` nur mit Verweisen innerhalb des SVG (`href="#id"`). Externe Verweise entfernt das Portal.
- **IDs**:
  - Nur auf Elementen, die angesprochen werden.
  - Eindeutig, sprechend, in kebab-case.
  - Bei größeren Grafiken mit gemeinsamem Präfix, z. B. `car-door-fl`.
- **Farben als Präsentationsattribute** (`fill="#e2e8f0"`), nicht in `<style>`-Blöcken mit `!important`.
  - Die Laufzeit schreibt Inline-Styles; die überstimmen Attribute und normale CSS-Regeln, aber kein `!important`.
- **Gruppen gezielt einsetzen:**
  - Für Bewegung (rotate, translate, scale) die zusammengehörigen Teile in ein `<g id="…">` packen.
  - Für Farbwechsel das Element ansprechen, dessen Farbe sich ändern soll. Eine Füllfarbe auf einer Gruppe erben nur Kinder **ohne** eigenes `fill`.
  - Bewegung und Farbe bei Bedarf auf verschiedene Elemente legen, z. B. `car-door-fl` dreht, `car-door-fl-panel` wird orange.
- **Drehpunkte bewusst wählen.**
  - Ein Zeiger oder eine Tür dreht um einen festen Punkt (`origin: { "x": …, "y": … }` im Koordinatensystem des Elements, siehe Referenz).
  - Zeichnet man den Zeiger in Nullstellung, z. B. senkrecht, entsprechen die Frame-Werte direkt dem Winkel gegenüber dieser Stellung.
- **Text**:
  - Dynamischen Text in ein eigenes `<text>` oder `<tspan>` mit `id`; der Inhalt wird komplett ersetzt.
  - `text-anchor` passend setzen (z. B. `middle`), damit wechselnde Längen nicht verrutschen.
- **Ausgangszustand**: Das SVG sollte ohne Laufzeit sinnvoll aussehen, am besten im Zustand der Standardwerte.

## Konfiguration in Kürze

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

| Typ                           | Frame-Wert     | Wirkung                                                        |
| ----------------------------- | -------------- | -------------------------------------------------------------- |
| `rotate`                      | Zahl (Grad)    | Drehung um `origin`                                            |
| `translate`                   | `{ "x", "y" }` | Verschiebung (Versatz in `<svg>`-Koordinaten)                  |
| `scale`                       | `{ "x", "y" }` | Faktor um `origin`                                             |
| `opacity`                     | Zahl **0–1**   | Deckkraft; bei 0 zusätzlich unsichtbar für Klicks              |
| `fill-color` / `stroke-color` | CSS-Farbe      | Füll- bzw. Linienfarbe, wird interpoliert                      |
| `stroke-width`                | Zahl           | Linienbreite                                                   |
| `text`                        | String         | Textinhalt; mit `"bind": true` der gerundete Variablenwert     |
| `image-url`                   | String         | `href` eines `<image>`; mit `bind` direkt der Variablenwert    |
| `motion-path`                 | Zahl **0–100** | Position auf dem Pfad `path` in % seiner Länge; `orient` dreht |

Ein Frame ist `{ "at": Position, "value": Wert }`, optional mit `easing` (Kurve bis zum nächsten Frame) und `label` (Beschreibung). Positionen je Variablentyp:

| Variablentyp | Erlaubte Positionen `at`                 | Verhalten zwischen den Frames                   |
| ------------ | ---------------------------------------- | ----------------------------------------------- |
| `number`     | `"$min"`, `"$max"`, Zahl im Wertebereich | linear interpoliert (oder mit Easing pro Frame) |
| `boolean`    | `false`, `true`                          | umschalten                                      |
| `text`       | beliebiger Text                          | umschalten, wenn der Text genau passt           |

`default` an der Transformation gilt überall, wo kein Frame passt, z. B. für unbekannte Texte.

## Prüfen

Braucht nur Node.js 18 oder neuer, keine Pakete:

```sh
node <skill-ordner>/scripts/validate.mjs <name>.svg <name>.config.json
```

Das Skript prüft:

- die Konfiguration mit demselben Parser wie das Cuttleskin-Portal;
- dass jede referenzierte `id` im SVG existiert und keine doppelt vorkommt;
- Wurzelelement und Größe des SVG;
- typische Fehler, z. B. `text` auf einem Element, das kein `<text>` ist, `rotate` ohne `origin`, ungenutzte Variablen, frühere Formate (`center`, `axis`, `keyFrames`, Frames als Objekt mit Namen).

Exit-Code 1 bei Fehlern. Erst abgeben, wenn keine Fehler mehr gemeldet werden.

## Fallstricke

- **Deckkraft** wird als 0–1 angegeben, nicht in Prozent. Der Editor zeigt Prozent an, gespeichert wird 0–1.
- **Frame-Positionen** müssen zur Variable passen.
  - `"$min"`/`"$max"` nur bei `number`, `false`/`true` (ohne Anführungszeichen) nur bei `boolean`.
  - Jede Position höchstens einmal pro Transformation.
  - Frames haben keine Namen und Variablen keine `keyFrames`. Sollen mehrere Transformationen an derselben Schwelle wirken, bekommt jede einen Frame mit demselben `at`.
- **Ungültige Einträge werden still verworfen.** Die Laufzeit lässt fehlerhafte Variablen oder Transformationen weg und zeigt den Rest. Deshalb immer das Prüfskript laufen lassen.
- **Transformationen auf demselben Element addieren sich**, in der Reihenfolge der `priority` (höher zuerst). Für Drehung plus Verschiebung beides auf dasselbe Element legen oder auf verschachtelte Gruppen verteilen.
- **`translate` ist ein Versatz**, keine absolute Position. `{ "x": 0, "y": 0 }` ist die gezeichnete Lage.
- **Zahlen in `bind`-Text** werden auf ganze Zahlen gerundet. Einheiten gehören in ein separates, statisches `<text>`.
- **Kein Wenn-dann zwischen Variablen.** Kombinationen über Ebenen lösen. Beispiel: `seatBelted` färbt die Person, `seatOccupied` blendet sie ein; auf leeren Plätzen ist die Farbe unsichtbar.
- **Übergänge**: `transition` animiert Wertänderungen zur Laufzeit (Dauer in ms). Für Zeiger 300–500 ms mit `easeout`, für Farben `linear`, für harte Schalter keine.

## Beispiele

| Datei                                                    | Zeigt                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `examples/speedometer/speedometer.svg` + `.config.json`  | Zeiger (`rotate`), Farbverlauf über 3 Frames, gebundener Text                     |
| `examples/speedometer/lcars.*`, `retro-led.*`, `pixel.*` | viele Segmente, die nacheinander ein- und ausgeblendet werden                     |
| `examples/speedometer/comic.*`, `cyberpunk.*`            | Effekte ab einem Schwellwert über zusätzliche Frames                              |
| `examples/car-status/car-status.*`                       | 15 `boolean`-Variablen: Türen drehen um Scharniere, Ein-/Ausblenden, Farbwechsel  |
| `examples/climate/climate.*`                             | Kombi-Instrument: zwei Segmentbögen, Farben und Statustext für zwei Variablen     |
| `examples/weather-oracle/weather-oracle.*`               | drei Instrumente in einer Grafik, Füllstand per `scale`, Tag/Nacht über Deckkraft |
| `examples/metro-map/metro-map.*`                         | Züge folgen per `motion-path` ihrer Linie, Störung als `boolean` mit Text         |
| `examples/grand-prix/grand-prix.*`                       | `motion-path` mit `"orient": true`, Wagenform per `<use>` und `currentColor`      |
| `examples/sepia/sepia.*`                                 | organische Figur: viele Transformationen auf einer Variable, Stimmungsstufen      |
| `examples/solar-system/solar-system.*`                   | 60 Transformationen aus einem Generator (`generate.mjs`), Gegendrehung für Text   |

Vor einer neuen Grafik das am besten passende Beispiel lesen und dessen Aufbau übernehmen.
