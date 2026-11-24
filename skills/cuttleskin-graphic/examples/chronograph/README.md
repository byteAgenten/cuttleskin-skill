# Chronograph

Armbanduhr mit poliertem Stahlgehäuse in Tonneau-Form, orangefarbenem Sonnenschliff-Zifferblatt, silberner Mitte mit feinen Rillen (etwas dunkler als das Gehäuse), drei Hilfszifferblättern und Datumsfenster. Auf dem Zifferblatt steht das cuttleskin-Logo aus Bild- und Wortmarke. Der Stil folgt einer Vorlage aus dem Uhrenbereich; Markenname, Logo und Schriftzüge des Originals sind nicht übernommen.

| Datei                     | Inhalt                                        |
| ------------------------- | --------------------------------------------- |
| `chronograph.svg`         | Grafik; IDs mit dem Präfix `ch-`              |
| `chronograph.config.json` | Variablen und Transformationen                |

Beide Dateien sind mit einem Generator-Skript erzeugt, das hier nicht enthalten ist; das SVG ist deshalb sehr regelmäßig aufgebaut und eignet sich vor allem als Anschauung für Schattierung, Facetten und Zeiger.

## Variablen

| Variable | Typ      | Bereich  | Standard | Wirkung                                                                    |
| -------- | -------- | -------- | -------- | -------------------------------------------------------------------------- |
| `hour`   | `number` | 0 bis 24 | 10       | Stundenzeiger (zwei Umdrehungen am Tag), 24-Stunden-Anzeige oben           |
| `minute` | `number` | 0 bis 60 | 9        | Minutenzeiger, Minutenzähler unten; schiebt den Stundenzeiger mit          |
| `second` | `number` | 0 bis 60 | 36       | gelber Sekundenzeiger, kleine Sekunde links; schiebt den Minutenzeiger mit |
| `day`    | `number` | 1 bis 31 | 24       | Zahl im Datumsfenster                                                      |

## Aufbau

- Alle Zeiger sind in 12-Uhr-Stellung gezeichnet und drehen um ihren Mittelpunkt (`origin`). Im SVG ohne Laufzeit stehen sie deshalb alle auf 12; mit den Standardwerten zeigt die Uhr 10:09:36 am 24.
- **Gleitende Zeiger ohne kombinierten Sensor:** Transformationen auf demselben Element addieren sich.
  - Der Stundenzeiger dreht durch `hour` (0 bis 720°) und zusätzlich durch `minute` (0 bis 30°); 10:30 steht also zwischen 10 und 11.
  - Der Minutenzeiger dreht durch `minute` (0 bis 360°) und zusätzlich durch `second` (0 bis 6°).
  - Die 24-Stunden-Anzeige bekommt ebenso einen Anteil aus `minute`.
- Hilfszifferblätter: oben 24 Stunden (`ch-sub-hours`), links Sekunden (`ch-sub-seconds`), unten Minuten (`ch-sub-minutes`).
- Die Gehäusekontur ist am Referenzbild vermessen (Faktor 0,75, Zifferblattmitte auf 500/500) und als glatte Kurve durch die Messpunkte gelegt; zur Kontrolle wurde sie über das Bild gelegt. Die Flanken sind voller als ein Kreis, die Anstöße laufen auf die Breite des Armbands zu. Krone und Drücker sitzen an den gemessenen Positionen.
- Die Zeiger sind an einem vergrößerten Ausschnitt des Referenzbilds vermessen: Stundenzeiger 247 lang und 24 breit, Minutenzeiger 327 und 19,5. Jeder hat einen schmalen polierten Hals mit langer, weicher Schulter, einen facettierten Stahlrahmen (beleuchtete und beschattete Hälfte), zwei Leuchtmasse-Einsätze mit Steg dazwischen und eine Lanzenspitze. Der gelbe Sekundenzeiger ist eine flache Platte: zur Spitze hin ein schlanker Streifen (6 an der Nabe, 3,2 bei 80 % der Länge), der erst kurz vor dem Ende spitz zuläuft (Länge 354), das Gegenende wird nach außen breiter (10) und endet gerade bei 99. Er liegt über der silbernen Nabenkappe, ein kleiner Stift hält ihn.
- Die Stundenindizes sind außen polierte Silberstäbe, innen schwarz. Jeder Stab hat zwei Facetten mit Grat in der Mitte; ihre Helligkeit berechnet der Generator aus dem Winkel zu einem festen Licht von links oben (`LIGHT`), daher glänzt jeder Index anders. Dazu kommen ein Spiegelstreifen entlang der Facette, ein Glanzlicht auf hell beleuchteten Facetten und eine Fase am äußeren Ende, die ebenfalls vom Licht abhängt.
- Facetten am Gehäuse: weiche Lichtstreifen auf den Anstößen, eine dunklere Kehle vor der Lünette, ein schmaler, hochglänzender Ring um das Zifferblatt und ein schräger Rehaut in Zifferblattfarbe mit feinen Strichen.
- Das cuttleskin-Logo (Bild- und Wortmarke) ist auf das Datumsfenster ausgerichtet und 150 breit zwischen Nabe und Fenster gesetzt.
- Das Datumsfenster ist rund und vertieft wie im Original (vermessen, Mitte 228,5 rechts der Zifferblattmitte): polierter Rand (Radius 28,5), dunkle Fuge, schwarze Scheibe (24,75) mit dem Schatten des Rands am oberen Rand und ein weicher Schatten der Vertiefung auf dem Zifferblatt. Das Logo richtet sich nach der Lage des Fensters (`DATE`).
- Krone und Drücker sind als polierte Zylinder schattiert (`ch-knob`, `ch-knob-neck`): dunkle Oberkante, scharfes Glanzlicht im oberen Drittel, dunkles Band unter der Mitte, schwacher Gegenreflex an der Unterkante; dazu eine Fase am Ende und ein weicher Schattenwurf.
  - Drücker: schmaler Hals aus dem Gehäuse, Stufenring, dickere Kappe mit abgerundeten Kanten und Glanzstreifen längs der Achse.
  - Krone: kurzes Rohr, Flansch, dann der Zylinder mit 15 Rillen. Die Rillen laufen um den Zylinder und liegen deshalb zur Ober- und Unterkante hin enger (Kosinus des Winkels); jede hat eine Fuge und einen Lichtgrat, oben heller als unten.
- Der Sonnenschliff besteht aus 180 schmalen Keilen, deren Helligkeit einer Kosinuskurve folgt (SVG kennt keinen konischen Verlauf). So entstehen keine sichtbaren Stufen.
- Striche, Ziffern und Rillen sind generiert; die Stundenindizes sind ein Element (`ch-index`), das per `<use>` elfmal gedreht wiederholt wird.

## Hinweise

- **Keine Übergänge:** Beim Sprung von 59 auf 0 bzw. von 23 auf 0 würde ein `transition` den Zeiger einmal rückwärts drehen lassen. Die Zeiger springen deshalb wie bei einer Quarzuhr.
- Mit Werten wie `hour: 14.5` gleitet der Stundenzeiger auch ohne `minute`; die Zeiger funktionieren mit ganzen und mit Kommazahlen.

## Beispiel für Home Assistant

Template-Sensoren mit `now().hour`, `now().minute`, `now().second` und `now().day`; für Sekunden mit Auslöser `time_pattern` (`seconds: "/1"`).

```yaml
type: custom:cuttleskin-card
graphic: <ID aus dem Portal>
variables:
  hour: sensor.uhr_stunde
  minute: sensor.uhr_minute
  second: sensor.uhr_sekunde
  day: sensor.uhr_tag
```
