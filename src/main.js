const {execAction} = require('./command')
const {app, BrowserWindow, ipcMain} = require('electron')
const {createMainWindow, closeInputKeysWindow, closeHardNestedWindow} = require('./windows')
const {killProcess} = require('./execUtils')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit()
}

ipcMain.handle('get-app-version', () => {return app.getVersion()})
ipcMain.handle('exec-action', (event, action, arg) => {
    execAction(action, arg)
})
ipcMain.handle('close-input-keys-window', closeInputKeysWindow)
ipcMain.handle('okay-input-keys-window', (event, nextAction, keys) => {
    execAction(nextAction, keys)
    closeInputKeysWindow()
})
ipcMain.handle('close-hard-nested-window', closeHardNestedWindow)
ipcMain.handle('okay-hard-nested-window', (event, configs) => {
    execAction("hard-nested-config-done", configs)
    closeHardNestedWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createMainWindow)

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