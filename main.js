const {app, BrowserWindow, Menu, shell, Tray} = require('electron');
require('electron-reload')(__dirname);

let isQuitting = false;
let win;

function createTray() {
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Quit', click: () => app.quit()}
  ]);
  const tray = new Tray(__dirname + '/img/appicon-tray.png');

  tray.setToolTip('Messages');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (!win) {
      createWindow();
    } else if (win.isVisible()) {
      if (win.isFocused()) {
        win.hide();
      } else {
        win.focus();
      }
    } else {
      win.show();
    }
  });

  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu);
  });
}

function createWindow(cb) {
  win = new BrowserWindow({
    height: 700,
    show: false,
    title: 'Android Messages',
    webPreferences: {
      nodeIntegration: false,
      plugins: true
    },
    width: 1000
  });

  win.loadURL('https://messages.google.com/web');

  win.once('ready-to-show', () => {
    win.show();

    if (cb && typeof cb === 'function') {
      cb();
    }
  });

  win.on('close', e => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    } else {
      win = null;
    }
  });

  // win.openDevTools();
}

const isSecondInstance = app.makeSingleInstance(() => {
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }

    win.show();
    win.focus();
  }
});

if (isSecondInstance) {
  app.quit();
}

app.on('activate', () => {
  if (!win) {
    createWindow();
  } else {
    win.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('ready', () => {
  createWindow(() => {
    if (process.platform !== 'darwin') {
      createTray();
    }
  });

  const page = win.webContents;
  const debouncers = [];

  page.on('new-window', (e, url) => {
    e.preventDefault();

    if (!debouncers.includes(url)) {
      debouncers.push(url);
      shell.openExternal(url);

      setTimeout(() => {
        debouncers.splice(debouncers.indexOf(url), 1);
      }, 100);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
