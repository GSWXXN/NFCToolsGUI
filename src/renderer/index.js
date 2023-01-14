let mainProcess = window["electronAPI"]
let currentUSBPorts = []
let isConnectingDevice = false
let isLockScroll = false

// 接收更新 Log 输出
mainProcess.onUpdateLogOutput((_event, value) => {
    const textarea = document.getElementById("log")
    if (value.indexOf("[2K") >= 0) {
        textarea.value = textarea.value.substring(0, textarea.value.lastIndexOf('\n'))
        value = value.replace("[2K", "")
    }

    textarea.value += value
    if (!isLockScroll && value.indexOf("\n") >= 0) {
        textarea.scroll({top: textarea.scrollHeight, left: 0, behavior: "smooth"})
    }
})

// 接收更新 USB 设列表
mainProcess.onUpdateUSBDevices((_event, value) => {
    if (isListEqual(value, currentUSBPorts)) return
    currentUSBPorts = value
    $("ul.dropdown-menu, [data-id='usb-port']").empty()

    value.forEach((v) => {
        // <li class="menu-item ec-active" data-value="0" data-label="专线"><span class="text">专线</span></li>
        const deviceItemSpan = document.createElement("span")
        deviceItemSpan.setAttribute("class", "text")
        deviceItemSpan.innerText = v.replace(mainProcess.devicePrefix, "")

        const deviceItem = document.createElement("li")
        deviceItem.setAttribute("class", "menu-item")
        deviceItem.setAttribute("data-value", v)
        deviceItem.setAttribute("data-label", deviceItemSpan.innerText)
        deviceItem.appendChild(deviceItemSpan)
        $("ul.dropdown-menu, [data-id='usb-port']").append(deviceItem)
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
function showDropdown(obj, e){
    if (isConnectingDevice) return
    e.stopPropagation(); //阻止冒泡
    //阻止默认浏览器动作(W3C)
    if ( e && e.preventDefault ){
        e.preventDefault();
    } else{
        window.event.returnValue = false;
    }
    if ($(".dropdown-menus").is(":visible")) {
        $('.dropdown-menus').hide();
    }else{
        mainProcess.execAction('scan-usb-devices')
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
document.addEventListener("click", (e) => {
    if ($(".dropdown-menus").is(":visible")) {
        $('.dropdown-menus').hide();
    }
});

// 比较两个 List
function isListEqual(a, b) {
    if (a.length !== b.length) {
        return false
    } else {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false
            }
        }
        return true;
    }
}