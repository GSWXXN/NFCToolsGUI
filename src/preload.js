// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge, ipcRenderer} = require('electron')


contextBridge.exposeInMainWorld('electronAPI', {
    devicePrefix: "/dev/tty.",
    platform: process.platform,

    onUpdateLogOutput: (callback) => ipcRenderer.on("update-log-output", callback),
    onUpdateStatus: (callback) => ipcRenderer.on("update-status", callback),
    onUpdateUSBDevices: (callback) => ipcRenderer.on("update-usb-devices", callback),
    onSettingNFCConfig: (callback) => ipcRenderer.on("setting-nfc-config", callback),
    onCreateHardNestedWindow: (config) => ipcRenderer.on("update-hard-nested-config", config),
    onCreateDictTestWindow: (config) => ipcRenderer.on("update-dict-test-config", config),
    onOpenDictFile: (callback) => ipcRenderer.on("dict-file-name", callback),
    onOpenDumpFile: (callback) => ipcRenderer.on("binary-data", callback),
    onSavedDumpFile: (callback) => ipcRenderer.on("saved-binary-data", callback),

    getVersion: () => ipcRenderer.invoke("get-app-version"),
    closeApp: () => ipcRenderer.invoke("close-app"),
    minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
    execAction: (action, arg) => ipcRenderer.invoke("exec-action", action, arg),
    closeInputKeysWindow: () => ipcRenderer.invoke("close-input-keys-window"),
    closeHardNestedWindow: () => ipcRenderer.invoke("close-hard-nested-window"),
    okayHardNestedWindow: (configs) => ipcRenderer.invoke("okay-hard-nested-window", configs),
    closeDictTestWindow: () => ipcRenderer.invoke("close-dict-test-window"),
    okayDictTestWindow: (configs) => ipcRenderer.invoke("okay-dict-test-window", configs),

    startDrag: (path) => {ipcRenderer.send('ondragstart', path)}
})
