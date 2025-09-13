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
	let l = {
		url: location.href,
		name: $('meta[property="og:title"]')?.content || d.title,
		src,
		srcs,
	}, w = open('https://arhey-.github.io/memman/links.html');
	addEventListener('message', function wait(e) {
		if (e.data == 'ready') {
			w.postMessage(l, '*');
			removeEventListener('message', wait);
		}
	});
})()
