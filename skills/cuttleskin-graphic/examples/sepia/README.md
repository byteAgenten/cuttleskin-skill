# Sepia – Stimmungsbarometer

Ein Tintenfisch als Anzeige für einen beliebigen Messwert, etwa CPU-Last, Strompreis, CO₂ oder
Warteschlangenlänge. Wie eine echte Sepia zeigt das Tier seine „Stimmung“ über die Haut:
gelassen gesprenkelt, dann gestreift, bei hohen Werten die Drohgebärde mit Augenflecken und
gespreizten Armen, ganz oben stößt es Tinte aus. Tageslicht und Jagd sind weitere Eingänge.

| Datei               | Inhalt                           |
| ------------------- | -------------------------------- |
| `sepia.svg`         | Grafik; IDs mit dem Präfix `sp-` |
| `sepia.config.json` | Variablen und Transformationen   |

## Variablen

| Variable   | Typ       | Bereich   | Standard   | Wirkung                                                                                   |
| ---------- | --------- | --------- | ---------- | ----------------------------------------------------------------------------------------- |
| `stress`   | `number`  | 0 bis 100 | 15         | Hautfarbe, Muster, Arme, Flossensaum, Tinte, Atembläschen, Balken, Zahl und Stimmungstext |
| `daylight` | `number`  | 0 bis 100 | 70         | Wasserfarbe und Lichtstrahlen; im Dunkeln leuchtet Plankton und die W-Pupille weitet sich |
| `hunting`  | `boolean` | –         | `false`    | Fangtentakel schnellen vor, eine Garnele erscheint, Hinweis „Beute in Sicht“              |
| `label`    | `text`    | –         | `CPU-LAST` | Beschriftung des Messwerts im Anzeigefeld                                                 |

### Stimmungen

| `stress` | Text         | Haut                                                          |
| -------- | ------------ | ------------------------------------------------------------- |
| 0–35     | gelassen     | türkis mit hellen Sprenkeln                                   |
| 35–60    | wachsam      | grünlich, Sprenkel verblassen, erste Streifen                 |
| 60–80    | angespannt   | bernstein mit dunklen Zebrastreifen                           |
| 80–92    | Drohgebärde  | rostrot, Augenflecken, Arme und Flossensaum spreizen sich     |
| ab 92    | Tintenalarm! | dunkles Weinrot, Tintenwolke breitet sich hinter dem Tier aus |

Die Schwellen stehen jeweils als Frame in mehreren Transformationen. Wer sie verschiebt, muss
sie in allen betroffenen Transformationen gleich ändern (Hautfarbe, Muster, Text, Balkenfarbe).

## Verwendung

- **Home Assistant:** `stress` an einen Sensor binden, z. B. Prozessorlast oder CO₂ (vorher auf
  0–100 umrechnen), `daylight` an die Sonnenhöhe oder einen Helligkeitssensor, `hunting` an die
  Türklingel oder einen Bewegungsmelder.
- **Eigene Beschriftung:** `label` auf den Namen des Messwerts setzen, z. B. `STROMPREIS`.

Alle Übergänge sind animiert: Farben gleiten in knapp einer Sekunde, die Tentakel schnellen mit
leichtem Überschwingen vor, die Tinte breitet sich langsam aus.
