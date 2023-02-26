// noinspection JSIgnoredPromiseFromCall

const {BrowserWindow, dialog} = require("electron")
const path = require("path")
const status = require("./status")
const { i18n } = require('./i18n')


let mainWindow = null
let inputKeysWindow = null
let hardNestedWindow = null
let dictTestWindow = null
let dumpEditorWindow = null
let dumpComparatorWindow = null
let dumpHistoryWindow = null
let settingsWindow = null
let aboutWindow = null

const createMainWindow = () => {

    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, './icons/icon.png'),
        width: 800,
        height: 700,
        resizable: false,
        frame: false,
        maximizable: false,
        show: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    mainWindow.on("close", (event) => {
        if (status.isRunningTask) {
            event.preventDefault()
            dialog.showMessageBox({
                title: i18n("dialog_title_prompt"),
                message: i18n("dialog_msg_are_you_sure_to_exit"),
                type: "warning",
                buttons: [i18n("dialog_button_cancel"), i18n("dialog_button_still_exit")],
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
    mainWindow.loadFile(path.join(__dirname, 'renderer/html/index.html'));
}

const createSettingsWindow = () => {
    settingsWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width: 400,
        height: process.platform === "win32" ? 470 : 510,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    settingsWindow.loadFile(path.join(__dirname, 'renderer/html/settings.html'))
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
    inputKeysWindow.loadFile(path.join(__dirname, 'renderer/html/inputkeys.html'))
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
    })
    hardNestedWindow.loadFile(path.join(__dirname, 'renderer/html/hardNested.html'))
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
    })
    dictTestWindow.loadFile(path.join(__dirname, 'renderer/html/dictTest.html'))
}

const createDumpEditorWindow = (filePath) => {
    dumpEditorWindow = new BrowserWindow({
        width: 380,
        height: 720,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    dumpEditorWindow.once("ready-to-show", () => {
        dumpEditorWindow.webContents.send("update-dump-editor-file", filePath)
    })
    dumpEditorWindow.loadFile(path.join(__dirname, 'renderer/html/dumpEditor.html'))
    return dumpEditorWindow
}

const createDumpComparatorWindow = (dumpFilesData) => {
    dumpComparatorWindow = new BrowserWindow({
        width: 380,
        height: 720,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    dumpComparatorWindow.once("ready-to-show", () => {
        dumpComparatorWindow.webContents.send("update-dump-comparator-files", dumpFilesData)
    })
    dumpComparatorWindow.loadFile(path.join(__dirname, 'renderer/html/dumpComparator.html'))
    return dumpComparatorWindow
}

const createDumpHistoryWindow = (dumpFiles) => {
    dumpHistoryWindow = new BrowserWindow({
        width: 380,
        height: 720,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    dumpHistoryWindow.once("ready-to-show", () => {
        dumpHistoryWindow.webContents.send("update-dump-history", dumpFiles)
    })
    dumpHistoryWindow.loadFile(path.join(__dirname, 'renderer/html/dumpHistory.html'))
    return dumpHistoryWindow
}

const createAboutWindow = () => {
    aboutWindow = new BrowserWindow({
        width: 600,
        height: 480,
        parent: mainWindow,
        show: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })
    aboutWindow.loadFile(path.join(__dirname, 'renderer/html/about.html'))
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

const sentToDumpEditorWindow = (channel, args) => {
    try {
        dumpEditorWindow.webContents.send(channel, args)
    } catch (e) {}
}

const sentToDumpComparatorWindow = (channel, args) => {
    try {
        dumpComparatorWindow.webContents.send(channel, args)
    } catch (e) {}
}

const sentToDumpHistoryWindow = (channel, args) => {
    try {
        dumpHistoryWindow.webContents.send(channel, args)
    } catch (e) {}
}


module.exports = {
    createMainWindow,
    createDictTestWindow,
    createInputKeysWindow,
    createDumpEditorWindow,
    createDumpComparatorWindow,
    createHardNestedWindow,
    createDumpHistoryWindow,
    createSettingsWindow,
    createAboutWindow,

    sendToMainWindow,
    sentToDictTestWindow,
    sentToDumpEditorWindow,
    sentToDumpComparatorWindow,
    sentToDumpHistoryWindow,
}
