export function saveJson(o, name, ext = '.json') {
    let json = typeof o == 'string'
        ? o
        : JSON.stringify(o);
    let s = "data:text/json;charset=utf-8," + encodeURIComponent(json);
    let a = document.createElement('a');
    a.setAttribute("href", s);
    a.setAttribute("download", name + ext);
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export function readJson() {
    let resolve;
    let promise = new Promise(r => resolve = r);
    let i = document.createElement('input');
    i.type = 'file';
    i.accept = '.json';
    i.addEventListener('change', () => readFile(i.files[0], resolve), { once: true });
    i.click();
    return promise;
}

function readFile(file, resolve) {
    let reader = new FileReader();
    reader.onload = e => {
        resolve(JSON.parse(e.target.result));
    };
    reader.readAsText(file);
}
