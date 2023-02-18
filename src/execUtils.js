const cp = require('child_process')
const { dialog } = require('electron')
const { sendToMainWindow } = require("./windows")
const status = require("./status")
const { i18n } = require('./i18n')

let task = null

function exec(msg, cmd, args, processHandler, finishHandler, followupTask) {
    if (status.currentDevice === null || (!status.isDeviceConnected && cmd !== "nfc-list")) {
        printStatus(i18n("indicator_error"), "error")
        dialog.showErrorBox(i18n("dialog_title_error"), i18n("dialog_msg_not_connected_device"))
        return
    }
    if (status.isRunningTask) {
        dialog.showErrorBox(i18n("dialog_title_device_busy"), i18n("dialog_msg_running_task"))
        return
    }
    status.isRunningTask = true
    printLog(`\n\n### ${msg}\n`)
    task = cp.spawn(`./framework/bin/${cmd}`, args)

    task.stdout.on('data', (data) => {
        printLog(data.toString());
        if (processHandler) processHandler(data.toString())
    });

    task.stderr.on('data', (data) => {
        printLog(`\n${data.toString()}`)
        if (processHandler) processHandler(data.toString())
    });

    task.on('close', (code, signal) => {
        if (finishHandler) finishHandler(code, signal)

        status.isRunningTask = false
        if (code !== 0) if (signal) printExitLog(2); else printExitLog(1)
        else if (!followupTask) printExitLog(0)
        else followupTask()
    })
}

function killProcess() {
    try { task.kill() } catch (e) {}
    status.isRunningTask = false
}

function printLog(msg) {
    sendToMainWindow("update-log-output", msg)
}

function printStatus(msg, indicator="running") {
    sendToMainWindow("update-status", {"text": msg, "indicator": indicator})
}

function printExitLog(code) {
    switch (code) {
        case 0:
            printStatus(i18n("indicator_free"), "free")
            printLog(`\n${i18n("log_msg_finished")}`)
            break
        case 1:
            printStatus(i18n("indicator_error"), "error")
            printLog(`\n${i18n("log_msg_error")}`)
            break
        case 2:
            printStatus(i18n("indicator_free"), "free")
            printLog(`\n${i18n("log_msg_finished")}`)
            break
    }
}

module.exports = {exec, killProcess, printExitLog, printLog, printStatus}