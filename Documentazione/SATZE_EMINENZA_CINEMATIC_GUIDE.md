# SATZE — Guida cinematiche Eminenza (scintille)

> **Companion di:** `SATZE_EMINENZA_COPY_GUIDE.md`, `eminenceAnnounceLabels.js`  
> **Codice:** `src/game/eminence/eminenceCinematics.js` · `src/components/eminence/EminenceMarkFlight.jsx`

Le **scintille** mostrano il percorso di un effetto (carta → bersaglio).  
I **badge** dicono *quando*; il **testo** dice *cosa*; la **scintilla** dice *da dove a dove*.

---

## 1. Architettura

```
Notice / evento          →  resolveNoticeCinematics()  →  playNoticeCinematics()
(fase, origine, meta)       (ricette pure, testabili)      (EminenceMarkFlight)
```

- Il **motore** non conosce le scintille.
- **Nessun ramo** `if (eminenceId === '…')` in React.
- Colore volo: **accento armata** (`--em-acc`); fase visiva sul banner usa `PHASE_COLORS`.

---

## 2. Ricette (`CINEMATIC_RECIPES`)

| Ricetta | Quando | Volo | Note |
|---|---|---|---|
| `REVEAL_OPEN` | Rivelazione senza payoff visivo | `card` → `announce` | `holdAnnounce` |
| `VERIFY_LINK` | *(non usato)* | — | Nessun volo Agente schierato → testo |
| `LINK_AGENT` | Stat / trigger / bonus sull'Agente | `card` → `field-agent` | Lato da `target` del segmento |
| `MISS_DIM` | Mancato | nessuno | Niente arco |
| `PASSIVE_AURA` | Statico senza primitive visive | nessuno | Es. riordino gate |
| `PRESENCE_PULSE` | ±Presenza | `card`/`announce` → `presence` | Contatore sulla carta |
| `MARK_SPAWN` | Nuova Preda/Frammento | `card` → `hand` | Hook, non notice |
| `SLOT_CURSE` | Modificatore di slot | `card` → `slot` | Dal `params.slot` del notice |
| `FIELD_RULE` | Sostituisci / distruggi Campo | `card` → `slot` | Primo slot se l'indice manca |
| `HP_TICK` | Cura / danno PV | `card` → `hp` | HUD `data-em-hp` |

---

## 3. Mapping fase → ricetta default

| Fase badge | Ricetta primaria |
|---|---|
| Preparazione | `MARK_SPAWN` (hook marchi, non notice) |
| Passivo | `PASSIVE_AURA` |
| Rivelazione | `REVEAL_OPEN` o `LINK_AGENT` se Agente già noto |
| Verifica | `PRESENCE_PULSE` / payoff (niente Agente → testo) |
| Risoluzione | `LINK_AGENT` / `PRESENCE_PULSE` |
| Mancato | `MISS_DIM` |

---

## 4. Ancore (`eminenceMarkCinematic.js`)

| Tipo | Uso |
|---|---|
| `card` | Carta Eminenza nel rail |
| `announce` | Banner avviso (`data-em-announce`) |
| `presence` | Contatore Presenza (`data-em-presence`) |
| `hp` | PV HUD (`data-em-hp`) |
| `prey-token` | Token Preda sulla zona |
| `hand` | Carta in mano (id agente) |
| `field-agent` | Agente sul Campo |
| `slot` | Slot tabellone (`data-field-slot`) |

Nuove ancore: aggiungere solo qui + test su `queryFlightAnchor`.

---

## 5. Contesto resolver

```js
resolveNoticeCinematics(notice, {
  accents: { player: '#…', enemy: '#…' },
  agentsDeployed: { player: true, enemy: false },
  agentIds: { player: 7, enemy: 102 },
});
```

Campi utili sul notice (già emessi o da aggiungere):

- `phase`, `origin`, `outcome`, `markCardId`, `markKind`
- `presenceDelta`, `timing`, `gate`

---

## 6. Integrazione UI (`satze.jsx`)

```js
import { resolveNoticeCinematics, playNoticeCinematics } from '…/eminenceCinematics.js';

const cues = resolveNoticeCinematics(notice, { accents, agentsDeployed });
playNoticeCinematics(cues, { playLink: preyFlight.playLink, noticeId: notice.id, setAnnounceHeldId });
```

Regola: **un volo per avviso** (v1). Catene future: eseguire cue in sequenza nel player.

---

## 7. Regole UX

1. `waitForNotice` / `holdAnnounce` — il volo non anticipa il testo.
2. `waitFor` su `field-agent` — la scintilla non parte prima della fine dell'ingresso (place-fx). Se la carta è già ferma, niente ritardo extra.
3. `prefers-reduced-motion` — skip in `EminenceMarkFlight` (già implementato).
4. Mancato — niente arco verso payoff.
5. Stesso ordine iniziativa se due lati scintillano nello stesso beat.

---

## 8. Checklist nuova Eminenza

- [ ] Segmenti mappati su primitive note
- [ ] Notice con `phase` + `origin` corretti
- [ ] Ricetta esistente sufficiente? (non inventare per-carta)
- [ ] Se nuova ancorata (es. slot): estendere `eminenceMarkCinematic.js`
- [ ] Test in `eminenceCinematics.test.js`

---

*Guida v1 — allineata al resolver in `eminenceCinematics.js`.*
