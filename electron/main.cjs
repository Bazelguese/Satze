const { app, BrowserWindow, Menu } = require('electron');
const { ipcMain } = require('electron');
const { join, dirname } = require('path');
const { existsSync, writeFileSync, readFileSync } = require('fs');
const {
  loadDisplaySettings,
  saveDisplaySettings,
  applyDisplayToWindow,
  getDisplayState,
  listDisplays,
  initialWindowOptions,
  MIN_WIDTH,
  MIN_HEIGHT,
} = require('./displaySettings.cjs');

// Mantieni un riferimento globale dell'oggetto window
let mainWindow;

function createWindow() {
  const winOpts = initialWindowOptions(app);
  const savedDisplay = winOpts._satzeDisplay;
  delete winOpts._satzeDisplay;

  mainWindow = new BrowserWindow({
    ...winOpts,
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: join(__dirname, 'preload.cjs'),
    },
    show: false,
  });

  try {
    mainWindow.setMinimumSize(MIN_WIDTH, MIN_HEIGHT);
  } catch {
    /* ignore */
  }

  // Niente barra File / Modifica / Visualizza (menu Electron predefinito)
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // Carica l'app
  const isDev = !app.isPackaged;
  const distIndexPath = join(__dirname, '../dist/index.html');

  if (isDev) {
    let devFallbackLoaded = false;
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
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        event.preventDefault();
      }
    });
    const indexPath = distIndexPath;
    if (existsSync(indexPath)) {
      mainWindow.loadFile(indexPath).catch(() => {
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

  if (isDev) {
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error('Errore nel caricamento:', errorCode, errorDescription);
    });
  }

  mainWindow.once('ready-to-show', () => {
    // Applica display salvato prima dello show (evita flash a size default)
    try {
      applyDisplayToWindow(mainWindow, savedDisplay || loadDisplaySettings(app));
    } catch (err) {
      console.error('[SATZE Electron] apply display failed:', err);
    }
    mainWindow.show();
    if (!isDev && mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    }
    if (isDev) {
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (!app.isPackaged) {
  process.on('uncaughtException', (error) => {
    console.error('Errore non catturato:', error);
  });
}

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

ipcMain.handle('satze:display:getDisplays', () => listDisplays());

ipcMain.handle('satze:display:getState', () => getDisplayState(mainWindow));

ipcMain.handle('satze:display:getSaved', () => loadDisplaySettings(app));

ipcMain.handle('satze:display:apply', (_event, payload) => {
  const saved = saveDisplaySettings(app, payload);
  const result = applyDisplayToWindow(mainWindow, saved);
  return result;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(() => {});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
