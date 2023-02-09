// noinspection JSIgnoredPromiseFromCall

const {BrowserWindow, dialog, Menu} = require("electron")
const path = require("path")
const status = require("./status");


let mainWindow = null
let inputKeysWindow = null
let hardNestedWindow = null
let dictTestWindow = null

const createMainWindow = () => {
    Menu.setApplicationMenu(null)
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        resizable: false,
        maximizable: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    mainWindow.once("ready-to-show", () => {mainWindow.show()})
    mainWindow.on("close", (event) => {
        if (status.isRunningTask) {
            event.preventDefault()
            dialog.showMessageBox({
                title: "提示",
                message: "程序正在运行, 你确定要关闭吗",
                type: "warning",
                buttons: ["取消", "仍然关闭"],
                defaultId: 0,
                cancelId: 0
            }).then((response) => {
                if (response.response === 1) {
                    mainWindow.destroy()
                    mainWindow = null
                }
            })
        }
    })
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
}

const createInputKeysWindow = () => {
    inputKeysWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width: 400,
        height: process.platform === "win32" ? 160 : 200,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    inputKeysWindow.once("ready-to-show", () => {inputKeysWindow.show()})
    inputKeysWindow.loadFile(path.join(__dirname, 'renderer/inputkeys.html'))
}

const createHardNestedWindow = (config) => {
    hardNestedWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width:  500,
        height: process.platform === "win32" ? 570 : 610,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    hardNestedWindow.once("ready-to-show", () => {
        hardNestedWindow.webContents.send("update-hard-nested-config", config)
        hardNestedWindow.show()
    })
    hardNestedWindow.loadFile(path.join(__dirname, 'renderer/hardNested.html'))
}

const createDictTestWindow = (config) => {
    dictTestWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width: 450,
        height: process.platform === "win32" ? 350 : 390,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    dictTestWindow.once("ready-to-show", () => {
        dictTestWindow.webContents.send("update-dict-test-config", config)
        dictTestWindow.show()
    })
    dictTestWindow.loadFile(path.join(__dirname, 'renderer/dictTest.html'))
}

const closeMainWindow = () => {
    mainWindow.close()
}
const minMainWindow = () => {
    mainWindow.minimize()
}

const closeInputKeysWindow = () => {
    inputKeysWindow.close()
}

const closeHardNestedWindow = () => {
    hardNestedWindow.close()
}

const closeDictTestWindow = () => {
    dictTestWindow.close()
}

const sendToMainWindow = (channel, args) => {
    try {
        mainWindow.webContents.send(channel, args)
    } catch (e) {}
}

const sentToDictTestWindow = (channel, args) => {
    try {
        dictTestWindow.webContents.send(channel, args)
    } catch (e) {}
}

module.exports = {
    createMainWindow,
    closeMainWindow,
    minMainWindow,
    createInputKeysWindow,
    sendToMainWindow,
    sentToDictTestWindow,
    closeInputKeysWindow,
    createHardNestedWindow,
    closeHardNestedWindow,
    createDictTestWindow,
    closeDictTestWindow
}
