# Klima-Kombiinstrument

Futuristisches Rundinstrument für Raumklima. Außen ein Segmentbogen für die Temperatur, innen
einer für die Luftfeuchtigkeit, in der Mitte beide Werte mit Statustext. Farben, Marker, Ziffern
und der Leuchtring in der Mitte folgen den Werten.

| Datei                 | Inhalt                           |
| --------------------- | -------------------------------- |
| `climate.svg`         | Grafik; IDs mit dem Präfix `cl-` |
| `climate.config.json` | Variablen und Transformationen   |

## Variablen

| Variable      | Typ      | Bereich       | Standard | Wirkung                                                                     |
| ------------- | -------- | ------------- | -------- | --------------------------------------------------------------------------- |
| `temperature` | `number` | −20 bis 50 °C | 21       | 35 Segmente à 2 °C, Marker, Ziffern und Leuchtring blau → mint → gelb → rot |
| `humidity`    | `number` | 0 bis 100 %   | 45       | 40 Segmente à 2,5 %, Marker und Ziffern bernstein → türkis → blau → violett |

Ein Segment leuchtet ab der Mitte seines Bereichs.

### Statustexte

| Temperatur   | Text     | Luftfeuchte | Text        |
| ------------ | -------- | ----------- | ----------- |
| unter 16 °C  | KALT     | unter 35 %  | TROCKEN     |
| 16 bis 20 °C | KÜHL     | 35 bis 60 % | OPTIMAL     |
| 20 bis 24 °C | ANGENEHM | 60 bis 70 % | FEUCHT      |
| 24 bis 28 °C | WARM     | ab 70 %     | SEHR FEUCHT |
| ab 28 °C     | HEISS    |             |             |

Die Schwellen sind Richtwerte für Wohnräume und stehen als Positionen (`at`) der Frames in den
Transformationen.

## Hinweise

- Die Ziffern zeigen ganze Zahlen; die Laufzeit rundet gebundene Werte.
- Die Segmente sind per Skript erzeugt. Bei Änderungen an Anzahl oder Bereich müssen SVG-Pfade,
  die Positionen der Frames in allen Segment-Transformationen und die
  Marker-Winkel zusammen angepasst werden.
- Die Marker sind in der Stellung der Standardwerte gezeichnet; die Frames drehen relativ dazu.
