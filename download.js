export function downloadJsonString(json, name){
    let s = "data:text/json;charset=utf-8," + encodeURIComponent(json);
    let a = document.createElement('a');
    a.setAttribute("href", s);
    a.setAttribute("download", name);
    document.body.appendChild(a);
    a.click();
    a.remove();
}
