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

function getRatioValue(name){
    const radio = document.getElementsByName(name);
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked) {
            return radio[i].value
        }
    }
}

function setRatioValue(name, value){
    const radio = document.getElementsByName(name);
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].value === value) {
            radio[i].checked = true
        }
    }
}