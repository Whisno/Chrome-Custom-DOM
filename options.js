var $line = $("\
<div class='rule'>\
    <button class='delete_line' title='Delete this rule'><span class='glyphicon glyphicon-remove'></span></button>\
    <div class='match'>\
        <div class='value match_value'></div>\
    </div>\
    <span class='glyphicon glyphicon-arrow-right'></span>\
    <div class='replacement'>\
        <div class='value replacement_value'></div>\
    </div>\
    <div class='clearer'></div>\
</div>");

var anyValueModified = false;
// Store ace editors reference. DOM nodes containing an editor have a data-editor_index attribute.
// It's a poor architecture but will do the trick until I learn react.js
var editors = [];
// Ace doesn't seem to provide with a placeholder functionality
var match_placeholder = '// Predicate';
var replacement_placeholder = '// Handler';

document.addEventListener('DOMContentLoaded', function() {
    // Event handlers on static content
    $('#btn_save').click(function() {
        saveOptions();
    });
    $('#add_line').click(function() {
        appendLine();
    });
    // Event handlers on dynamic content
    $('body').on('change', 'input, select, textarea', function() {
        anyValueModified = true;
    });
    $('body').on('change', '.rule select', function() {
        $(this).nextAll("textarea")[0].focus();
    });
    $('body').on('click', '.delete_line', function() {
        anyValueModified = true;
        $(this).closest('.rule').remove();
        if ($("#rules .rule").length === 0)
            appendLine();
    });

    loadOptions();

}, false);

function loadOptions() {
    chrome.storage.sync.get({
        matches: [],
        replacements: [],
    }, function(options) {
        $('#rules').empty();
        for (var i=0; i<options.matches.length; i++)
            appendLine(options.matches[i], options.replacements[i]);
        if (options.matches.length === 0)
            appendLine();
    });
}

function saveOptions() {
    var matches = [];
    var replacements = [];

    $('#rules .rule').each(function(i) {
        var match_value = editors[$(this).find('.match_value').data("editor_index")].getValue();
        var replacement_value = editors[$(this).find('.replacement_value').data("editor_index")].getValue();

        if (isRuleValid(match_value, replacement_value)) {
            matches.push(match_value);
            replacements.push(replacement_value);
        }
    });

    chrome.storage.sync.set({
        matches: matches,
        replacements: replacements
    }, function() {
        showNotification("Rules saved !", "success", 1000);
        anyValueModified = false;
        loadOptions();
    });
}

function appendLine(match, replacement) {
    match = match || match_placeholder;
    replacement = replacement || replacement_placeholder;
    var $new_line = $line.clone();
    createAceEditor($new_line.find(".match_value").get(0), match);
    createAceEditor($new_line.find(".replacement_value").get(0), replacement);
    $('#rules').append($new_line);
}

function createAceEditor(node, content) {
    var editor = ace.edit(node)
    editor.setTheme("ace/theme/xcode");
    editor.getSession().setMode("ace/mode/javascript");
    editor.setOptions({
        maxLines: Infinity // Somehow enables auto-resize
    });
    editor.setValue(content);
    editor.clearSelection();

    node.dataset.editor_index = editors.length;
    editors.push(editor);

    return editor;
}

function isRuleValid(match, replacement) {
    return match !== match_placeholder
        && replacement !== replacement_placeholder;
}

function showNotification(string, type, duration) {
    $("#notifications").empty().append("<div class='alert alert-"+type+"' style='display: none;'>"+string+"</div>");
    $("#notifications .alert").slideDown(300).delay(duration).slideUp(300, function() { $(this).remove() });
}
