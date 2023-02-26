let mainProcess = window["electronAPI"]
let currentUSBPorts = []
let isConnectingDevice = false
let isLockScroll = false
let isTimerRunning = false;
let intervalID = undefined;
let timerSecond = 0
const $statusText = $("#status-text")

mainProcess.execAction("check-update")

if (mainProcess.platform !== "darwin") {
    const titleArea = $(".title")
    $(".windows-control").show()
    titleArea.css("float", "none")
    titleArea.css("margin-left", "10px")
    $("#app-title-icon").css("display", "inline-block")
}

mainProcess.getVersion().then((v) =>{$("#version-value").html(v)})

// 接收更新 Log 输出
mainProcess.onUpdateLogOutput((_event, value) => {
    const textarea = document.getElementById("log")
    if (value.indexOf("\33[2K") >= 0) {
        textarea.value = textarea.value.substring(0, textarea.value.lastIndexOf('\n'))
        value = value.replace("\33[2K", "")
    }

    textarea.value += value
    if (!isLockScroll && value.indexOf("\n") >= 0) {
        textarea.scroll({top: textarea.scrollHeight, left: 0, behavior: "smooth"})
    }
})

// 接收状态更新
mainProcess.onUpdateStatus((_event, value) => {
    $statusText.html(value["text"])
    $statusText.prop("title", value["text"])

    const statusIndicator = $("#status-indicator")
    switch (value["indicator"]) {
        case "free":
            statusIndicator.css("background-color", "transparent")
            resetStatus(true)
            break
        case "running":
            statusIndicator.css("background-color", "green")

            if (isTimerRunning) return
            isTimerRunning = true
            let double = function (m) {
                return m < 10 ? `0${m}` : `${m}`;
            }
            intervalID = setInterval(function () {
                timerSecond++;
                const hour = parseInt(timerSecond / 3600);
                const min = parseInt(timerSecond / 60) % 60;
                const sec = timerSecond % 60;
                $("#timer-value").html( `${double(hour)}:${double(min)}:${double(sec)}`)
            }, 1000);
            break
        case "error":
            statusIndicator.css("background-color", "red")
            resetStatus(true)
    }
})

// 接收更新 USB 设列表
mainProcess.onUpdateUSBDevices((_event, value) => {
    if (isListEqual(value, currentUSBPorts)) return
    currentUSBPorts = value
    const usbPorts = $(".dropdown-menu[data-id='usb-port']")
    usbPorts.empty()

    value.forEach((v) => {
        const deviceItemSpan = document.createElement("span")
        deviceItemSpan.setAttribute("class", "text")
        deviceItemSpan.innerText = v.replace(mainProcess.devicePrefix, "")

        const deviceItem = document.createElement("li")
        deviceItem.setAttribute("class", "menu-item")
        deviceItem.setAttribute("data-value", v)
        deviceItem.setAttribute("data-label", deviceItemSpan.innerText)
        deviceItem.appendChild(deviceItemSpan)
        usbPorts.append(deviceItem)
    })
})

// 更新配置时, 禁止选择设备
mainProcess.onSettingNFCConfig((_event, value) => {
    if (value === "start") {
        isConnectingDevice = true
        $(".selection").css("background-color", "#b6b239")
    } else if (value === "success") {
        isConnectingDevice = false
        $(".selection").css("background-color", "#54ad6c")
    } else {
        isConnectingDevice = false
        $(".selection").css("background-color", "#cf4152")
    }
})


// 显示选择设备下拉列表
function showDropdown(obj, e, action){
    e.stopPropagation(); //阻止冒泡
    //阻止默认浏览器动作(W3C)
    if ( e && e.preventDefault ){
        e.preventDefault();
    } else{
        window.event.returnValue = false;
    }
    const dropdownMenus = $(obj).next()
    if (dropdownMenus.is(":visible")) {
        dropdownMenus.hide();
    }else{
        $('.dropdown-menus').hide()
        if (action) action()
        $(obj).next().show();
    }
}

// 选择下拉列表设备
function selectedValue(obj, e){
    e.stopPropagation(); //阻止冒泡
    let selectedDom;
    // 点击的地方可能是li，也可能是li的子节点
    if(e.target && e.target.nodeName === "LI"){
        selectedDom = e.target;
    }else{
        selectedDom = $(e.target).parent();
    }

    const selectedValue = $(selectedDom).data('value');
    const selectedLabel = $(selectedDom).data('label');
    const operationID = $(obj).data('id');

    $(selectedDom).siblings().removeClass('ec-active')
    $(selectedDom).addClass('ec-active');
    $('#'+operationID+'-label').val(selectedLabel);
    $('#'+operationID+'-value').val(selectedValue);
    $(obj).parent().hide();
    mainProcess.execAction('conn-usb-devices', selectedValue)
}

// 点击其他位置关闭下拉列表
document.addEventListener("click", () => {
    if ($(".dropdown-menus").is(":visible")) {
        $('.dropdown-menus').hide();
    }
});

// 重置状态
function resetStatus(fromMain=false) {
    if (isTimerRunning || fromMain) {
        clearInterval(intervalID)
        isTimerRunning = false
        timerSecond = 0
    } else {
        $("#timer-value").html("")
        $statusText.html(i18n("free"))
        $statusText.prop("title", i18n("free"))
        $("#status-indicator").css("background-color", "transparent")
    }
}