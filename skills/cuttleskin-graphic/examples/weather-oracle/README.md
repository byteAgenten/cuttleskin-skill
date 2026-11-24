# Wetterorakel

Raumklima-Anzeige im Stil eines alten Zauberbuchs: ein Pergament mit drei Instrumenten. Das
Alchemisten-Thermometer zeigt die Temperatur, die Trankflasche die Luftfeuchtigkeit und die
Kerze die Helligkeit. Bei wenig Licht dunkelt das Pergament ab und Sterne und Mond erscheinen.

| Datei                        | Inhalt                           |
| ---------------------------- | -------------------------------- |
| `weather-oracle.svg`         | Grafik; IDs mit dem Präfix `wo-` |
| `weather-oracle.config.json` | Variablen und Transformationen   |

## Variablen

| Variable      | Typ      | Bereich       | Standard | Wirkung                                                                                      |
| ------------- | -------- | ------------- | -------- | -------------------------------------------------------------------------------------------- |
| `temperature` | `number` | −20 bis 50 °C | 21       | Flüssigkeitssäule steigt; Farbe blau → gold → rot; Zahl und Statustext                       |
| `humidity`    | `number` | 0 bis 100 %   | 45       | Trankpegel steigt; Farbe bernstein → smaragd → blau; Bläschen und Dampf ab mittlerer Feuchte |
| `brightness`  | `number` | 0 bis 1000 lx | 300      | Flamme und Lichtschein wachsen; Pergament wird heller, Sterne und Mond verblassen            |

Bei Werten außerhalb der Bereiche bleiben die Instrumente am Rand stehen; die Ziffern zeigen den
tatsächlichen Wert.

### Statustexte

| Temperatur   | Text      | Luftfeuchte | Text         | Helligkeit     | Text      |
| ------------ | --------- | ----------- | ------------ | -------------- | --------- |
| unter 0 °C   | eisig     | unter 30 %  | staubtrocken | unter 20 lx    | finster   |
| 0 bis 18 °C  | kühl      | 30 bis 40 % | trocken      | 20 bis 150 lx  | dämmrig   |
| 18 bis 24 °C | behaglich | 40 bis 60 % | ausgewogen   | 150 bis 500 lx | hell      |
| 24 bis 30 °C | warm      | 60 bis 70 % | feucht       | ab 500 lx      | strahlend |
| ab 30 °C     | heiß      | ab 70 %     | nebelfeucht  |                |           |

Die Schwellen stehen als Positionen (`at`) der Frames in den Transformationen. Die Helligkeit wirkt über mehrere Stützstellen nicht linear, weil die Wahrnehmung von Licht etwa
logarithmisch ist: Zwischen 0 und 150 lx ändert sich viel, darüber wenig.

## Hinweise

- Die Grafik ist im Zustand der Standardwerte gezeichnet. Säule, Trankpegel und Flamme werden
  relativ dazu skaliert bzw. verschoben.
- Die Ziffern zeigen ganze Zahlen; die Laufzeit rundet gebundene Werte.
- Die Schrift ist eine Systemschrift (Georgia bzw. Palatino); es werden keine Webfonts geladen.
- Der Stil ist an das Genre „Zauberei“ allgemein angelehnt und verwendet keine Figuren, Namen,
  Wappen oder Logos aus bestimmten Büchern oder Filmen.

## Beispiel für Home Assistant

```yaml
type: custom:cuttleskin-card
svg: /local/cuttleskin/weather-oracle.svg
config: /local/cuttleskin/weather-oracle.config.json
variables:
  temperature: sensor.wohnzimmer_temperatur
  humidity: sensor.wohnzimmer_luftfeuchtigkeit
  brightness: sensor.wohnzimmer_helligkeit
```
