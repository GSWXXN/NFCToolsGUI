// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge, ipcRenderer} = require('electron')


contextBridge.exposeInMainWorld('electronAPI', {
    devicePrefix: "/dev/tty.",
    onUpdateLogOutput: (callback) => ipcRenderer.on("update-log-output", callback),
    onUpdateStatus: (callback) => ipcRenderer.on("update-status", callback),
    onUpdateUSBDevices: (callback) => ipcRenderer.on("update-usb-devices", callback),
    onSettingNFCConfig: (callback) => ipcRenderer.on("setting-nfc-config", callback),
    onCreateInputKeysWindow: (nextAction) => ipcRenderer.on("input-keys-window-next-action", nextAction),
    onCreateHardNestedWindow: (config) => ipcRenderer.on("update-hard-nested-config", config),
    onCreateDictTestWindow: (config) => ipcRenderer.on("update-dict-test-config", config),

    getVersion: () => ipcRenderer.invoke("get-app-version"),
    execAction: (action, arg) => ipcRenderer.invoke("exec-action", action, arg),
    closeInputKeysWindow: () => ipcRenderer.invoke("close-input-keys-window"),
    okayInputKeysWindow: (nextAction, keys) => ipcRenderer.invoke("okay-input-keys-window", nextAction, keys),
    closeHardNestedWindow: () => ipcRenderer.invoke("close-hard-nested-window"),
    okayHardNestedWindow: (configs) => ipcRenderer.invoke("okay-hard-nested-window", configs),
    closeDictTestWindow: () => ipcRenderer.invoke("close-dict-test-window"),
    okayDictTestWindow: (configs) => ipcRenderer.invoke("okay-dict-test-window", configs),
})
