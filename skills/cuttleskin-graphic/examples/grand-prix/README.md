# Großer Preis

Rennstrecke „Sepia-Ring“ von oben mit drei Rennwagen. Die Wagen folgen mit der Transformation
`motion-path` der Ideallinie und drehen sich mit ihrer Richtung (`orient`); die Position kommt als
Rundenfortschritt in Prozent. Ein Panel im Innenfeld zeigt Runde und Flaggensignal, die
Streckenlichter auf der Mittellinie färben sich mit.

| Datei                    | Inhalt                           |
| ------------------------ | -------------------------------- |
| `grand-prix.svg`         | Grafik; IDs mit dem Präfix `gp-` |
| `grand-prix.config.json` | Variablen und Transformationen   |

## Variablen

| Variable       | Typ      | Bereich                        | Standard | Wirkung                                                    |
| -------------- | -------- | ------------------------------ | -------- | ---------------------------------------------------------- |
| `car1Progress` | `number` | 0 bis 100 %                    | 6        | Position von Wagen 1 auf der Runde (0 = Start-Ziel-Linie)  |
| `car2Progress` | `number` | 0 bis 100 %                    | 4        | Position von Wagen 2                                       |
| `car3Progress` | `number` | 0 bis 100 %                    | 2        | Position von Wagen 3                                       |
| `lap`          | `number` | 1 bis 58                       | 1        | Rundenzähler im Panel                                      |
| `flag`         | `text`   | `green`, `yellow`, `sc`, `red` | `green`  | Farbe und Text des Flaggenfelds, Farbe der Streckenlichter |

Unbekannte Werte von `flag` zeigen ein graues Feld mit „KEIN SIGNAL“.

## Aufbau

- Die Ideallinie `gp-track` liegt in `<defs>`. Sie wird mehrfach per `<use>` gezeichnet (Auslaufzone,
  Randsteine, Asphalt, Streckenlichter) und ist gleichzeitig der Pfad, dem die Wagen folgen.
- Der Pfad beginnt an der Start-Ziel-Linie und läuft gegen den Uhrzeigersinn. 0 % und 100 % sind
  derselbe Punkt.
- Die Wagenform (Draufsicht mit Rädern, Flügeln, Seitenkästen und Cockpit) liegt einmal als
  `gp-car-shape` in `<defs>`. Jeder Wagen bindet sie per `<use href="#gp-car-shape">` ein; die
  Teamfarbe kommt über das Attribut `color` (`currentColor` in der Form). Dazu kommt die
  Startnummer auf der Motorabdeckung.
- Die Wagen sind mit der Nase nach rechts gezeichnet, also in Fahrtrichtung der positiven x-Achse.
  Das setzt `"orient": true` voraus: Die Laufzeit dreht jeden Wagen um seine Mitte in die
  Richtung der Linie, auf der Startgeraden bleibt er damit unverdreht.
- Im SVG stehen die Wagen an den Positionen ihrer Standardwerte auf der Startgeraden.

## Hinweise

- **Kein Übergang:** Die Wagen springen ohne Animation auf jede neue Position. Ein `transition`
  würde beim Rundenwechsel (z. B. von 99 auf 1) den Wagen rückwärts über die ganze Runde fahren
  lassen.
- Die Prozentwerte beziehen sich auf die Länge der Linie, nicht auf die Zeit. Langsame Kurven
  erscheinen nur dann langsamer, wenn die Datenquelle den Fortschritt entsprechend liefert.
- Strecke, Name und Farben sind frei erfunden und keiner realen Rennstrecke oder Rennserie
  nachgebildet.

## Beispiel für Home Assistant

```yaml
type: custom:cuttleskin-card
svg: /local/cuttleskin/grand-prix.svg
config: /local/cuttleskin/grand-prix.config.json
variables:
  car1Progress: sensor.rennen_wagen_1_fortschritt
  car2Progress: sensor.rennen_wagen_2_fortschritt
  car3Progress: sensor.rennen_wagen_3_fortschritt
  lap: sensor.rennen_runde
  flag: sensor.rennen_flagge
```
