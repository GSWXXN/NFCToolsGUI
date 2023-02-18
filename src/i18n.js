const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let texts = {};

function init() {
    const lang = getLanguage();
    const langFilePath = path.join(__dirname, 'locales', `${lang}.json`);
    try {
        const langFileContent = fs.readFileSync(langFilePath, 'utf8');
        texts = JSON.parse(langFileContent);
    } catch (err) {
        console.error(`Failed to load language file: ${err}`);
    }
}

function getLanguage() {
    const userLanguage = app.getLocale();
    const [languageCode] = userLanguage.split('-');
    const supportedLanguages = ['en', 'zh-CN']; // 支持的语言列表
    if (supportedLanguages.includes(languageCode)) {
        return languageCode;
    } else if (supportedLanguages.includes(userLanguage)) {
        return userLanguage;
    }
    return 'en'; // 如果用户的语言不在支持列表中，则默认使用英语
}

function getText(key) {
    return texts[key] || key;
}

const i18n = getText

module.exports = {
    init,
    getLanguage,
    getText,
    i18n
};
