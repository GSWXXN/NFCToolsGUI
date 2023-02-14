let dumpA = []
let dumpB = []

$(document).on('mousedown', function(event) {
    if (event.target.tagName.toLowerCase() !== 'input' && window.getSelection().toString() !== '') {
        window.getSelection().removeAllRanges();
    }
});

$('#dump-A').click(() => {window['electronAPI'].execAction('dump-comparator-choose-file', 'A')})
$('#dump-B').click(() => {window['electronAPI'].execAction('dump-comparator-choose-file', 'B')})

window['electronAPI'].onOpenDumpFile((event, data) => {
    const pathArray = data.url.split(/[\/\\]/g)
    if (data.type === 'A') {
        dumpA = data.data
        $('#dump-A').text(pathArray[pathArray.length - 1])
    } else if (data.type === 'B') {
        dumpB = data.data
        $('#dump-B').text(pathArray[pathArray.length - 1])
    }

    if (dumpA.length > 0 && dumpB.length > 0) { showMarkedDump(dumpA, dumpB, 4, 32) }

})

function markDifferentStrings(dumpA, dumpB, subArrLength, strLength) {
    const minLength = Math.min(dumpA.length, dumpB.length);
    const markedDumpA = [];
    const markedDumpB = [];

    for (let i = 0; i < minLength; i++) {
        const markedSubArrA = [];
        const markedSubArrB = [];

        for (let j = 0; j < subArrLength; j++) {
            let markedStrA = "";
            let markedStrB = "";
            let hasDifference = false;

            for (let k = 0; k < strLength; k++) {
                if (dumpA[i][j][k] !== dumpB[i][j][k]) {
                    markedStrA += `<mark>${dumpA[i][j][k]}</mark>`;
                    markedStrB += `<mark>${dumpB[i][j][k]}</mark>`;
                    hasDifference = true;
                } else {
                    markedStrA += dumpA[i][j][k];
                    markedStrB += dumpB[i][j][k];
                }
            }

            markedSubArrA.push(hasDifference ? markedStrA : dumpA[i][j]);
            markedSubArrB.push(hasDifference ? markedStrB : dumpB[i][j]);
        }

        markedDumpA.push(markedSubArrA);
        markedDumpB.push(markedSubArrB);
    }

    if (dumpA.length > dumpB.length) {
        for (let i = minLength; i < dumpA.length; i++) {
            const markedSubArrA = [];

            for (let j = 0; j < subArrLength; j++) {
                markedSubArrA.push(`<mark>${dumpA[i][j]}</mark>`);
            }

            markedDumpA.push(markedSubArrA);
            markedDumpB.push("");
        }
    } else if (dumpB.length > dumpA.length) {
        for (let i = minLength; i < dumpB.length; i++) {
            const markedSubArrB = [];

            for (let j = 0; j < subArrLength; j++) {
                markedSubArrB.push(`<mark>${dumpB[i][j]}</mark>`);
            }
            markedDumpA.push("");
            markedDumpB.push(markedSubArrB);
        }
    }

    return [markedDumpA, markedDumpB];
}

function showMarkedDump(dumpA, dumpB, subArrLength, strLength) {
    const [markedDumpA, markedDumpB] = markDifferentStrings(dumpA, dumpB, subArrLength, strLength);

    // 获取页面中的容器元素
    const container = $("#compare-container");
    container.empty()

    // 遍历 dumpA 和 dumpB 的子数组，生成包含标记的字符串，将它们插入到页面上
    let sector = 0
    markedDumpA.forEach((subArrA, index) => {
        container.append($("<div>").html(`扇区 ${sector++}`).addClass('sector-tag'))
        const subArrB = markedDumpB[index]
        const row = $("<div>")
        subArrA.forEach((strA, j) => {
            const strB = subArrB[j];

            row.append($("<div>").html(`A: ${strA}`).addClass('dump-text'))
            row.append($("<div>").html(`B: ${strB}`).addClass('dump-text'))
            row.append($("<hr>"))
        });
        container.append(row)
        container.append("<br>")
    });
}
