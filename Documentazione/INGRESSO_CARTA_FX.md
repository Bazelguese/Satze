# Ingresso carta in campo — nuove pose ed effetti (handoff per Cursor)

Estensione dell'ingresso agente già in produzione (`agentPlaceFx` in `Codice/satze.jsx`,
CSS `src/styles/satze-duello-ingresso-carta.css`). Nessuna riscrittura: si aggiunge un
secondo foglio di stile con le nuove pose e le varianti di effetto, e si allarga
l'enum di `agentPlaceFx`.

## 1. File da copiare

| Da (questo progetto) | A (repo Satze) |
| --- | --- |
| `templates/ingresso-carta/satze-duello-ingresso-carta-extra.css` | `src/styles/satze-duello-ingresso-carta-extra.css` |

Importalo dove già importi quello base (es. `src/index.css` o il componente del duello):

```css
@import './styles/satze-duello-ingresso-carta.css';
@import './styles/satze-duello-ingresso-carta-extra.css';
```

Il file base resta invariato: le nuove pose riusano i suoi elementi
(`.place-shadow`, `.place-flash`, `.place-ring`, `.place-echo`, `.place-edge`)
e i suoi keyframes (`place-ring`, `place-echo`, `place-edge`, `place-flash`,
`shadow-slam`, `shadow-rise`).

## 2. Pose disponibili

Classe sulla carta: `place-card play-<nome>`; fratello: `place-fx fx-<nome>`.

**Da drag & drop (dall'alto)**

| nome | descrizione |
| --- | --- |
| `slam` | originale del gioco: piomba coricata e sbatte |
| `bounce` | cala pesante e rimbalza tre volte (1,28s) |
| `whirlwind` | caduta secca inclinata, si pianta, poi vortica 1080° |
| `gate` | un varco si apre in aria e la carta ne esce srotolandosi |
| `guillotine` | cala rigida, stop secco con vibrazione residua |
| `meteor` | precipita enorme verso la camera e frena all'ultimo |

**Da click (dal basso / sul posto)**

| nome | descrizione |
| --- | --- |
| `rise` | originale del gioco: emerge dal piano |
| `flip` | risale di dorso e si gira sul posto scoprendo il fronte |
| `bloom` | sboccia dal centro dispiegandosi dal piano |
| `ascend` | salita lenta e solenne con leggero ondeggio |
| `unfold` | coricata sul piano, si alza in verticale come un'anta |
| `spiral` | risale avvitandosi su sé stessa |

## 3. Varianti di effetto (indipendenti dalla posa)

Classe aggiuntiva sul contenitore degli effetti: `place-fx fx-<posa> fxstyle-<stile>`.
Cambiano solo l'aspetto: durate e delay restano quelli della posa.

`runic` (cerchi tratteggiati e cornici squadrate) · `thunder` (doppio lampo a scatti
con due scariche verticali) · `sigil` (sigillo quadrato che si apre e uno che si
chiude) · `shock` (un anello enorme sfocato). Nessuna classe = look ufficiale.

## 4. Markup

```jsx
{/* remount a ogni schieramento, altrimenti l'animazione non riparte */}
<React.Fragment key={`place-${selectedAgent.id}-${agentPlaceFx}`}>
  <div className={`place-fx fx-${agentPlaceFx}${fxStyle ? ` fxstyle-${fxStyle}` : ''}`}>
    <div className="place-shadow" />
    <div className="place-flash" />
    <div className="place-ring" /><div className="place-ring b" />
    <div className="place-echo" /><div className="place-echo e2" /><div className="place-echo e3" />
    <div className="place-edge l" /><div className="place-edge r" />
  </div>
  <div className={`place-card play-${agentPlaceFx} relative flex items-center justify-center`}>
    {needsTwoFaces(agentPlaceFx) ? (
      <div className="place-flip-inner">
        <div className="place-flip-face"><GameCard agent={selectedAgent} /></div>
        <div className="place-flip-face back">
          <img src="/card-images/back/back1.png" alt="" className="w-full h-full object-cover rounded-[10px]" />
        </div>
      </div>
    ) : (
      <GameCard agent={selectedAgent} />
    )}
  </div>
</React.Fragment>
```

`needsTwoFaces = (fx) => fx === 'flip' || fx === 'whirlwind';`

## 5. Selezione della posa

In `satze.jsx` cambia solo la riga che oggi fa `via === 'drop' ? 'slam' : 'rise'`:

```js
const DROP_FX  = ['slam','bounce','whirlwind','gate','guillotine','meteor'];
const CLICK_FX = ['rise','flip','bloom','ascend','unfold','spiral'];

const pick = (list, wanted, fallback) => (list.includes(wanted) ? wanted : fallback);

setAgentPlaceFx(via === 'drop'
  ? pick(DROP_FX,  DUEL_PLACE_FX.drop,  'slam')
  : pick(CLICK_FX, DUEL_PLACE_FX.click, 'rise'));
```

dove `DUEL_PLACE_FX` è la tua config (es. in `src/config/duelVisualTimeline.js`):

```js
export const DUEL_PLACE_FX = { drop: 'slam', click: 'rise', style: null };
```

Il fallback è obbligatorio: un nome non in elenco lascia la carta **senza
animazione** (la classe non trova regole).

## 6. Tre trappole già risolte — non reintrodurle

1. **Lo slot deve essere `transform-style: flat`.** Se il contenitore della posa è
   `preserve-3d`, gli effetti vengono ordinati in 3D con la carta e la
   *intersecano* durante le rotazioni: si vede una banda scura che scorre da un
   lato all'altro. Solo `.place-card` e `.place-flip-inner` sono `preserve-3d`.
2. **Le facce non usano `backface-visibility`.** In alcuni motori il retro non
   veniva nascosto e il fronte appariva specchiato. Lo scambio è esplicito, via
   keyframes: `flip-face-front/back` (flip, un solo scambio a metà giro) e
   `whirlwind-face-front/back` (sei scambi lungo i 1080°). Se cambi la timeline
   della posa, ricalcola le percentuali di scambio.
3. **Niente `box-shadow` sulle facce che ruotano** e niente `filter` sul wrapper
   `place-flip-inner`: il primo viene proiettato come banda scura, il secondo
   appiattisce il 3D e fa sparire il dorso. L'ombra è a terra (`.place-shadow`).

## 7. Riferimento vivo

`templates/ingresso-carta/IngressoCarta.dc.html` in questo progetto: mano di
quattro carte, drop zone, drag & drop identico a `useDragAndDrop` (mousedown →
`getBoundingClientRect` → mouseup) e pulsanti in pagina per provare tutte le
combinazioni posa × stile.
