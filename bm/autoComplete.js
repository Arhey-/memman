/**
 * Created by Arhey on 16.08.14.
 */
var cmd = document.getElementById('omnibox'),
    ulMatchList = document.getElementById('matchList'),
    tagList = {all: ['tool', 'tool-online', 'web', 'js', 'online'],
        match: [],
        currentMatch: 0
    },
    sourceDotString,
    style = document.getElementsByTagName("STYLE")[0],
    links = document.getElementById('links');

cmd.addEventListener('input', cmdProcessing, false);
cmd.addEventListener('keydown', cmdHotkeyProcessing, false);
document.getElementById('omniExample').addEventListener('change', function() {
    cmd.value = this.value;
    applyFilter();
}, false);

function cmdProcessing() {
    var list, selector;
    if (!~cmd.value.indexOf('.')) {
        return;
    }
    sourceDotString = cmd.value.split('.').pop();

    // todo delete uncomplete part, like ':not('
    selector = cmd.value.substring(0, cmd.value.lastIndexOf('.'));
    if (selector == '') {
        list = tagList.all;
    } else {
        list = indexation(selector); // todo вынести индексацию (не на каждый символ же)
        for (var i = 0; i < list.length; i++) { // todo свапнуть: искать в списке перебор с селектора
            if (~selector.indexOf('.' + list[i])) { // todo replace with RegExp: web in webgl '.',' ',',',':', ')'хотя НОТ не надо исключать, тег может использоваться после запятой
                list.splice(i--, 1); // поменять местами: теги с селектора вынимаем с теглиста
            }
        }
    }
    tagList.match = [];
    ulMatchList.innerHTML = '';
    for (var i = 0; i < list.length; i++) {
        var tag = list[i];
        if (tag.indexOf(sourceDotString) === 0) {
            tagList.match.push(tag);
            ulMatchList.appendChild(document.createElement('li'));
            ulMatchList.lastChild.textContent = tag;
        }
    }
    if (tagList.match.length) {
        tagList.currentMatch = 0;
        placeholder();
        applyFilter();
    }
}

function cmdComplete() {
    var tag = tagList.match[tagList.currentMatch];
    cmd.value += tag.substr(sourceDotString.length);
}

// complete and select completed part of word
function placeholder() {
    var startSelection,
        active;
    cmdComplete();
    startSelection = cmd.value.lastIndexOf('.') + 1 + sourceDotString.length;
    doSelect(cmd, startSelection, cmd.value.length);

    ulMatchList.style.display = 'block';

    if (active = ulMatchList.getElementsByClassName('active')[0]) {
        active.classList.remove('active');
    }
    ulMatchList.children[tagList.currentMatch].classList.add("active");
}

function cmdHotkeyProcessing(e) {
    console.log('keyCode = ' + e.keyCode);
    var key = e.keyCode,
        selection = window.getSelection().toString();

    ulMatchList.style.display = 'none';

    if (key == 8) {
        cmd.value = cmd.value.substring(0, cmd.value.lastIndexOf('.') + 1);
    }

    if (key == 13) {
        applyFilter();
    }
    if (key == 48) {
        setTimeout(function(){
            applyFilter();
        }, 50);
    }
//    if (selection.length > 0 && (key == 32 || key == 188 || key == 190 || key == 13 || key == 48)) {
    if (~[32, 188, 190, 13, 48].indexOf(key)) {
        // space , . Enter )
        cmd.value += '' ;
    }
    if (key == 186) { // ':'
        cmd.value += ':not(';
        e.preventDefault();
    }
    if (key == 191) { // '/' todo switch edit and command: ctrl/shift/ctrl x 2/shift x 2; j - nextMatch
        if (++tagList.currentMatch >= tagList.match.length) { // todo complete.nextMatch
            tagList.currentMatch = 0;
        }
        cmd.value = cmd.value.substring(0, cmd.value.lastIndexOf(selection));
        placeholder();
        e.preventDefault();
    }
}

function applyFilter() {
    var s = cmd.value;
    if (sourceDotString == '') {
        return;
    }
    if (s === '') {
        style.innerHTML = 'a {display:none;}'; // todo show groups
    } else {
        style.innerHTML = 'a {display:none;} \n' + s + ' {display: block}';
        /* todo: show & hide instead like jQuery (change inner-style for selector elements) make
           create new style:
                hide(selector) {style.innerHTML = | += ??? 'selector {display:none}'} +- weight
           но как удалять добавленные таким образом стили? Возможно в отдельный STYLE - проверить
           Такой подход плох непрадсказуемым поведением - вес селектора. Так что все-таки мб и лучше
           elem.style.display = 'none'
        */
    }
}

function indexation(selector) {
    console.time(selector);
    var collection = document.querySelectorAll(selector),
        length = collection.length,
        allTags = [];
    for (var i = 0; i < length; i++) {
        var tags = collection[i].classList;
        for (var j = 0; j < tags.length; j++) {
            var tag = tags[j];
            if (!~allTags.indexOf(tag)) { // todo jsperf set as key
                allTags.push(tag);
            }
        }
    }
    console.timeEnd(selector);
    return allTags;
}

function loadSheet(data) {
    const url = 0;
    const name = 1;
    const tags = 2;
    const note = 3;
    console.time('loadSheet.done()');
    console.log(data.shift(), data.length); // column titles
    links.innerHTML = "<a "
        + data.map(function (a) {
            return 'href="' + a[url]
                + '" class="' + a[tags]
                + '" title="' + a[note]
                + '" target="_blank" style="background: url('
                + a[url].substring(0, a[url].indexOf('/', a[url].indexOf('//') + 2) + 1)
                + 'favicon.ico) no-repeat 2px 1px/16px auto;">'
                + a[name];
        }).join('</a><a ')
        + "</a>";
    console.timeEnd('loadSheet.done()');
    cmd.value = '.daily';
    applyFilter();
    tagList.all = indexation('a').sort();
}
