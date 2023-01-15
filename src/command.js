const {exec, killProcess, printExitLog, printLog, printStatus} = require("./execUtils")
const fs = require('fs')
const {dialog} = require('electron')
const {createInputKeysWindow, createHardNestedWindow, webContentsSend} = require("./windows")
const cp = require("child_process");
const status = require("./status")

const knownKeysFile = "keys.txt"
const tempMFDFilePath = "temp.mfd"
const dumpFilesPath = "./dumpfiles"
const noncesFilesPath = "./nonces.bin"
const nfcConfigFilePath = "/usr/local/etc/nfc/libnfc.conf"

let newKeys = []
let knownKeyInfo = []
let unknownKeyInfo = []
let totalUnknownKeys = 0

const defaultKeys = [
    "ffffffffffff",
    "a0a1a2a3a4a5",
    "d3f7d3f7d3f7",
    "000000000000",
    "b0b1b2b3b4b5",
    "4d3a99c351dd",
    "1a982c7e459a",
    "aabbccddeeff",
    "714c5c886e97",
    "587ee5f9350f",
    "a0478cc39091",
    "533cb6c723f6",
    "8fd0a4f256e9"
]

const actions = {
    // 扫描设备
    "scan-usb-devices": () => {
        cp.exec("ls /dev/tty.*", (err, stdout) => {
            if (err) throw err
            const devices = stdout.split(/\s+/g)
            devices.forEach((value, index) => {
                if (value.length === 0) devices.splice(index, 1)
            })
            webContentsSend("update-usb-devices", devices)
        })
    },

    // 连接设备
    "conn-usb-devices": (device) => {
        if (device === " ") {status.currentDevice = null; return}
        printStatus("正在连接设备")
        status.currentDevice = device
        setNFCConfig()
    },

    // 速度设置
    // "set-speed": (speed) => {
    //     if (status.currentDevice === null) {dialog.showErrorBox("错误", "请先选择设备"); return}
    //     status.currentSpeed = speed
    //     setNFCConfig()
    // },

    // 一键解卡
    "read-IC": () => {
        printStatus("正在解卡")
        mfoc([`-O${tempMFDFilePath}`, `-f${knownKeysFile}`])
    },

    // 一键写卡
    "write-IC": () => {
        dialog.showOpenDialog({
            title: "请选择要写入的 MFD 文件",
            defaultPath: dumpFilesPath,
            buttonLabel: "打开",
            filters: [{ name: 'MFD 文件', extensions: ['dump', 'mfd'] }]
        }).then(result => {
            if (result["canceled"] === true) return
            let mfdFilePath = result["filePaths"][0]

            readICThenExec(
                "开始执行写入 M1 卡片", "正在写卡",
                "nfc-mfclassic", ["w", "A", "u", mfdFilePath, tempMFDFilePath, "f"]
            )
        })
    },

    // 格式化
    "format-card": () => {
        readICThenExec(
            "开始执行格式化 M1 卡片", "正在格式化卡片",
            "nfc-mfclassic", ["f", "A", "u", tempMFDFilePath, tempMFDFilePath, "f"]
        )
    },

    // 输入已知密钥解卡
    "input-keys-read-IC": () => {createInputKeysWindow("done-input-keys-read-IC")},
    "done-input-keys-read-IC": (keys) => {
        const keyArg = []
        keys.match(/[0-9A-Fa-f]{12}/g).forEach(key => {
            keyArg.push(`-k${key}`)
        })
        printStatus("正在解卡")
        mfoc(keyArg.concat([`-O${tempMFDFilePath}`, `-f${knownKeysFile}`]))
    },

    // 检测卡片类型
    "detect-card-type": () => {
        checkKeyFileExist()
        knownKeyInfo = []
        unknownKeyInfo = []
        printStatus("正在检测卡片")
        exec(
            "开始执行检测卡片类型",
            'nfc-mfdetect', [`-O${tempMFDFilePath}`, `-f${knownKeysFile}`],
            (value) => {keyInfoStatistic(value)},
            () => {
                if (fs.statSync(tempMFDFilePath).size === 0) {
                    fs.unlink(tempMFDFilePath, (err) => {
                        if(err) throw err;
                    })
                }
            }
        )
    },

    // 锁 UFUID
    "lock-ufuid": () => {
        dialog.showMessageBox({
            type: "warning",
            buttons: ["取消", "确定"],
            title: "危险操作警告",
            defaultId: 0,
            message: "该操作将会锁死UFUID卡片！！！\n锁死后不可恢复！无法再次更改0块！请确认是否要继续操作？",
        }).then((response) => {
            if (response.response === 1) {
                printStatus("正在锁 UFUID")
                exec("开始执行UFUID卡片锁定", "nfc-mflock", ["-q"])
            }
        })
    },

    // HardNested 解密
    "hard-nested": () => {
        try {createHardNestedWindow({
            knownKey: knownKeyInfo[0][0],
            knownSector: knownKeyInfo[0][1],
            knownKeyType: knownKeyInfo[0][2],
            targetSector: unknownKeyInfo[0][0],
            targetKeyType: unknownKeyInfo[0][1]
        })}
        catch (e) {createHardNestedWindow()}},
    "hard-nested-config-done": (configs) => {
        if (configs.autoRun) {
            readICThenExec("开始自动解密 HardHested", `正在 HardNested 解密 - ${totalUnknownKeys - unknownKeyInfo.length + 1}/${totalUnknownKeys}`,
                () => {
                    if (configs.fromUser) totalUnknownKeys = unknownKeyInfo.length
                    printStatus(`正在 HardNested解密 - ${totalUnknownKeys - unknownKeyInfo.length + 1}/${totalUnknownKeys}`)

                    if (knownKeyInfo.length === 0) {
                        printLog("\n未发现已知密钥");
                        printExitLog(1);
                        return;
                    }
                    if (unknownKeyInfo.length === 0) {
                        printLog("\n已尝试解密全部未知密钥\n");
                        printExitLog(0);
                        return;
                    }
                    configs.knownKey = knownKeyInfo[0][0]
                    configs.knownSector = knownKeyInfo[0][1]
                    configs.knownKeyType = knownKeyInfo[0][2]
                    configs.targetSector = unknownKeyInfo[0][0]
                    configs.targetKeyType = unknownKeyInfo[0][1]
                    execAction("run-hard-nested", configs)
                })
        }
        else execAction("run-hard-nested", configs)
    },
    "run-hard-nested": (configs) => {
        let uid, sector, keyType
        configs.knownSector = (parseInt(configs.knownSector) + 1) * 4 - 1
        configs.targetSector = (parseInt(configs.targetSector) + 1) * 4 - 1

        exec(
            "开始执行收集 Nonces\n\n",
            "libnfc_collect", [
                configs.knownKey,
                configs.knownSector,
                configs.knownKeyType,
                configs.targetSector,
                configs.targetKeyType,
                "bin",
                noncesFilesPath
            ],
            (value) => {
                let i = value.indexOf("Found tag with uid ")
                if (i >= 0) {
                    uid = value.substring(i + 19, i + 27)
                    i = value.indexOf("collecting nonces for key")
                    if (i >= 0) {
                        keyType = value.substring(i + 26, i + 27)
                        sector = value.substring(i + 48, i + 49)
                    }
                }
            },
            () => {
                if (configs.collectOnly) {
                    const url = dialog.showSaveDialogSync({
                        title: "保存到...",
                        defaultPath: uid ? `${uid}_0${sector}${keyType}` : "nonces",
                        filters: [{ name: 'bin 文件', extensions: ['bin'] }],
                        message: "选择保存位置"
                    })
                    if (!url) {
                        printLog("未保存")
                    } else {
                        fs.rename(noncesFilesPath, url, (err) => {
                            if (err) {
                                printLog("保存失败")
                                printExitLog(1)
                                throw err
                            }
                            else {
                                printLog(  `\n\n已保存到 ${url}\n`)
                                printExitLog(0)
                            }
                        })
                    }

                }
            },
            () => {
                if (!configs.collectOnly)  {
                    exec(
                        "开始执行 HardNested 解密",
                        "hfmfhard", [],
                        (value) => {
                            let i = value.indexOf("Key found:")
                            if (i >= 0) {
                                i += 11
                                const key = value.substring(i, i + 12)
                                saveKeys([key])
                                if (unknownKeyInfo.length === 0) return
                                if (unknownKeyInfo[0][0] === sector && unknownKeyInfo[0][1] === keyType) unknownKeyInfo.shift()
                            }
                        },
                        null,
                        () => {
                            if (configs.autoRun) {
                                execAction("hard-nested-config-done", {
                                    knownKey: knownKeyInfo[0][0],
                                    knownSector: knownKeyInfo[0][1],
                                    knownKeyType: knownKeyInfo[0][2],
                                    targetSector: unknownKeyInfo[0][0],
                                    targetKeyType: unknownKeyInfo[0][1],
                                    collectOnly: false,
                                    autoRun: true
                                })
                            } else {printExitLog(0)}
                        }
                    )
                }
            }
        )
    },

    // 取消任务
    "cancel-task": () => {
        killProcess()
    },

    // 保存日志
    "save-log": (content) => {
        const url = dialog.showSaveDialogSync({
            title: "保存到...",
            defaultPath: `NFCTools_log_${getTimeList().join("_")}`,
            filters: [{ name: 'txt 文件', extensions: ['txt'] }],
            message: "选择保存位置"
        })

        if (!url) {
            printLog("未保存")
        } else {
            fs.writeFile(url, content, (err) => {
                if (err) {
                    printLog("保存失败")
                    printExitLog(1)
                    throw err
                }
                else {
                    printLog(  `\n\n已保存到 ${url}\n`)
                    printExitLog(0)
                }
            })
        }
    },
}

// 保存密钥
function saveKeys(keys) {
    const knownKeys = fs.readFileSync(knownKeysFile).toString().match(/[0-9A-Fa-f]{12}/g)
    keys = Array.from(new Set(knownKeys ? knownKeys.concat(keys) : keys))
    defaultKeys.forEach((value) => {
        let i = keys.indexOf(value)
        if (i >= 0) keys.splice(i, 1)
    })
    fs.writeFileSync(knownKeysFile, `${keys.join("\n")}`)
}

// 先读卡，然后进行后续操作
function readICThenExec(msg, statusMsg, cmd, args, processHandler, finishHandler) {
    let isCmdFunc = true
    if (arguments.length === 3) isCmdFunc = false
    checkKeyFileExist()
    newKeys = []
    knownKeyInfo = []
    unknownKeyInfo = []
    printStatus("正在检测卡片")
    exec(
        "先读卡，然后利用解卡密钥进行后续操作\n\n# 开始执行MFOC解密",
        'nfc-mfdetect', [`-O${tempMFDFilePath}`, `-f${knownKeysFile}`],
        (value) => {keyInfoStatistic(value)},
        () => {
            saveKeys(newKeys)
            if (fs.statSync(tempMFDFilePath).size === 0) {
                fs.unlinkSync(tempMFDFilePath)
            }
        },
        () => {
            printStatus(statusMsg)
            if (!isCmdFunc) {cmd(); return;}
            if (!fs.existsSync(tempMFDFilePath)) {
                printExitLog(0)
                return
            }
            exec(msg, cmd, args, processHandler, (code, signal)=>{
                if (finishHandler) finishHandler(code, signal)
                fs.unlink(tempMFDFilePath, (err) => {
                    if(err) throw err;
                })
            })
        }
    )
}

// 执行MFOC解密
function mfoc(args) {
    let cardID = null
    newKeys = []
    knownKeyInfo = []
    unknownKeyInfo = []
    checkKeyFileExist()
    exec(
        "开始执行MFOC解密",
        'mfoc', args,
        (value) => {
            keyInfoStatistic(value)

            let i = value.indexOf("UID (NFCID1):")
            if (i >= 0) {
                i += 14
                cardID = value.substring(i, i + 14).replace(/\s+/g, "")
            }
        },
        () => {
            saveKeys(newKeys)
            if (fs.statSync(tempMFDFilePath).size === 0) {
                fs.unlink(tempMFDFilePath, (err) => {
                    if(err) throw err;
                })
            } else {
                fs.mkdir("./dumpfiles", () => {
                    fs.rename(tempMFDFilePath, `${dumpFilesPath}/${cardID}_${getTimeList().join("_")}.mfd`, (err) =>{
                        if (err) throw err
                    })
                    cardID = null
                })
            }
        }
    )
}

// 统计密钥信息
function keyInfoStatistic(content) {

    //match [ Unknown Key A] or [ Found   Key B: ffffffffffff]
    const matchStatus = content.match(/ (\w{5}|\w{7})\s+Key \w(: \w{12}|)/g)
    if (!matchStatus) return

    matchStatus.forEach((matchStr, i) => {
        const sector = parseInt(`${i / 2}`)
        if (matchStr[1] === "F") {
            const key = matchStr.substring(16, 28)
            knownKeyInfo.push([key, sector, matchStr[13]])
            newKeys.join(key)
        } else if (matchStr[1] === "U") {
            unknownKeyInfo.push([sector, matchStr[13]])
        }
    })
}

// 检查密钥文件是否存在
function checkKeyFileExist() {
    if (!fs.existsSync(knownKeysFile)) fs.writeFileSync(knownKeysFile, "")
}

// 配置 libnfc.conf
function setNFCConfig() {
    webContentsSend("setting-nfc-config", "start")
    const content = `device.name = "NFC Device"\ndevice.connstring = "pn532_uart:${status.currentDevice}:${status.currentSpeed}"`
    fs.writeFile(nfcConfigFilePath, content, (err) => {
        if (err) throw err
        exec("连接设备",
            "nfc-list", [],
            (value) => {
                if (value.indexOf("NFC device: NFC Device opened") >= 0) {
                    printLog("\n*** 发现设备 ***\n")
                    status.isDeviceConnected = true
                }
                if (value.indexOf("Unable to open NFC device") >= 0) {
                    printLog("\n*** 未发现设备! ***\n")
                    status.isDeviceConnected = false
                }
            },
            () => {webContentsSend("setting-nfc-config", status.isDeviceConnected ? "success" : "failed")},
            () => {if (status.isDeviceConnected) printExitLog(0); else printExitLog(1)})
    })
}

function getTimeList() {
    const date = new Date()
    const time = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDay(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ]
    time.forEach((value, index) => {
        if (value < 10) time[index] = `0${value}`
        else time[index] = `${value}`
    })
    return time
}

function execAction(action, arg) {
    actions[action](arg)
}
module.exports = {execAction}