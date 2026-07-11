const { app, BrowserWindow, Menu } = require('electron');
const { ipcMain } = require('electron');
const { join, dirname } = require('path');
const { existsSync, writeFileSync, readFileSync } = require('fs');

// Mantieni un riferimento globale dell'oggetto window
let mainWindow;

function createWindow() {
  // Crea la finestra del browser
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: join(__dirname, 'preload.cjs'),
    },
    // icon: join(__dirname, '../assets/icon.png'), // Opzionale: aggiungi un'icona
    show: false, // Non mostrare finché non è pronta
  });

  // Niente barra File / Modifica / Visualizza (menu Electron predefinito)
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Carica l'app
  const isDev = !app.isPackaged;
  const distIndexPath = join(__dirname, '../dist/index.html');

  if (isDev) {
    let devFallbackLoaded = false;
    // Se Vite non è in esecuzione, localhost fallisce → finestra bianca. Prova dist/ (serve `npm run build` almeno una volta).
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _url, isMainFrame) => {
      if (!isMainFrame || devFallbackLoaded) return;
      const isConnection =
        errorCode === -102 ||
        errorCode === -106 ||
        (typeof errorDescription === 'string' && /ERR_CONNECTION|ERR_INTERNET_DISCONNECTED/i.test(errorDescription));
      if (!isConnection) return;
      devFallbackLoaded = true;
      console.error('[SATZE Electron] Impossibile raggiungere http://localhost:5173 — avvia `npm run dev` o `npm run dev:vite`. Provo dist/index.html…');
      if (existsSync(distIndexPath)) {
        mainWindow.loadFile(distIndexPath).catch(() => {});
      }
    });
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // In produzione: impedisci che i DevTools si aprano (chiudi subito se qualcosa li apre)
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
    // Blocca F12 e Ctrl+Shift+I per evitare che l'utente apra i DevTools
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        event.preventDefault();
      }
    });
    const indexPath = distIndexPath;
    if (existsSync(indexPath)) {
      mainWindow.loadFile(indexPath).catch(err => {
        const altPaths = [
          join(app.getAppPath(), 'dist/index.html'),
          join(process.resourcesPath, 'app/dist/index.html'),
          join(__dirname, '../../dist/index.html'),
        ];
        for (const altPath of altPaths) {
          if (existsSync(altPath)) {
            mainWindow.loadFile(altPath);
            break;
          }
        }
      });
    } else {
      const altPaths = [
        join(app.getAppPath(), 'dist/index.html'),
        join(process.resourcesPath, 'app/dist/index.html'),
        join(__dirname, '../../dist/index.html'),
      ];
      for (const altPath of altPaths) {
        if (existsSync(altPath)) {
          mainWindow.loadFile(altPath);
          break;
        }
      }
    }
  }

  // Gestisci errori di caricamento (solo in dev per non mostrare nulla in produzione)
  if (isDev) {
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Errore nel caricamento:', errorCode, errorDescription);
    });
  }

  // Mostra la finestra quando è pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // In produzione: assicurati che i DevTools non siano aperti (alcune versioni li aprono automaticamente)
    if (!isDev && mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Gestisci la chiusura della finestra
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Gestisci errori non catturati (solo in dev)
if (!app.isPackaged) {
  process.on('uncaughtException', (error) => {
    console.error('Errore non catturato:', error);
  });
}

// Salvataggio config crop tool (solo in dev: scrive nei sorgenti)
/**
 * URL server multiplayer da file (senza ricompilare l'exe).
 * Cerca: %APPDATA%\\SATZE\\multiplayer.json poi cartella SATZE.exe\\multiplayer.json
 */
ipcMain.handle('satze:getMultiplayerConfig', () => {
  const candidates = [
    join(app.getPath('userData'), 'multiplayer.json'),
    join(dirname(app.getPath('exe')), 'multiplayer.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const data = JSON.parse(readFileSync(p, 'utf8'));
        return { wsUrl: typeof data.wsUrl === 'string' ? data.wsUrl.trim() : '' };
      } catch {
        return { wsUrl: '' };
      }
    }
  }
  return { wsUrl: '' };
});

ipcMain.handle('save-crop-config', async (_event, payload) => {
  if (app.isPackaged) {
    return { ok: false, error: 'Salvataggio disponibile solo in modalità sviluppo' };
  }
  const root = join(__dirname, '..');
  const dsPath = join(root, 'src/data/deckSummaryCropConfig.js');
  const ipPath = join(root, 'src/data/imagePositioning.js');
  try {
    writeFileSync(dsPath, payload.deckSummaryContent, 'utf8');
    writeFileSync(ipPath, payload.imagePositioningContent, 'utf8');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Questo metodo verrà chiamato quando Electron ha finito l'inizializzazione
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Su macOS è comune ricreare una finestra quando
    // l'icona del dock viene cliccata e non ci sono altre finestre aperte
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(() => {});

// Esci quando tutte le finestre sono chiuse, tranne su macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
