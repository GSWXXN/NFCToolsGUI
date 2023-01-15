const cp = require('child_process')
const {dialog} = require('electron')
const {webContentsSend} = require("./windows")
const status = require("./status")

let task = null

function exec(msg, cmd, args, processHandler, finishHandler, followupTask) {
    if (status.currentDevice === null || (!status.isDeviceConnected && cmd !== "nfc-list")) {
        printStatus("出错", "error")
        dialog.showErrorBox("错误", "请先连接设备")
        return
    }
    if (status.isRunningTask) {
        dialog.showErrorBox("设备忙", "有任务进行中，不可执行")
        return
    }
    status.isRunningTask = true
    printLog(`\n\n### ${msg}\n`)
    task = cp.spawn(cmd, args)

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
    webContentsSend("update-log-output", msg)
}

function printStatus(msg, indicator="running") {
    webContentsSend("update-status", {"text": msg, "indicator": indicator})
}

function printExitLog(code) {
    switch (code) {
        case 0:
            printStatus("空闲", "free")
            printLog("\n### 运行完毕 ###")
            break
        case 1:
            printStatus("出错", "error")
            printLog("\n### 运行出错 ###")
            break
        case 2:
            printStatus("空闲", "free")
            printLog("\n### 停止任务 ###")
            break
    }
}

module.exports = {exec, killProcess, printExitLog, printLog, printStatus}