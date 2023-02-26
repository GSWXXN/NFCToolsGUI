const os = require('os')
const {execAction} = require('./command')
const {app, BrowserWindow, ipcMain, Menu, nativeTheme, shell} = require('electron')
const {createMainWindow} = require('./windows')
const {killProcess} = require('./execUtils')
const path = require("path");
const i18n = require('./i18n');

process.env['LIBNFC_SYSCONFDIR'] = app.getPath('userData')

Menu.setApplicationMenu(null)

ipcMain.handle('minimize-current-window', (event) => {
    BrowserWindow.fromWebContents(event.sender).minimize()
})
ipcMain.handle("close-current-window", (event) => {
    BrowserWindow.fromWebContents(event.sender).close()
})
ipcMain.on('rendered', (event) => {
    BrowserWindow.fromWebContents(event.sender).show()
})

ipcMain.handle('get-app-version', () => {return app.getVersion()})
ipcMain.handle('get-compiler', () => {
    return process.env["NFCTOOLSGUI_COMPILER"] ? process.env["NFCTOOLSGUI_COMPILER"] : os.userInfo().username
})
ipcMain.handle('exec-action', (event, action, arg) => {
    execAction(action, arg)
})
ipcMain.handle('open-link', (event, url) => {
    shell.openExternal(url)
})
ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system'
})
ipcMain.handle('dark-mode:light', () => {
    nativeTheme.themeSource = 'light'
})
ipcMain.handle('dark-mode:dark', () => {
    nativeTheme.themeSource = 'dark'
})

ipcMain.on('ondragstart', (event, filePath) => {
    event.sender.startDrag({
        file: filePath,
        icon: path.join(__dirname, 'renderer/assets/icon/16/drag.png')
    })
})
ipcMain.on('get-text', (event, key) => {
    event.returnValue = i18n.getText(key);
});
ipcMain.on('get-language', (event) => {
    event.returnValue = i18n.getLanguage();
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can onlybe used after this event occurs.
app.on('ready', () => {
    i18n.init();
    createMainWindow();
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    killProcess()
    app.quit();
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
})