// noinspection JSIgnoredPromiseFromCall

const {BrowserWindow, dialog} = require("electron")
const path = require("path")
const status = require("./status");


let mainWindow = null
let inputKeysWindow = null
let hardNestedWindow = null

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        resizable: false,
        maximizable: false,
        titleBarStyle: 'hiddenInset',
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

const createInputKeysWindow = (nextAction) => {
    inputKeysWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width: 400,
        height: 150,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    inputKeysWindow.once("ready-to-show", () => {inputKeysWindow.show()})
    inputKeysWindow.loadFile(path.join(__dirname, 'renderer/inputkeys.html'))
    inputKeysWindow.webContents.send("input-keys-window-next-action", nextAction)
}

const createHardNestedWindow = (config) => {
    hardNestedWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width: 400,
        height: 350,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    hardNestedWindow.once("ready-to-show", () => {hardNestedWindow.show()})
    hardNestedWindow.loadFile(path.join(__dirname, 'renderer/hardNested.html'))
    hardNestedWindow.webContents.send("update-hard-nested-config", config)
}

const closeInputKeysWindow = () => {
    inputKeysWindow.close()
}

const closeHardNestedWindow = () => {
    hardNestedWindow.close()
}

const webContentsSend = (channel, args) => {
    try {
        mainWindow.webContents.send(channel, args)
    } catch (e) {

    }
}

module.exports = {createMainWindow, createInputKeysWindow, webContentsSend: webContentsSend, closeInputKeysWindow, createHardNestedWindow, closeHardNestedWindow}
