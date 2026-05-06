# Icone utilizzate nel progetto Satze

Riepilogo di **quali icone** sono usate e **dove** nel gioco.

---

## 1. Icone armate (`type="army"`)

Usate per identificare le **8 armate** del gioco. Una è personalizzata (PNG), le altre sono SVG.

| Armata | Icona | Dove appare |
|--------|--------|-------------|
| **Figli dell'Orizzonte** | `icon_orizzonte.png` (personalizzata) | Selezione armata, selezione deck, menu principale (decorazioni), Roguelike (scelta agente, reward), scontro (badge agente) |
| **Kethran** | IconTemple (SVG) | Stessi contesti |
| **Corte Rossa** | IconFlame (SVG) | Stessi contesti |
| **Calibri Pesanti** | IconGear (SVG) | Stessi contesti |
| **Orathai** | IconMoon (SVG) | Stessi contesti |
| **Mounthborn** | IconVirus (SVG) | Stessi contesti |
| **L'Enclave delle Scaglie** | IconDragon (SVG) | Stessi contesti |
| **Ratti della Megera** | IconRat (SVG) | Stessi contesti |

**Uso nel codice:** `<Icon name="Figli dell'Orizzonte" type="army" size={48} color={colors.accent} />`

---

## 2. Icone tipi carta (`type="cardType"`)

Usate come **fallback** nelle anteprime carte quando l’immagine della carta non è disponibile (es. placeholder per tipo cosmic_hero, babel_king, ecc.).

| Chiave | Significato | Componente |
|--------|-------------|------------|
| cosmic_hero, cosmic_mage, cosmic_spirit | Figli dell'Orizzonte | CardImage (placeholder) |
| babel_king, babel_priest, babel_berserker | Kethran | CardImage (placeholder) |
| devil_prince, devil_imp, devil_demon | Corte Rossa | CardImage (placeholder) |
| mech_titan, mech_drone, mech_golem | Calibri Pesanti | CardImage (placeholder) |
| mystic_arcane, mystic_oracle, mystic_spirit | Orathai | CardImage (placeholder) |
| swarm_queen, swarm_beast, swarm_insect | Mounthborn | CardImage (placeholder) |

**Uso:** `CardImage.jsx` — quando non c’è URL immagine o c’è errore di caricamento.

---

## 3. Icone UI / carte (`type="cardIcon"`)

Icone generiche per **menu, battaglia, tutorial, Roguelike**. Nome usato nel codice = chiave in `CARD_ICONS`.

### Menu principale (satze.jsx)
| Icona | Uso |
|-------|-----|
| sword | GIOCA VS IA |
| pray | BARE HANDS |
| book | CAMPAGNA, TUTORIAL |
| dice | ROGUELIKE |
| globe | MULTIPLAYER ONLINE |
| card | GESTIONE MAZZI |
| image | GALLERIA |

### Carte (Card.jsx)
| Icona | Uso |
|-------|-----|
| sword | Etichetta POT |
| explosion | Etichetta DAN |
| lightning | Indicatore potere |
| block | Bonus/abilità bloccata |
| copy | Bonus copiato |
| check | Bonus attivo / conferma |

### Battaglia (Battlefield.jsx)
| Icona | Uso |
|-------|-----|
| sword | Titolo campo, pulsante CONFERMA, fasi duello |
| target | "Scegli un Campo" |
| field.icon | Icona del campo (da dati campi) |
| clipboard | Fase Schieramento |
| lightning | Fase Poteri Attivi |
| coin | Fase Focus Coin |
| chart | Fase Calcolo VA, riepilogo duello |
| check | Fase Risultato, PAREGGIO, CONTINUA |
| crown | VITTORIA |
| skull | SCONFITTA |

### Roguelike
| Icona | Uso |
|-------|-----|
| sword | Duello, combattimento, statistiche |
| skull | Boss finale |
| crown | Boss elite, vittoria |
| check | Nodo completato, conferme |
| scroll | Evento narrativo |
| circle | Nodo normale |
| sparkle, star | Poteri, decorazioni |
| lightning | Trigger, statistiche |
| block | "Seleziona prima..." |
| clipboard | Riepilogo |
| chart | Statistiche |
| rocket | "Inizia la Run!" |
| arm | Step "Corpo" |
| user | Avatar |

### Galleria, difficoltà, deck
| Icona | Uso |
|-------|-----|
| card | Conteggio Agenti |
| tower | Conteggio Campi |
| field.icon | Anteprima campo |
| diff.icon | Livello difficoltà IA |
| card.icon | Icona carta (da dati carte) |

---

## 4. Riepilogo file

| File | Contenuto |
|------|-----------|
| `src/data/icons.jsx` | Definizione di ARMY_ICONS, CARD_TYPE_ICONS, CARD_ICONS, tutti i componenti SVG e l’import dell’icona cometa (PNG) |
| `src/components/ui/Icon.jsx` | Componente che sceglie e renderizza l’icona in base a `name` e `type` |
| `src/assets/icons/` | File PNG/SVG personalizzati (es. `icon_orizzonte.png`) |

---

## 5. Come aggiungere una nuova icona

- **Armata:** aggiungi/aggiorna l’entry in `ARMY_ICONS` in `icons.jsx` (import PNG o componente SVG).
- **UI/Carte:** aggiungi un componente SVG in `icons.jsx` e la chiave in `CARD_ICONS` (es. `myIcon: IconMyIcon`).
- **Tipi carta (placeholder):** aggiungi la chiave in `CARD_TYPE_ICONS` (es. `cosmic_hero: IconSword`).

Per le **dimensioni** e i **prompt Midjourney** vedi `DIMENSIONI_ICONE.md` e `PROMPT_MIDJOURNEY.md` nella stessa cartella.
