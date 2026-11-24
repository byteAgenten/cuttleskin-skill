# Referenz: cuttleskin.config.json

Maßgeblich ist das Prüfskript `scripts/validate.mjs`: Es nutzt denselben Parser wie das Cuttleskin-Portal. Bei Abweichungen zu dieser Beschreibung gilt das Ergebnis des Skripts.


## Wurzel

```ts
{
  variables: VariableConfig[];             // Pflicht (leer erlaubt)
  transformations: TransformationConfig[]; // Pflicht (leer erlaubt)
  elements?: ElementConfig[];              // optional: DOM-Ereignisse weiterreichen
  settings?: { mode?: 'embedded' | 'editor'; imageRendering?: 'quality' | 'speed' };
}
```

`settings` braucht man in der Regel nicht. `imageRendering: "speed"` zeichnet Bilder pixelig (für Pixel-Art).

## Variablen

| Feld                 | Typ                             | Pflicht      | Bedeutung                                                         |
| -------------------- | ------------------------------- | ------------ | ----------------------------------------------------------------- |
| `name`               | String                          | ja           | eindeutig; wird in Transformationen unter `variable` referenziert |
| `type`               | `number` \| `boolean` \| `text` | ja           |                                                                   |
| `minimum`, `maximum` | Zahl                            | bei `number` | Wertebereich; Werte werden darauf begrenzt; `minimum ≤ maximum`   |
| `defaultValue`       | passend zum Typ                 | nein         | Startwert; ohne Angabe gilt `minimum`, `false` bzw. `""`          |

Variablen definieren keine Frames. Jede Transformation listet ihre Frames selbst (siehe [Frame](#frame)).

Werte von außen werden umgewandelt:

- **`number`:** akzeptiert auch Strings (`"42"`) und Booleans (1/0).
- **`boolean`:** akzeptiert Zahlen (> 0 ist wahr) und `"true"`.
- **`text`:** akzeptiert Zahlen und Booleans als Text.

## Transformationen

| Feld         | Typ                                        | Pflicht           | Bedeutung                                                                                            |
| ------------ | ------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `type`       | siehe Tabelle unten                        | ja                |                                                                                                      |
| `element`    | String                                     | ja                | `id` des SVG-Elements                                                                                |
| `variable`   | String                                     | ja                | Name der steuernden Variable                                                                         |
| `frames`     | Liste von `{ at, value, easing?, label? }` | nein              | Werte an Positionen der Variable, jede Position höchstens einmal                                     |
| `default`    | Frame-Wert                                 | nein              | Wert, wo kein Frame gilt (z. B. Texte ohne Frame); ohne Angabe der gezeichnete Wert                  |
| `name`       | String                                     | nein              | Anzeigename; ohne Angabe `<type>_<element>`. Empfohlen: snake_case, sprechend                        |
| `priority`   | Zahl                                       | nein              | Standard 0; höhere Priorität wird zuerst angewendet                                                  |
| `transition` | `{ duration: ms, easing? }`                | nein              | animiert Wertänderungen zur Laufzeit; `easing` Standard `linear`                                     |
| `bind`       | `true`                                     | nein              | nur `text`/`image-url`: Variablenwert direkt verwenden statt Frames                                  |
| `origin`     | Ankername oder `{ x, y }`                  | nein              | wie CSS `transform-origin`: Drehpunkt, Skalierungszentrum bzw. Punkt auf dem Pfad; Standard `center` |
| `path`       | String                                     | bei `motion-path` | `id` des Pfads bzw. der Form, der das Element folgt                                                  |
| `orient`     | `true` \| `false`                          | nein              | nur `motion-path`: Element mit der Pfadrichtung drehen; Standard `false`                             |

### Frame

```json
"frames": [
  { "at": "$min", "value": -120 },
  { "at": 100, "value": 0, "easing": "easein", "label": "Reisetempo" },
  { "at": "$max", "value": 120 }
],
"default": 0
```

- **`at`** (Pflicht): Position auf dem Wertebereich der Variable.
  - `number`: Zahl zwischen `minimum` und `maximum`, oder `"$min"`/`"$max"`. Frames an `$min`/`$max` wandern mit, wenn sich der Wertebereich ändert; eine Zahl bleibt, wo sie ist.
  - `boolean`: `false` oder `true`.
  - `text`: der Text, bei dem der Frame gilt.
  - Zwei Frames einer Transformation dürfen nicht an derselben Position liegen, auch nicht `"$min"` und eine Zahl gleich `minimum`.
  - Die Reihenfolge in der Liste ist beliebig; zur Lesbarkeit nach Position sortieren.
- **`value`** (Pflicht): Typ hängt von der Transformation ab. `null` bedeutet: Frame existiert, aber leer; dann gilt der Rückfallwert.
- **`easing`** (optional): Easing-Name für den Abschnitt **von diesem Frame zum nächsten**.
  - Das ist die Form der Kurve über dem Wertebereich, keine Animation über die Zeit.
  - `step` hält den Wert bis zum nächsten Frame und springt dann.
- **`label`** (optional): Beschreibung, z. B. was eine Schwelle bedeutet. Die Laufzeit nutzt sie nicht; der Editor zeigt sie an.
- **`default`** an der Transformation: Wert überall dort, wo kein Frame gilt, z. B. für Texte ohne eigenen Frame. Ohne `default` bleibt der gezeichnete Wert.
- **Gemeinsame Schwellwerte**: Sollen mehrere Transformationen an derselben Stelle umschalten, bekommt jede einen Frame mit demselben `at`. Wird der Schwellwert geändert, muss er in jeder dieser Transformationen angepasst werden.
- **Frühere Formate** werden beim Einlesen umgewandelt: Frames als Objekt mit Namen (`"$min": { "value": … }`), `$default`, `transition` im Frame und `keyFrames` an der Variable. Neue Konfigurationen verwenden nur die Liste.

### Transformationstypen

| `type`         | Frame-Wert                              | Standard ohne Frame | Verhalten                                                 |
| -------------- | --------------------------------------- | ------------------- | --------------------------------------------------------- |
| `rotate`       | Zahl, Grad (positiv = im Uhrzeigersinn) | 0                   | Drehung um `origin`                                       |
| `translate`    | `{ "x": n, "y": n }`                    | `{0,0}`             | Versatz in Koordinaten des `<svg>`; nur x: y überall 0    |
| `scale`        | `{ "x": n, "y": n }`                    | `{1,1}`             | Faktor um `origin`; nur y: x überall 1                    |
| `opacity`      | Zahl 0–1                                | gezeichneter Wert   | bei 0 zusätzlich `visibility: hidden` (keine Klicks)      |
| `fill-color`   | CSS-Farbe (String)                      | gezeichneter Wert   | Farben werden interpoliert                                |
| `stroke-color` | CSS-Farbe (String)                      | gezeichneter Wert   | Farben werden interpoliert                                |
| `stroke-width` | Zahl (Benutzereinheiten)                | gezeichneter Wert   |                                                           |
| `text`         | String                                  | gezeichneter Text   | ersetzt den Textinhalt; springt, wird nicht überblendet   |
| `image-url`    | String (Dateiname oder URL)             | gezeichnetes `href` | setzt `href` eines `<image>`; springt                     |
| `motion-path`  | Zahl 0–100 (Prozent der Pfadlänge)      | 0                   | setzt den Punkt `origin` des Elements auf den Pfad `path` |

„Gezeichneter Wert“ heißt: Ohne passenden Frame und ohne `default` bleibt der Wert aus dem SVG.

### Bezugspunkt `origin`

Das Feld hieß früher `center`. Dieser Name wird nicht mehr gelesen; eine Transformation mit `center` dreht und skaliert um die Mitte (das Prüfskript meldet das als Fehler).

- **Namen:** `center`, `top-left`, `top`, `top-right`, `left`, `right`, `bottom-left`, `bottom`, `bottom-right`. Sie beziehen sich auf die Bounding Box des Elements.
- **Punkt `{ "x", "y" }`:** im **eigenen Koordinatensystem des Elements**, also vor dessen eigenem `transform`-Attribut.
  - Ohne `transform` am Element und an seinen Eltern entspricht das den Koordinaten der `viewBox`.
  - Für Zeiger und Türen immer einen expliziten Punkt nehmen (Achse bzw. Scharnier).

### Bewegung entlang eines Pfads (`motion-path`)

- `path` nennt die `id` einer Form mit Länge: `<path>`, `<line>`, `<polyline>`, `<polygon>`, `<circle>`, `<ellipse>` oder `<rect>`. Sie darf unsichtbar sein, z. B. in `<defs>` oder mit `fill="none"` und ohne `stroke`.
- Der Frame-Wert ist die Position in Prozent der Pfadlänge: 0 ist der Anfang (erster Punkt von `d`), 100 das Ende. Dazwischen wird linear über die Länge interpoliert, nicht über die Koordinaten.
- `origin` bestimmt, welcher Punkt des Elements auf dem Pfad liegt, z. B. `bottom` für ein Fahrzeug auf einer Straße.
- Die Position ist absolut: Das Element springt auf den Pfad, egal wo es gezeichnet ist. Andere Verschiebungen auf demselben Element mit höherer Priorität werden dadurch aufgehoben.
- Ohne `orient` behält das Element seine gezeichnete Ausrichtung. Mit `"orient": true` dreht es sich um `origin` in die Richtung des Pfads:
  - Das Element muss **nach rechts zeigend** gezeichnet sein (Fahrtrichtung = positive x-Achse). Auf einem Abschnitt nach unten ist es dann um 90° gedreht.
  - Eine schon gezeichnete Drehung bleibt erhalten und kommt hinzu.
  - Genau auf einer Ecke gilt die mittlere Richtung der beiden Abschnitte; an Ecken springt die Ausrichtung also, ohne Übergang.
  - Bei fallenden Werten fährt das Element rückwärts, zeigt aber weiter in Pfadrichtung. Für Gegenrichtung einen zweiten, umgekehrt gezeichneten Pfad verwenden.
- Bei geschlossenen Formen beginnt der Pfad an deren Startpunkt, beim Kreis z. B. rechts (3 Uhr) im Uhrzeigersinn.

### Easing-Namen

`step`, `linear`, `easein`, `easeout`, `easeinout`, `backin`, `backout`, `elastic`, `bounce`, `easeoutqart`

## Wie Werte berechnet werden

**`number`-Variablen:**

1. Die Frames werden nach ihrem Variablenwert sortiert.
2. Für den aktuellen Wert werden der nächstniedrigere und der nächsthöhere Frame **mit Wert** gesucht.
3. Dazwischen wird interpoliert: linear oder mit dem Easing des unteren Frames. Unter dem ersten bzw. über dem letzten Frame mit Wert bleibt der Randwert.

Folge für Schwellen:

- Ein Segment, das ab 50 voll sichtbar sein soll, aber darunter blass, braucht den blassen Wert an der Stelle, ab der es einblenden soll. Beispiel: Frames bei 40 → 0.15 und bei 50 → 1. Sonst wird über den ganzen Bereich ab `$min` überblendet.
- Für harte Sprünge `"easing": "step"` am unteren Frame setzen.
- `text` und `image-url` springen ohnehin erst beim Erreichen des nächsten Frames.

**`boolean`- und `text`-Variablen:** Es gilt genau der Frame, dessen Position passt; sonst `default`; sonst der gezeichnete Wert.

**`bind`:** Der Variablenwert als Text (Zahlen auf ganze Zahlen gerundet) wird direkt verwendet; Frames werden ignoriert.

**`transition` der Transformation** animiert zusätzlich über die Zeit, wenn sich der Wert ändert. Sie ist unabhängig von der Frame-Kurve.

## elements (optional)

```json
"elements": [{ "id": "power-button", "events": ["click"] }]
```

Leitet DOM-Ereignisse des Elements an die einbettende Anwendung weiter (`element.click`). Für reine Anzeigen nicht nötig.

## Portal-Besonderheiten

- **Prüfung beim Speichern:** Das Portal prüft die Konfiguration wie das Prüfskript. Ungültige Einträge führen dort zu einem Fehler, anders als in der Laufzeit, die sie nur weglässt.
- **Größenlimit:** SVG höchstens 1 MiB, Wurzelelement `<svg>`.
- **Bilder:** PNG, JPEG, GIF oder WebP bis 2 MB im Editor unter „Bilder“ hochladen; sie werden mit der nächsten Version gespeichert.
  - SVG (`<image href="auto.png">`) und `image-url`-Frames verweisen auf den **Dateinamen**, ohne Pfad.
  - Erlaubte Namen: Buchstaben, Ziffern, `.`, `-`, `_`; Beginn mit Buchstabe oder Ziffer.
  - Beim Export liegen die Bilder im Ordner `assets/` neben dem SVG; die Home-Assistant-Karte sucht sie dort automatisch.
  - Außerhalb des Portals setzt man die Asset-Wurzel selbst (`graphic.setAssetRoot`) oder einzelne URLs (`graphic.setAssetUrls`). Absolute `https:`- und `data:`-URLs funktionieren überall.
