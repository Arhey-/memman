(() => {
    let d = document, $ = s => d.querySelector(s);
    let src = $('meta[property="og:image"]')?.content, srcs = [];
    if (!src) srcs = [...d.querySelectorAll('img')]
        .filter(i => {
            if (!i.offsetParent) return;
            let r = i.getBoundingClientRect();
            return r.bottom >= 0 && r.top <= screen.height
        })
        .map(i => i.src);
    let u = new URL('https://arhey-.github.io/memman/links.html'),
        q = u.searchParams;
    q.set('url', location.href);
    q.set('name', $('meta[property="og:title"]')?.content || d.title);
    q.set('src', src || '');
    for (let s of srcs) q.append('srcs', s);
    open(u);
})()
