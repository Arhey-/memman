(() => {
	const w = open('https://arhey-.github.io/memman/temp-links.html');
	addEventListener('message', function wait(e) {
		let d = document, $ = s => d.querySelector;
		if (e.data == 'ready') {
			w.postMessage({
				url: location.href,
				name: $('meta[property="og:title"]')?.content || d.title,
				src: $('meta[property="og:image"]')?.content,
			}, '*');
			removeEventListener('message', wait);
		}
	});
})()
