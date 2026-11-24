# Muster

Erprobte Bausteine aus `examples/`. Die Werte sind Beispiele und an die eigene Zeichnung anzupassen.

## Zeiger über einen Zahlenbereich

Zeiger senkrecht nach oben zeichnen (Nullstellung) und in eine Gruppe packen. Gedreht wird um die Achse.

```xml
<g id="needle">
  <polygon points="147,150 150,40 153,150" fill="#ef4444" />
</g>
<circle cx="150" cy="150" r="8" fill="#1f2937" />
```

```json
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
}
```

Die Skala (Striche, Zahlen) ist statisch und muss zu den Winkeln passen. −120° bis 120° ergibt einen Bogen von 240°.

## Farbverlauf mit Zwischenstufe

Die Zwischenstufe als weiteren Frame an ihrer Position anlegen:

```json
{
  "name": "band_color",
  "type": "stroke-color",
  "element": "speed-band",
  "variable": "speed",
  "transition": { "duration": 400, "easing": "linear" },
  "frames": [
    { "at": "$min", "value": "#22c55e" },
    { "at": 100, "value": "#eab308", "label": "medium" },
    { "at": "$max", "value": "#ef4444" }
  ]
}
```

## Wert als Text anzeigen

```xml
<text id="speed-text" x="150" y="200" text-anchor="middle" font-size="32">0</text>
<text x="150" y="222" text-anchor="middle" font-size="12">km/h</text>
```

```json
{ "name": "speed_text", "type": "text", "element": "speed-text", "variable": "speed", "bind": true }
```

## Statustext nach Bereichen

Frames an den Schwellen, z. B. bei 100 und 170. Der Text springt beim Erreichen des Frames:

```json
{
  "name": "status_text",
  "type": "text",
  "element": "status-text",
  "variable": "speed",
  "frames": [
    { "at": "$min", "value": "NORMAL" },
    { "at": 100, "value": "SCHNELL" },
    { "at": 170, "value": "ALARM" }
  ]
}
```

## Text nach Zustand (text-Variable)

Jeder bekannte Text bekommt einen Frame; `default` gilt für alle anderen Werte:

```json
{
  "name": "weather_icon",
  "type": "image-url",
  "element": "icon",
  "variable": "condition",
  "frames": [
    { "at": "sunny", "value": "sun.png" },
    { "at": "rainy", "value": "rain.png" }
  ],
  "default": "unknown.png"
}
```

## Segmentanzeige (Balken aus Einzelteilen)

Jedes Segment ist ein eigenes Element mit eigener Opacity-Transformation. Die Schwellen liegen in gleichen Abständen; jede Transformation braucht nur die Frames rund um ihr Segment.

- Segment _k_ ist bis zur Schwelle _k_ blass und ab der Schwelle _k+1_ voll.
- Damit es nicht schon ab `$min` überblendet, braucht es den blassen Wert auch an der Schwelle _k_.

```json
{
  "name": "segment_1",
  "type": "opacity",
  "element": "seg-1",
  "variable": "level",
  "transition": { "duration": 250, "easing": "linear" },
  "frames": [
    { "at": "$min", "value": 0.15 },
    { "at": 10, "value": 0.15 },
    { "at": 20, "value": 1 }
  ]
}
```

Für harte Sprünge statt Überblenden: `{ "at": 10, "value": 0.15, "easing": "step" }`.

Viele gleichartige Segmente am besten per Skript erzeugen statt von Hand. Vorlagen: `examples/speedometer/lcars.*` und `retro-led.*`.

## Füllstand (Pegel) über Skalierung

Den vollen Balken zeichnen. Skaliert wird nur in y-Richtung (x bleibt in allen Frames 1), verankert am unteren Rand:

```json
{
  "name": "level_fill",
  "type": "scale",
  "element": "tank-fill",
  "variable": "level",
  "origin": "bottom",
  "transition": { "duration": 300, "easing": "easeout" },
  "frames": [
    { "at": "$min", "value": { "x": 1, "y": 0 } },
    { "at": "$max", "value": { "x": 1, "y": 1 } }
  ]
}
```

## Ein/Aus-Zustand (boolean)

```json
{
  "name": "lamp_color",
  "type": "fill-color",
  "element": "lamp",
  "variable": "alarm",
  "transition": { "duration": 200, "easing": "linear" },
  "frames": [
    { "at": false, "value": "#475569" },
    { "at": true, "value": "#ef4444" }
  ]
}
```

Ein- und Ausblenden:

```json
{
  "name": "warning_visible",
  "type": "opacity",
  "element": "warning",
  "variable": "alarm",
  "frames": [
    { "at": false, "value": 0 },
    { "at": true, "value": 1 }
  ]
}
```

## Tür oder Klappe

Das bewegliche Teil als Gruppe; gedreht wird um das Scharnier. Die Farbe kommt auf ein Kind-Element, damit Drehung und Farbe unabhängig bleiben. Vorlage: `examples/car-status/car-status.*`.

```json
{ "name": "door_fl_angle", "type": "rotate", "element": "car-door-fl", "variable": "doorFrontLeft",
  "origin": { "x": 71, "y": 151 },
  "transition": { "duration": 450, "easing": "easeout" },
  "frames": [{ "at": false, "value": 0 }, { "at": true, "value": 60 }] },
{ "name": "door_fl_color", "type": "fill-color", "element": "car-door-fl-panel", "variable": "doorFrontLeft",
  "transition": { "duration": 200, "easing": "linear" },
  "frames": [{ "at": false, "value": "#e2e8f0" }, { "at": true, "value": "#fb923c" }] }
```

## Kombination zweier Zustände ohne Logik

Beispiel „Platz belegt“ und „angeschnallt“:

- `seatOccupied` blendet die Person ein (`opacity`).
- `seatBelted` färbt sie rot oder grün (`fill-color`) und blendet den Gurt ein.

Auf einem leeren Platz ist die Farbe unsichtbar. So entsteht „belegt, aber nicht angeschnallt = rot“, ohne dass Variablen voneinander wissen müssen.

## Objekt entlang einer Strecke bewegen

```json
{
  "name": "car_position",
  "type": "translate",
  "element": "car",
  "variable": "speed",
  "transition": { "duration": 300, "easing": "linear" },
  "frames": [
    { "at": "$min", "value": { "x": 0, "y": 0 } },
    { "at": "$max", "value": { "x": 124, "y": 0 } }
  ]
}
```

Der Versatz geht von der gezeichneten Position aus.

## Objekt entlang einer Kurve bewegen

Für gebogene Strecken einen Führungspfad mit `id` zeichnen und das Element mit `motion-path` daran entlangführen:

```xml
<path id="track" d="M40 160 Q160 20 280 160" fill="none" stroke="#cbd5e1" stroke-width="2" />
<g id="marker"><circle r="8" fill="#2563eb" /></g>
```

```json
{
  "name": "marker_position",
  "type": "motion-path",
  "element": "marker",
  "variable": "progress",
  "path": "track",
  "origin": "center",
  "transition": { "duration": 400, "easing": "easeout" },
  "frames": [
    { "at": "$min", "value": 0 },
    { "at": "$max", "value": 100 }
  ]
}
```

Die Frame-Werte sind Prozent der Pfadlänge. Mit weiteren Frames lassen sich Strecken ungleich verteilen, z. B. `{ "at": 30, "value": 50 }`: Bei 30 % der Variable ist das Element in der Mitte des Pfads.

## Effekt erst ab einem Schwellwert

Mit einem Frame bei 160: bis 160 klein und unsichtbar, dann wachsen. Vorlage: `examples/speedometer/comic.*`.

```json
{
  "name": "burst_scale",
  "type": "scale",
  "element": "burst",
  "variable": "speed",
  "origin": "center",
  "transition": { "duration": 500, "easing": "backout" },
  "frames": [
    { "at": "$min", "value": { "x": 0.4, "y": 0.4 } },
    { "at": 160, "value": { "x": 0.4, "y": 0.4 }, "label": "burst" },
    { "at": "$max", "value": { "x": 1.1, "y": 1.1 } }
  ]
}
```
