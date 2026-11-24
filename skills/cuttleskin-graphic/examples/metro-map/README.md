# U-Bahn-Netz

Schematischer Liniennetzplan der erfundenen Stadt „Sepiastadt“ mit drei Linien und vier Zügen.
Die Züge folgen mit `motion-path` ihrer Linie. Eine Betriebsstörung auf der U2 färbt die Linie
grau, blendet ein Warnzeichen ein und ändert die Statuszeile.

| Datei                   | Inhalt                           |
| ----------------------- | -------------------------------- |
| `metro-map.svg`         | Grafik; IDs mit dem Präfix `um-` |
| `metro-map.config.json` | Variablen und Transformationen   |

## Variablen

| Variable      | Typ       | Bereich | Standard | Wirkung                                            |
| ------------- | --------- | ------- | -------- | -------------------------------------------------- |
| `u1TrainA`    | `number`  | 0 bis 6 | 1,5      | Position des ersten Zugs der U1 (Stationsindex)    |
| `u1TrainB`    | `number`  | 0 bis 6 | 4,6      | Position des zweiten Zugs der U1                   |
| `u2Train`     | `number`  | 0 bis 4 | 2,4      | Position des Zugs der U2                           |
| `u3Train`     | `number`  | 0 bis 5 | 3,3      | Position des Zugs der U3                           |
| `u2Disrupted` | `boolean` |         | `false`  | Störung auf der U2: Linie grau, Zug blass, Warnung |

### Stationsindex

Die Position eines Zugs ist der Index der Station auf seiner Linie, gezählt ab 0. Werte dazwischen
liegen zwischen zwei Stationen: `2.5` heißt auf halbem Weg zwischen der dritten und vierten
Station. Die Richtung des Zugs ergibt sich aus der Folge der Werte.

| Index | U1           | U2           | U3           |
| ----- | ------------ | ------------ | ------------ |
| 0     | Westkap      | Nordbucht    | Algenhain    |
| 1     | Muschelweg   | Leuchtturm   | Riffstraße   |
| 2     | Hafenmarkt   | Tintenplatz  | Korallenring |
| 3     | Tintenplatz  | Korallenring | Kalmarstraße |
| 4     | Kalmarstraße | Südstrand    | Perlenhöhe   |
| 5     | Sepiapark    |              | Nordwerft    |
| 6     | Ostmole      |              |              |

## Aufbau

- Jede Linie ist ein `<path>` mit `id` (`um-line-u1` usw.). Er ist sichtbar gezeichnet und zugleich
  der Pfad, dem die Züge folgen.
- Die Stationen liegen unterschiedlich weit auseinander. Jede Station ist ein `keyFrame` der
  Zug-Variable (z. B. `tintenplatz: 3`); der Frame-Wert ist die Position der Station in Prozent der
  Linienlänge (z. B. `47.129`). Zwischen zwei Stationen interpoliert die Laufzeit linear, der Zug
  fährt also gleichmäßig von Station zu Station.
- Die Prozentwerte sind aus der Geometrie berechnet: Die Linien bestehen nur aus geraden und
  diagonalen Abschnitten, deren Längen sich direkt ergeben. Wer eine Linie ändert, muss die
  Frame-Werte neu berechnen, z. B. im Browser mit `getTotalLength()` und der Länge bis zur
  Station.
- Beide Züge der U1 haben eigene Variablen mit denselben Frames und Positionen.
- Die Züge drehen sich nicht mit der Fahrtrichtung; deshalb sind sie als waagerechte Plaketten
  gezeichnet.

## Hinweise

- Kein Übergang auf den Zugpositionen: Bei Echtzeitdaten kommen die Werte ohnehin in kurzen
  Abständen. Mit einem `transition` würden die Züge zwischen zwei Updates gleiten; das geht hier,
  weil die Linien keinen Rundkurs bilden.
- Stadt, Linien und Stationsnamen sind frei erfunden und keinem realen Netz oder Verkehrsbetrieb
  nachgebildet.

## Beispiel für Home Assistant

```yaml
type: custom:cuttleskin-card
svg: /local/cuttleskin/metro-map.svg
config: /local/cuttleskin/metro-map.config.json
variables:
  u1TrainA: sensor.u1_zug_a_position
  u1TrainB: sensor.u1_zug_b_position
  u2Train: sensor.u2_zug_position
  u3Train: sensor.u3_zug_position
  u2Disrupted: binary_sensor.u2_stoerung
```
