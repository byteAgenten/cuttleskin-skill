# Fahrzeugstatus

Schematische Darstellung eines Autos von oben (Front oben). Zeigt, welche Türen und ob der
Kofferraum geöffnet sind, welche Sitze belegt sind und ob die Personen angeschnallt sind.

| Datei                    | Inhalt                            |
| ------------------------ | --------------------------------- |
| `car-status.svg`         | Grafik; IDs mit dem Präfix `car-` |
| `car-status.config.json` | Variablen und Transformationen    |

## Variablen

Alle Variablen sind vom Typ `boolean`.

| Variable                                                           | Wirkung                                                          |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `doorFrontLeft`, `doorFrontRight`, `doorRearLeft`, `doorRearRight` | Tür schwenkt um das vordere Scharnier nach außen und wird orange |
| `trunk`                                                            | Kofferraumdeckel wird orange                                     |
| `seat<Platz>Occupied`                                              | Person auf dem Platz wird eingeblendet                           |
| `seat<Platz>Belted`                                                | Gurt wird eingeblendet; die Person ist grün statt rot            |

Plätze: `Driver`, `Passenger`, `RearLeft`, `RearMiddle`, `RearRight`. Standardmäßig sitzt der
Fahrer angeschnallt, alle anderen Plätze sind leer und alle Türen geschlossen.

Eine Person, die nicht angeschnallt ist, erscheint rot. Das ergibt sich ohne Logik in der
Konfiguration: `Belted` färbt die Person, `Occupied` blendet sie ein; auf leeren Plätzen ist die
Farbe nicht sichtbar.

## Ins Portal importieren

Im Cuttleskin-Portal (https://cuttleskin.com) unter „Neue Grafik“ den Inhalt von `car-status.svg` und `car-status.config.json` einfügen.
