function findAndReplace(element, patterns, replacements) {
    var matches = traverseDOMToGetMatches(element, patterns, []);
    for (var i = matches.length-1; i >= 0; i--) {
        try {
            replacements[matches[i][0]](matches[i][1]);
        } catch(e) {
            console.error("Chrome Text Customizer : "+e.name+" - "+e.message);
        }
    }
}

function traverseDOMToGetMatches(element, patterns, matches_array) {   
    for (var child_i = 0; child_i < element.childNodes.length; child_i++) {
        var child = element.childNodes[child_i];
        if (child.nodeType === 1) {
            for (var i = 0; i < patterns.length; i++)
                if (patterns[i](child))
                    matches_array.push([i, child]);
            matches_array.concat(traverseDOMToGetMatches(child, patterns, matches_array));
        }
    }
    return matches_array;
}

chrome.storage.sync.get({
    matches: [],
    replacements: [],
}, function(options) {
    
    if (options.matches.length === 0)
        return;

    var matches = [];
    var replacements = [];
    for (var i=0; i<options.matches.length; i++) {
        matches.push(new Function('node', options.matches[i]));
        replacements.push(new Function('node', options.replacements[i]));
    }
    findAndReplace(document.getElementsByTagName('body')[0], matches, replacements);

    document.body.addEventListener ("DOMNodeInserted", function(e) {
        findAndReplace(e.target, matches, replacements);
    }, false);

    var DOMCharacterDataModified_handled = false; // Avoid infinite loops
    document.body.addEventListener ("DOMCharacterDataModified", function(e) {
        if (! DOMCharacterDataModified_handled) {
            findAndReplace(e.target, matches, replacements);
            DOMCharacterDataModified_handled = true;
        } else {
            DOMCharacterDataModified_handled = false;
        }
    }, false);
});
