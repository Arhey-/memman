(() => {
	const w = open('https://arhey-.github.io/memman/links.html');
	addEventListener('message', function wait(e) {
		let d = document, $ = s => d.querySelector(s);
		if (e.data == 'ready') {
			const src = $('meta[property="og:image"]')?.content;
			const srcs = src ? [] : [...d.querySelectorAll('img')].map(i => i.src);
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
