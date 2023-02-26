const {exec, killProcess, printExitLog, printLog, printStatus} = require("./execUtils")
const fs = require('fs')
const {dialog, app, shell} = require('electron')
const cp = require("child_process");
const status = require("./status")
const { SerialPort } = require('serialport')
const path = require("path")
const { i18n } = require('./i18n')
const https = require('https');

const {
    createDumpHistoryWindow,
    createDumpComparatorWindow,
    createDumpEditorWindow,
    createInputKeysWindow,
    createHardNestedWindow,
    createDictTestWindow,
    createSettingsWindow,
    createAboutWindow,

    sendToMainWindow,
    sentToDictTestWindow,
    sentToDumpEditorWindow,
    sentToDumpComparatorWindow,
    sentToDumpHistoryWindow
} = require("./windows")

const userDataPath = app.getPath('userData')

const knownKeysFile = path.join(userDataPath, "./keys.txt")
const tempMFDFilePath = path.join(userDataPath, "./temp.mfd")
const dumpFilesPath = path.join(userDataPath, "./dumpfiles")
const noncesFilesPath = path.join(userDataPath, "./nonces.bin")
const nfcConfigFilePath = path.join(userDataPath, "./libnfc.conf")
let dictPath = app.isPackaged ?
    path.join(process.resourcesPath, "./dict.dic") :
    path.join(__dirname, "../dict.dic")
const dumpsFolder = path.join(userDataPath, "./dumpfiles")

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
    // 打开设置窗口
    "open-settings-window": createSettingsWindow,

    // 扫描设备
    "scan-usb-devices": () => {
        SerialPort.list().then(ports => {
            const devices = []
            ports.forEach(port => {
                devices.push(port["path"])
            })
            sendToMainWindow("update-usb-devices", devices)
        });
    },

    // 连接设备
    "conn-usb-devices": (device) => {
        if (device === " ") {status.currentDevice = null; return}
        printStatus(i18n("indicator_connecting_device"))
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
        printStatus(i18n("indicator_reading_ic_card"))
        mfoc([`-O${tempMFDFilePath}`, `-f${knownKeysFile}`])
    },

    // 一键写卡
    "write-IC": () => {
        dialog.showOpenDialog({
            title: i18n("dialog_title_choose_dump_need_to_write"),
            defaultPath: dumpFilesPath,
            buttonLabel: i18n("dialog_button_open"),
            filters: [{ name: i18n("file_type_dump"), extensions: ['dump', 'mfd'] }]
        }).then(result => {
            if (result["canceled"] === true) return
            let mfdFilePath = result["filePaths"][0]

            readICThenExec(
                i18n("log_msg_start_write_card"), i18n("indicator_writing_ic_card"), true,
                "nfc-mfclassic", ["w", "A", "u", mfdFilePath, tempMFDFilePath, "f"]
            )
        })
    },

    // 格式化
    "format-card": () => {
        readICThenExec(
            i18n("log_msg_start_format_card"), i18n("indicator_formatting_ic_card"), true,
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
        printStatus(i18n("indicator_reading_ic_card"))
        mfoc(keyArg.concat([`-O${tempMFDFilePath}`, `-f${knownKeysFile}`]))
    },

    // 检测卡片类型
    "detect-card-type": () => {
        checkKeyFileExist()
        knownKeyInfo = []
        unknownKeyInfo = []
        printStatus(i18n("indicator_detecting_ic_card"))
        exec(
            i18n("log_msg_start_detect_card"),
            'nfc-mfdetect', [`-N`, `-f${knownKeysFile}`],
            (value) => {keyInfoStatistic(value)},
        ).then(()=>{printExitLog(0)}).catch(() => {})
    },

    // 锁 UFUID
    "lock-ufuid": () => {
        dialog.showMessageBox({
            type: "warning",
            buttons: [i18n("dialog_button_cancel"), i18n("dialog_button_ok")],
            title: i18n("dialog_title_danger_operation"),
            message: i18n("dialog_msg_card_will_be_locked"),
        }).then((response) => {
            if (response.response === 1) {
                printStatus(i18n("indicator_locking_ufuid"))
                exec(i18n("log_msg_start_lock_ufuid"), "nfc-mflock", ["-q"]).then(()=>{printExitLog(0)}).catch(() => {})
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
            readICThenExec(i18n("lod_msg_start_auto_hard_nested"),
                `${i18n("indicator_doing_hard_nested")} - ${totalUnknownKeys - unknownKeyInfo.length + 1}/${totalUnknownKeys}`,
                false,
                () => {
                    if (configs.fromUser) totalUnknownKeys = unknownKeyInfo.length
                    printStatus(`${i18n("indicator_doing_hard_nested")} - ${totalUnknownKeys - unknownKeyInfo.length + 1}/${totalUnknownKeys}`)

                    if (knownKeyInfo.length === 0) {
                        printLog(`\n${i18n("log_msg_not_found_known_key")}`);
                        printExitLog(1);
                        return;
                    }
                    if (unknownKeyInfo.length === 0) {
                        printLog(`\n${i18n("log_msg_tried_decrypt_all_unknown_keys")}\n`);
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

        printStatus(`${i18n("indicator_collecting_nonces")}`)
        exec(
            `${i18n("log_msg_start_collect_nonces")}\n\n`,
            "libnfc-collect", [
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
                        const pattern = /\(sector (\d{1,2})\)/;
                        const match = pattern.exec(value);
                        if (match) sector = match[1]
                        keyType = value.substring(i + 26, i + 27)
                    }
                }
            },
            () => {
                if (configs.collectOnly && fs.statSync(noncesFilesPath).size !== 0) {
                    const url = dialog.showSaveDialogSync({
                        title: i18n("dialog_title_save_to"),
                        defaultPath: uid ? `${uid}_${sector}${keyType}` : "nonces",
                        filters: [{ name: i18n("file_type_bin"), extensions: ['bin'] }],
                        message: i18n("dialog_msg_choose_save_path")
                    })
                    if (!url) {
                        printLog(i18n("log_msg_not_saved"))
                    } else {
                        fs.rename(noncesFilesPath, url, (err) => {
                            if (err) {
                                printLog(i18n("log_msh_save_failed"))
                                printExitLog(1)
                                throw err
                            }
                            else {
                                printLog(  `\n\n${i18n("log_msg_already_saved_to")} ${url}\n`)
                                printExitLog(0)
                            }
                        })
                    }
                }
            }).then(() => {
                if (!configs.collectOnly)  {
                    exec(
                        i18n("lod_msg_start_hard_nested"),
                        "cropto1_bs", [noncesFilesPath],
                        (value) => {
                            let i = value.indexOf("Key found:")
                            if (i >= 0) {
                                i += 11
                                const key = value.substring(i, i + 12)
                                saveKeys([key])
                                if (unknownKeyInfo.length === 0) return
                                if (unknownKeyInfo[0][0] === sector && unknownKeyInfo[0][1] === keyType) unknownKeyInfo.shift()
                            }
                        }).then(() => {
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
                        }).catch(() => {})
                }
            }).catch(() => {})
    },

    //打开字典文件
    "open-dict-file": () => {
        const url = dialog.showOpenDialogSync({
            title: i18n("dialog_title_choose_dictionary_file"),
            defaultPath: dictPath,
            filters: [{ name: i18n("file_type_dict"), extensions: ['txt', 'dic'] }],
            message: i18n("dialog_msg_choose_dictionary_file"),
            properties: ['openFile']
        })
        if (url) {
            dictPath = url[0]
            const pathArray = dictPath.split(/[\/\\]/g)
            sentToDictTestWindow("dict-file-name", pathArray[pathArray.length - 1])
        }
    },
    // 字典测试
    "dict-test": () => {
        try {
            createDictTestWindow({
                targetSector: unknownKeyInfo[0][0],
                targetKeyType: unknownKeyInfo[0][1]
            })
        }
        catch (e) {createDictTestWindow()}
    },
    "dict-test-config-done": (configs) => {
        printStatus(i18n("indicator_testing_dictionary"))
        exec(i18n("log_msg_start_test_dictionary"),
            "nfc-mfdict", [`-s${configs.sector}`, `-t${configs.keyType}`, `-l${configs.startPosition}`, `-d${dictPath}`],
            (value) => {
                let i = value.indexOf("Found Key: ")
                if (i >= 0) {
                    i += 11
                    const key = value.substring(i, i + 12)
                    saveKeys([key])
                    if (unknownKeyInfo.length === 0) return
                    if (unknownKeyInfo[0][0] === configs.sector && unknownKeyInfo[0][1] === configs.keyType) unknownKeyInfo.shift()
                }
            }
        ).then(()=>{printExitLog(0)}).catch(() => {})
    },

    // 打开历史密钥
    "open-history-keys": () => {cp.exec(`${process.platform === "win32" ? "start" : "open"} "${knownKeysFile}"`)},

    // 转储编辑器
    "open-dump-editor": (file) => {
        createDumpEditorWindow(file ? path.join(dumpsFolder, file) : null)
    },
    "dump-editor-choose-file": (filePath) => {
        const filePaths = filePath ? filePath : dialog.showOpenDialogSync({
            title: i18n("dialog_title_choose_dump_file"),
            defaultPath: dictPath,
            properties: ['openFile'],
            filters: [{ name: 'Dump Files', extensions: ['mfd', 'dump'] }],
            message: i18n("dialog_msg_choose_dump_file"),
        })[0]
        fs.readFile(filePaths, (err, data) => {
            if (err) throw err;
            const hexDataArray = Array.from(new Uint8Array(data), function(byte) {
                return ('0' + (byte & 0xff).toString(16)).slice(-2);
            }).join('').match(/.{1,32}/g);
            const groupedHexData = [];
            for (let i = 0; i < hexDataArray.length; i += 4) {
                groupedHexData.push((hexDataArray.slice(i, i + 4)).join('\n'));
            }
            sentToDumpEditorWindow('binary-data', {url: filePaths, data: groupedHexData});
        });
    },
    "dump-editor-save": (data) => {
        const binaryArray = new Buffer.from(data.hexData, "hex")

        fs.writeFile(data.url, binaryArray, (error) => {
            if (error) {
                throw error
            } else {
                sentToDumpEditorWindow('saved-binary-data');
            }
        });
    },

    // 转储比较器
    "open-dump-comparator": (dumpFilesData) => {
        // dumpFilesData = {A: "dump1.mfd", B: "dump2.mfd"}
        if (dumpFilesData) {
            dumpFilesData.A = path.join(dumpsFolder, dumpFilesData.A);
            dumpFilesData.B = path.join(dumpsFolder, dumpFilesData.B)
        }
        createDumpComparatorWindow(dumpFilesData)
    },
    "dump-comparator-choose-file": (type) => {
        const dumpType = type.type
        const filePaths = type.path ? type.path : dialog.showOpenDialogSync({
            title: i18n("dialog_title_choose_dump_file"),
            defaultPath: dictPath,
            properties: ['openFile'],
            filters: [{ name: 'Dump Files', extensions: ['mfd', 'dump'] }],
            message: i18n("dialog_msg_choose_dump_file"),
        })[0]
        fs.readFile(filePaths, (err, data) => {
            if (err) throw err;
            const hexDataArray = Array.from(new Uint8Array(data), function(byte) {
                return ('0' + (byte & 0xff).toString(16)).slice(-2);
            }).join('').match(/.{1,32}/g);
            const groupedHexData = [];
            for (let i = 0; i < hexDataArray.length; i += 4) {
                groupedHexData.push(hexDataArray.slice(i, i + 4));
            }
            sentToDumpComparatorWindow('binary-data', {url: filePaths, data: groupedHexData, type: dumpType});
        });
    },

    // 历史记录
    "dump-history": () => {
        fs.mkdir(dumpsFolder, () => {
            const dumpFiles = fs.readdirSync(dumpsFolder).filter(file => file.endsWith('.mfd'));
            createDumpHistoryWindow(dumpFiles)
        });
    },
    // 删除历史记录
    "delete-dump": (files) => {
        // 弹出确认框
        const confirmDelete = dialog.showMessageBoxSync({
            type: 'question',
            buttons: [i18n("dialog_button_ok"), i18n("dialog_button_cancel")],
            message: i18n("dialog_msg_are_you_sure_to_delete_these_dumps"),
            detail: files.join('\n'),
        });

        if (confirmDelete === 0) { // 用户点击 Yes
            files.forEach((file) => {
                fs.unlink(path.join(dumpsFolder, file), (err) => {
                    if (err) throw err;
                    updateDumpFiles()
                });
            });
        }
    },
    // 重命名
    "rename-dump-file": (fileObj) => {
        const { oldName, newName } = fileObj;
        fs.rename(path.join(dumpsFolder, oldName), path.join(dumpsFolder, newName), (err) => {
            if (err) throw err;
            updateDumpFiles()
        });
    },

    // 取消任务
    "cancel-task": () => {
        killProcess()
    },

    // 保存日志
    "save-log": (content) => {
        const url = dialog.showSaveDialogSync({
            title: i18n("dialog_title_save_to"),
            defaultPath: `NFCTools_log_${getTimeList().join("_")}`,
            filters: [{ name: i18n("file_type_txt"), extensions: ['txt'] }],
            message: i18n("dialog_msg_choose_save_path")
        })

        if (!url) {
            printLog(i18n("log_msg_not_saved"))
        } else {
            fs.writeFile(url, content, (err) => {
                if (err) {
                    printLog(i18n("log_msh_save_failed"))
                    printExitLog(1)
                    throw err
                }
                else {
                    printLog(`\n\n${i18n("log_msg_file_already_saved_to")} ${url}\n`)
                    printExitLog(0)
                }
            })
        }
    },
    // about page
    "open-about": createAboutWindow,

    // 检查更新
    "check-update": (isShowErrorDialog=false) => {
        const repoAuthor = 'GSWXXN';
        const repoName = 'NFCToolsGUI';

        const options = {
            hostname: 'api.github.com',
            path: `/repos/${repoAuthor}/${repoName}/releases/latest`,
            headers: {'User-Agent': repoName}
        };

        https.get(options, (response) => {
            let body = '';
            response.on('data', (chunk) => {
                body += chunk;
            });
            response.on('end', () => {
                const res = JSON.parse(body)
                const versionName = res['name'] ?? ''
                const updateLogs = res['body'] ?? ''
                const updateUrl = res['html_url'] ?? ''

                if (versionName !== `v${app.getVersion()}`) {
                    dialog.showMessageBox({
                        type: 'none',
                        buttons: [i18n("dialog_button_go_to_download"), i18n("dialog_button_cancel")],
                        message: i18n("dialog_msg_new_version_found"),
                        detail: `${i18n("dialog_msg_version")}: ${versionName}\n\n${i18n("dialog_msg_update_logs")}\n${updateLogs}`,
                    }).then((response) => {
                        if (response.response === 0) shell.openExternal(updateUrl)
                    })
                }
            });
        }).on("error", (error) => {
            if (isShowErrorDialog)
                dialog.showMessageBox({
                    type: 'error',
                    buttons: [i18n("dialog_button_ok")],
                    message: i18n("dialog_msg_check_update_failed"),
                    detail: error.message,
                })
            else {
                printLog("\n\n" + i18n("log_msg_check_update_failed"))
                printLog("\n" + error.message)
            }
        });
    }
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
function readICThenExec(msg, statusMsg, isSaveDumpFile, cmd, args, processHandler, finishHandler) {
    let isCmdFunc = true
    if (arguments.length === 4) isCmdFunc = false
    checkKeyFileExist()
    newKeys = []
    knownKeyInfo = []
    unknownKeyInfo = []
    printStatus(i18n("indicator_detecting_ic_card"))
    exec(
        i18n("log_msg_read_ic_then_execute"),
        'nfc-mfdetect', isSaveDumpFile ? [`-O${tempMFDFilePath}`, `-f${knownKeysFile}`] : [`-N`, `-f${knownKeysFile}`],
        (value) => {keyInfoStatistic(value)},
        () => {
            saveKeys(newKeys)
            if (isSaveDumpFile && fs.statSync(tempMFDFilePath).size === 0) {
                fs.unlinkSync(tempMFDFilePath)
            }
        }).then(() => {
            printStatus(statusMsg)
            if (!isCmdFunc) {cmd(); return;}
            if (isSaveDumpFile && !fs.existsSync(tempMFDFilePath)) {
                printExitLog(0)
                return
            }
            exec(msg, cmd, args, processHandler, (code, signal)=>{
                if (finishHandler) finishHandler(code, signal)
                fs.unlink(tempMFDFilePath, (err) => {
                    if(err) throw err;
                })
            }).then(()=>{printExitLog(0)}).catch(() => {})
        }).catch(() => {})
}

// 执行MFOC解密
function mfoc(args) {
    let cardID = null
    newKeys = []
    knownKeyInfo = []
    unknownKeyInfo = []
    checkKeyFileExist()
    exec(
        i18n("log_msg_start_mfoc"),
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
                fs.mkdir(dumpsFolder, () => {
                    fs.rename(tempMFDFilePath, `${dumpFilesPath}/${cardID}_${getTimeList().join("_")}.mfd`, (err) =>{
                        if (err) throw err
                    })
                    cardID = null
                })
            }
        }
    ).then(()=>{printExitLog(0)}).catch(() => {})
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
    sendToMainWindow("setting-nfc-config", "start")
    const content = `device.name = "NFC_Device"\ndevice.connstring = "pn532_uart:${status.currentDevice}:${status.currentSpeed}"`
    fs.writeFile(nfcConfigFilePath, content, (err) => {
        if (err) throw err
        exec(i18n("log_msg_start_connect_device"),
            "nfc-list", [],
            (value) => {
                if (value.indexOf("NFC device: NFC_Device opened") >= 0) {
                    printLog(`\n*** ${i18n("log_msg_discover_device")} ***\n`)
                    status.isDeviceConnected = true
                }
                if (value.indexOf("Unable to open NFC device") >= 0) {
                    printLog(`\n*** ${i18n("log_msg_not_found_device")} ***\n`)
                    status.isDeviceConnected = false
                }
            },
            () => {sendToMainWindow("setting-nfc-config", status.isDeviceConnected ? "success" : "failed")},
        ).then(()=>{printExitLog(0)}).catch(() => {})
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

function updateDumpFiles() {
    const dumpFiles = fs.readdirSync(dumpsFolder).filter(file => file.endsWith('.mfd'));
    sentToDumpHistoryWindow('update-dump-history', dumpFiles)
}

function execAction(action, arg) {
    actions[action](arg)
}
module.exports = {execAction}