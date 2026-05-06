# Componenti e varianti - Satze Khemet

## 1) Card Base (`Card/Base`)

Varianti:
- `league`: L2, L3, L4, L5
- `rarity`: common, rare, epic, mythic
- `state`: default, hover, selected, disabled
- `bonus`: none, overdrive, resistenza

Contenuto minimo:
- Header: nome carta, badge lega
- Stat block: POT, DAN
- Ability line: trigger + effetto
- Footer: id carta e tag armata

## 2) Card Compare (`Card/Compare`)

Uso:
- confronto rapido 1v1 in schermata match/deck.

Varianti:
- `result`: neutral, winning, losing
- `highlight`: on, off

## 3) Pulsanti (`Button`)

Tipi:
- `primary`, `secondary`, `ghost`, `danger`

Stati:
- default, hover, pressed, disabled, loading

Taglie:
- sm, md, lg

## 4) Input (`Input/Text`, `Input/Search`, `Input/Select`)

Stati:
- default, focus, error, success, disabled

Elementi:
- label, help text, counter, icona opzionale

## 5) Tag e badge (`Tag`, `Badge`)

Tag:
- trigger (intervention, conquest, overdrive, etc.)
- ruolo (control, spike, engine)

Badge:
- lega, rarita, status (nuova, bilanciata, test)

## 6) Pannello deck (`Panel/DeckSlot`)

Varianti:
- empty, filled, locked
- count: 0-3 copie

Elementi:
- thumbnail card
- costo/lega
- azioni (+, -, dettagli)

## 7) Barra stato match (`Match/StatusBar`)

Elementi:
- round corrente
- score duelli
- focus coin
- marker bonus armata

Varianti:
- early, mid, late, last-round

## 8) Modali (`Modal`)

Tipi:
- conferma azione
- dettaglio carta
- reward/risultato

Stati:
- default, warning, danger

## Convenzioni naming Figma

- `Satze/Khemet/<Categoria>/<Nome>`
- Esempio: `Satze/Khemet/Card/Base`
- Variabili: `satze/color/...`, `satze/type/...`, `satze/space/...`

## Priorita di costruzione

1. Foundations (token)
2. Card/Base + Button + Badge
3. DeckSlot + Input
4. StatusBar + Modal
5. Card/Compare e varianti avanzate
