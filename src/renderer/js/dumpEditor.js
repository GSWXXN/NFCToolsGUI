let currentFilePath = null

window['electronAPI'].onUpdateDumpEditorFile((event, data) => {
    window['electronAPI'].execAction('dump-editor-choose-file', data)
})

$('#drag').on('dragstart', (e) => {
    e.preventDefault()
    if (currentFilePath) window['electronAPI'].startDrag(currentFilePath)
})

// buttons
$('#choose-file').click(() => {window['electronAPI'].execAction('dump-editor-choose-file')})
$('#save-file').click(() => {
    if (checkData(true)) {
        window['electronAPI'].execAction(
            'dump-editor-save',
            {
                url: currentFilePath,
                hexData:$('.binary-input').map((i, el) => el.innerText).get().join('').replace(/\n/g, '')
            }
        )
    } else {
        alert(i18n("html_data_format_wrong"))
    }
})
$('#update-tag-color').click(() => {
    if (checkData()) {
        $('#binary-data-content').find('.binary-input').each((i, item) => {
            item.innerHTML = updateTagColor(item.innerText, !i)
        })
    } else {
        alert(i18n("html_data_format_wrong"))
    }
})

window['electronAPI'].onOpenDumpFile((event, data) => {
    let sector = 0;
    const container = $('#binary-data-content')
    container.empty()
    currentFilePath = data.url

    const pathArray = data.url.split(/[\/\\]/g)
    $('#current-file').text(pathArray[pathArray.length - 1])
    
    data.data.forEach((item, i)=> {
        const label = $(`<span class="textarea-label">${i18n("html_sector")} ${sector++}</span>`)
        const textarea = $(`<div class="binary-input" wrap="off" spellcheck="false" contenteditable="true">${updateTagColor(item, !i)}</div>`)

        container.append($('<br>'))
        container.append(label)
        container.append(textarea)
        label.width(textarea.width())
    })
})

window['electronAPI'].onSavedDumpFile(() => {
    alert(i18n("html_save_success"))
})

function updateTagColor(data, isBlock0 = false) {
    const splitData = data.split("\n")
    if (isBlock0) {splitData[0] = `<span class="uid">${splitData[0]}</span>`}
    splitData[3] = `<span class="keyA">${splitData[3].substring(0, 12)}</span>` +
        `<span class="accessControl">${splitData[3].substring(12, 18)}</span>` +
        `${splitData[3].substring(18, 20)}` +
        `<span class="keyB">${splitData[3].substring(20)}</span>`
    return splitData.join("\n")
}

function checkData(isCheckContent = false) {
    let isDataValid = true

    const styles = {
        invalid: {
            'border-color': '#e96666',
            'box-shadow': 'inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(223,102,102,.6)'
        },
        valid: {
            'border-color': '#ccc',
            'box-shadow': 'none'
        }
    }

    $('#binary-data-content').find('.binary-input').each((i, item) => {
        const splitData = item.innerText.split("\n");
        const valid = splitData.length === 4 && splitData.every(data => data.length === 32 && (!isCheckContent || /^[0-9A-Fa-f]+$/.test(data)));
        $(item).css(valid ? styles.valid : styles.invalid);
        isDataValid = isDataValid && valid;
    });
    return isDataValid
}