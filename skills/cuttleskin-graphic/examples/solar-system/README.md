# Sonnensystem – Orrery

Das Sonnensystem von oben, als futuristisches Navigationsdisplay. Eine Variable steuert die Zeit
von 2000 bis 2100: Alle acht Planeten laufen mit ihrer echten Umlaufzeit und ab ihrer echten
Position am 1.1.2000 um die Sonne, der Mond umkreist die Erde, der Asteroidengürtel driftet, die
Sonnenkorona dreht sich und ein Radarstrahl tastet das System ab. Ein Datenpanel zeigt Kennzahlen
zum gewählten Himmelskörper.

| Datei                      | Inhalt                                                    |
| -------------------------- | --------------------------------------------------------- |
| `solar-system.svg`         | Grafik; IDs mit dem Präfix `ss-`                          |
| `solar-system.config.json` | Variablen und Transformationen                            |
| `generate.mjs`             | erzeugt beide Dateien (Sterne, Skalen, Frames, Bahndaten) |

Beide Dateien werden erzeugt. Änderungen gehören in `generate.mjs`, danach neu erzeugen:

```sh
node examples/solar-system/generate.mjs examples/solar-system
```

## Variablen

| Variable | Typ       | Bereich      | Standard | Wirkung                                                                             |
| -------- | --------- | ------------ | -------- | ----------------------------------------------------------------------------------- |
| `days`   | `number`  | 0 bis 36 525 | 9 819    | Tage seit 1.1.2000 (36 525 = 1.1.2100); Planeten, Mond, Gürtel, Korona, Radar, Jahr |
| `focus`  | `text`    | Name, s. u.  | `Erde`   | Zielmarkierung, hervorgehobene Bahn und Datenpanel                                  |
| `orbits` | `boolean` | –            | `true`   | Bahnen ein- oder ausblenden                                                         |

Der Standardwert 9 819 entspricht dem 19.11.2026.

`focus` erwartet genau einen dieser Namen: `Sonne`, `Merkur`, `Venus`, `Erde`, `Mars`,
`Jupiter`, `Saturn`, `Uranus`, `Neptun`. Bei anderen Werten zeigt das Panel „—“ und nichts ist
markiert.

## Wie die Bewegung entsteht

- Jeder Planet liegt in einer Gruppe, die sich um die Sonne dreht: von der mittleren Länge am
  1.1.2000 aus, mit 360° je siderischer Umlaufzeit, gegen den Uhrzeigersinn (Blick von
  ekliptikal Nord, 0° = Frühlingspunkt γ rechts).
- Die Schattierung dreht mit, daher zeigt die helle Seite immer zur Sonne.
- Beschriftung, Zielmarkierung, Jupiterbänder und Saturnringe drehen gegenläufig und bleiben
  dadurch aufrecht.
- Der Mond dreht in der Gruppe der Erde mit der synodischen Bewegung (Mondlänge minus
  Erdlänge).
- Das Jahr in der Epochenanzeige ist ein Text mit einem Frame je 1. Januar.

Das Modell nutzt nur die mittlere Bewegung auf Kreisbahnen. Die Positionen stimmen daher nur
ungefähr; bei Merkur und Mars weichen sie wegen der exzentrischen Bahnen um bis zu etwa 20°
ab (Schätzung, nicht nachgerechnet). Abstände und Größen sind nicht maßstäblich.

## Datenquellen

- Mittlere Längen zur Epoche J2000 und Bahnelemente: JPL, „Approximate Positions of the
  Planets“, https://ssd.jpl.nasa.gov/planets/approx_pos.html
- Abstände, Umlaufzeiten, Durchmesser und Temperaturen (gerundet): NASA Planetary Fact Sheet,
  https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- Mondzahlen: Stand 2025 nach NASA, https://science.nasa.gov/solar-system/moons/ — die Zahlen
  ändern sich mit neuen Entdeckungen und wurden für dieses Beispiel nicht erneut geprüft.
- Lichtlaufzeiten sind aus dem mittleren Abstand gerechnet (1 AE ≈ 8,3 Lichtminuten).
