(() => {
	const w = open('https://arhey-.github.io/memman/links.html');
	addEventListener('message', function wait(e) {
		let d = document, $ = s => d.querySelector(s);
		if (e.data == 'ready') {
			let src = $('meta[property="og:image"]')?.content, srcs = [];
			if (!src) srcs = [...d.querySelectorAll('img')]
				.filter(i => {
					let r = i.getBoundingClientRect();
					return r.bottom >= 0 && r.top <= screen.height
				})
				.map(i => i.src);
			w.postMessage({
				url: location.href,
				name: $('meta[property="og:title"]')?.content || d.title,
				src,
				srcs,
			}, '*');
			removeEventListener('message', wait);
		}
	});
})()
