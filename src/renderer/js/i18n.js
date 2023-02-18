const i18n = window["electronAPI"].getText

const body = document.body
const title = document.title

body.innerHTML = body.innerHTML.replaceAll(/{{\s*([^}\s]*)\s*}}/g, (match, key) => {
    return i18n(key)
})

document.title = title.replaceAll(/{{\s*([^}\s]*)\s*}}/g, (match, key) => {
    return i18n(key)
})

window["electronAPI"].rendered()
