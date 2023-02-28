// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge, ipcRenderer} = require('electron')


contextBridge.exposeInMainWorld('electronAPI', {
    devicePrefix: "/dev/tty.",
    platform: process.platform,

    onUpdateLogOutput: (callback) => ipcRenderer.on("update-log-output", callback),
    onUpdateStatus: (callback) => ipcRenderer.on("update-status", callback),
    onUpdateUSBDevices: (callback) => ipcRenderer.on("update-usb-devices", callback),
    onUpdateDumpEditorFile: (callback) => ipcRenderer.on("update-dump-editor-file", callback),
    onUpdateDumpComparatorFile: (callback) => ipcRenderer.on("update-dump-comparator-files", callback),
    onSettingNFCConfig: (callback) => ipcRenderer.on("setting-nfc-config", callback),
    onCreateHardNestedWindow: (config) => ipcRenderer.on("update-hard-nested-config", config),
    onCreateDictTestWindow: (config) => ipcRenderer.on("update-dict-test-config", config),
    onCreateDumpHistoryWindow: (dumps) => ipcRenderer.on("update-dump-history", dumps),
    onOpenDictFile: (callback) => ipcRenderer.on("dict-file-name", callback),
    onOpenDumpFile: (callback) => ipcRenderer.on("binary-data", callback),
    onSavedDumpFile: (callback) => ipcRenderer.on("saved-binary-data", callback),

    getVersion: () => ipcRenderer.invoke("get-app-version"),
    getBuilder: () => ipcRenderer.invoke('get-builder'),
    closeCurrentWindow: () => ipcRenderer.invoke("close-current-window"),
    minimizeCurrentWindow: () => ipcRenderer.invoke("minimize-current-window"),
    openLink: (link) => ipcRenderer.invoke("open-link", link),
    execAction: (action, arg) => ipcRenderer.invoke("exec-action", action, arg),

    startDrag: (path) => {ipcRenderer.send('ondragstart', path)},
    rendered: () => ipcRenderer.send('rendered'),
    getText: (key) => ipcRenderer.sendSync('get-text', key),
    getLanguage: () => ipcRenderer.sendSync('get-language'),
})
contextBridge.exposeInMainWorld('darkMode', {
    light: () => ipcRenderer.invoke('dark-mode:light'),
    dark: () => ipcRenderer.invoke('dark-mode:dark'),
    system: () => ipcRenderer.invoke('dark-mode:system')
})