let isEditingFileName = false;

const $compareDumpsButton = $('#compareDumpsButton')
const $editDumpButton = $('#editDumpButton')

window["electronAPI"].onCreateDumpHistoryWindow((_event, dumps) => {
    const $dumpsList = $('#dumpsList');
    $dumpsList.empty();

    dumps.forEach(dump => {
        const $fileName = $('<span>').addClass('dump-item-filename').text(dump);
        const $dumpItem = $('<div>').addClass('dump-item').append($fileName).click(function() {
            if (!isEditingFileName) {
                $(this).parent().toggleClass('selected')
                updateBottomButtonStatus();
            }
        });

        // 删除按钮
        const delIMG = $('<img>').attr('src', '../assets/icon/svg/del.svg').addClass("dump-action-button-img")
        const $deleteButton = $('<button>').addClass('dump-action-button').append(delIMG).click(function(event) {
            event.stopPropagation();
            window["electronAPI"].execAction('delete-dump', [dump]);
        }).hide();

        // 重命名按钮
        const renameIMG = $('<img>').attr('src', '../assets/icon/svg/rename.svg').addClass("dump-action-button-img").addClass("invert-color-when-dark")
        const $renameButton = $('<button>').addClass('dump-action-button').append(renameIMG).click(function(event) {
            event.stopPropagation();
            // 编辑框
            const $input = $('<input>').attr('type', 'text').addClass("dump-action-edit").val($fileName.text());
            $input.on('blur keydown', function(e) {
                if (e.type === 'blur' || e.which === 13) {
                    isEditingFileName = false;
                    $input.remove();
                    $fileName.show()
                    $deleteButton.show()
                    $renameButton.show()

                    window["electronAPI"].execAction('rename-dump-file', {oldName: dump, newName: $input.val()});
                }
            });
            isEditingFileName = true;
            $fileName.hide()
            $deleteButton.hide()
            $renameButton.hide()
            $dumpItem.append($input);
            $input.focus();
        }).hide();

        // 添加元素
        $dumpItem.append($renameButton);
        $dumpItem.append($deleteButton);
        $dumpsList.append($('<li>').append($dumpItem).append("<hr>").addClass('dump-item-wrapper'));

        // 显示/隐藏按钮
        $dumpItem.hover(function() {
            if (isEditingFileName) return;
            $(this).find('.dump-action-button').show();
        }, function() {
            if (isEditingFileName) return;
            $(this).find('.dump-action-button').hide();
        });
    });
});

$editDumpButton.click(() => {
    const $selectedDump = $('#dumpsList .selected');
    if ($selectedDump.length) {
        const dumpId = $selectedDump.text();
        console.log(dumpId)
        window["electronAPI"].execAction('open-dump-editor', dumpId);
    }
});

$compareDumpsButton.click(() => {
    const $selectedDumps = $('#dumpsList .selected');
    if ($selectedDumps.length === 2) {
        const dumpId1 = $selectedDumps.eq(0).text();
        const dumpId2 = $selectedDumps.eq(1).text();
        console.log(dumpId1, dumpId2)
        window["electronAPI"].execAction('open-dump-comparator', {A: dumpId1, B: dumpId2});
    }
});

$('#deleteSelectedButton').click(() => {
    const $selectedDumps = $('#dumpsList .selected');
    window["electronAPI"].execAction('delete-dump', $selectedDumps.map((_, dump) => $(dump).text()).toArray());
});

function updateBottomButtonStatus() {
    const $selectedDumps = $('#dumpsList .selected');
    if ($selectedDumps.length === 1) {
        $editDumpButton.prop('disabled', false);
        $compareDumpsButton.prop('disabled', true);
    } else if ($selectedDumps.length === 2) {
        $editDumpButton.prop('disabled', true);
        $compareDumpsButton.prop('disabled', false);
    } else {
        $editDumpButton.prop('disabled', true);
        $compareDumpsButton.prop('disabled', true);
    }
}

