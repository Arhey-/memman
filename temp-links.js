(()=>{
	const w = open('https://arhey-.github.io/memman/temp-links.html');
	addEventListener('message', function wait(e) {
		if (e.data == 'ready') {
			w.postMessage({
				url: location.href,
				title: document.querySelector('meta[property="og:title"]')?.content || document.title,
				src: document.querySelector('meta[property="og:image"]')?.content,
			}, '*');
			removeEventListener('message', wait);
		}
	});
})()
