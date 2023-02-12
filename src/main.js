const {execAction} = require('./command')
const {app, BrowserWindow, ipcMain, Menu} = require('electron')
const {closeMainWindow, minMainWindow,createMainWindow, closeInputKeysWindow, closeHardNestedWindow, closeDictTestWindow} = require('./windows')
const {killProcess} = require('./execUtils')
const path = require("path");

Menu.setApplicationMenu(null)

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {app.quit()}

ipcMain.handle('get-app-version', () => {return app.getVersion()})
ipcMain.handle('close-app', closeMainWindow)
ipcMain.handle('minimize-window', minMainWindow)
ipcMain.handle('exec-action', (event, action, arg) => {
    execAction(action, arg)
})
ipcMain.handle('close-input-keys-window', closeInputKeysWindow)
ipcMain.handle('close-hard-nested-window', closeHardNestedWindow)
ipcMain.handle('okay-hard-nested-window', (event, configs) => {
    execAction("hard-nested-config-done", configs)
    closeHardNestedWindow()
})
ipcMain.handle('close-dict-test-window', closeDictTestWindow)
ipcMain.handle('okay-dict-test-window', (event, configs) => {
    execAction("dict-test-config-done", configs)
    closeDictTestWindow()
})
ipcMain.on('ondragstart', (event, filePath) => {
    event.sender.startDrag({
        file: filePath,
        icon: path.join(__dirname, 'renderer/assets/icon/16/drag.png')
    })
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can onlybe used after this event occurs.
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