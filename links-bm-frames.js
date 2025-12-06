(() => {
	let f = [...document.querySelectorAll('iframe')]
		.filter(f=>f.src)
		.sort((a,b)=>b.offsetWidth - a.offsetWidth)[0];
	if (f) open(f.src)
})()
