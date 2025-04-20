import { saveJson, readJson } from './fs.js'
import { html } from '../lib/html.js'
import { DB } from '../lib/db.js'

addEventListener('error', e => log(e.message))
addEventListener('unhandledrejection', e => log('reject', e.reason))
let isLogNotify = true
function log(...t) {
	const p = html.p({ class: 'log' }, ...t)
	const header = isLogNotify && document.getElementById('notifications')
	if (header) {
		header.prepend(p)
		setTimeout(() => document.body.append(p), 1_000)
	} else {
		document.body.append(p) // TODO ❌
	}
}

const $ = selector => document.querySelector(selector)
const $$ = selector => document.querySelectorAll(selector)
const selectedOptions = el => Array.from(el.selectedOptions, o => o.value)

const card = i => html.a(
	{ href: i.url, target: '_blank', class: { card: 1, next: i.prev, gap: i[prevGap] } },
	html.p({ class: 'name' }, i.name || i.title),
	html.img({ src: i.src, loading: 'lazy' }),
	html.p({ class: 'tags' }, [
		...subtractSet(i.tags, selectedOptions($tagsInc))
	].toString())
)

const $cards = $('#cards'), $tags = $('#tags'),
	$tagsInc = $('#tagsInc'), $tagsEx = $('#tagsEx')
const $textarea = $('textarea')
$('#code').onclick = () => $textarea.hidden = !$textarea.hidden
$('#code').oncontextmenu = () => $('#actions').showModal()
if (!/mobile/i.test(navigator.userAgent))
	$('#code').before(html.button(() => $('#actions').showModal(), 'actions'))
$textarea.onchange = () => {
	// add in-string check?
	const s = $textarea.value.replace(/(?<!new) ([A-Z])/g, '$1')
	$textarea.value = s
	if (!s || s.startsWith('prevent eval')) return;
	const r = eval(s)
	if (r instanceof Promise) r.then(log).catch(log);
	else log(r);
}


const db = new DB('links', 1, (/** @type {IDBVersionChangeEvent} */ e) => {
	if (e.oldVersion == 0 && e.newVersion == 1) {
		const db = e.target.result
		const s = db.createObjectStore('links', { keyPath: 'url' })
		// s.createIndex('tags', 'tags', { unique: false }) // multi
	} else {
		throw Error(`todo uprade db from v${e.oldVersion} to ${e.newVersion}`)
	}
})
await db.ready

const tagsSort = stringToTags(localStorage.getItem('links-tags') || '')
tagsSort.forEach(addTagToUI)

function tagSortedIndex({ tag, originalIndex }) {
	const i = tagsSort.indexOf(tag)
	return i === -1 ? tagsSort.length + originalIndex : i
}

function saveTags(all) {
	const s = [...all]
		.map((tag, i) => ({ tag, originalIndex: i }))
		.sort((a, b) => tagSortedIndex(a) - tagSortedIndex(b))
		.map(t => t.tag)
		.toString()
	if (localStorage.getItem('links-tags') != s) {
		localStorage.setItem('links-tags', s)
	}
}

function addTagsToUI(tags) {
	const was = new Set(Array.from($tagsInc.options, o => o.value))
	const added = new Set(tags).difference(was)
	for (const t of added) {
		addTagToUI(t)
	}
	return { was, added }
}

function addTagToUI(tag) {
	$tagsInc.append(html.option({ value: tag }, tag))
	$tagsEx.append(html.option({ value: tag }, tag))
	const c = html.input({ type: 'checkbox', value: tag, onchange: tagOnChange })
	$tags.append(html.label(c, tag))
}

// TODO onchange $tagsInc -> $tags
function tagOnChange({ target: { value, checked } }) {
	[...$tagsInc.options]
		.find(o => o.value == value)
		.selected = checked
}


$('#show').onclick = () => show().catch(log)
async function show(urlPart = '') {
	$cards.innerHTML = ''
	const inc = selectedOptions($tagsInc)
	const ex = selectedOptions($tagsEx)
	const isLoad = inc.length || ex.length || urlPart.length || confirm(
		'no tags selected.\nYES - show all, CANCEL - reindex tags'
	)
	const links = [], allTags = new Set
	let total = 0
	await db.each('links', l => {
		total++
		if (
			isLoad
			&& inc.every(t => l.tags.includes(t))
			&& !ex.some(t => l.tags.includes(t))
			&& (!urlPart.length || l.url.includes(urlPart))
		) links.push(l)
		l.tags.forEach(t => allTags.add(t))
	})
	saveTags(allTags)
	const { added } = addTagsToUI(allTags)
	for (const t of added) log('new tags found in db: ', t)
	
	log(`total ${total}, show ${links.length}`)
	await new Promise(r => setTimeout(r))
	$cards.append(...prevMods(sort(links)).map(card))
}

$('#top').onclick = () => $cards.scrollIntoView()
$('#down').onclick = () => $cards.lastElementChild.scrollIntoView()
$('#view').onclick = () => view()
function view(urlPart = prompt('part of url')) {
	if (!$cards.childElementCount) {
		return show(urlPart).catch(log)
	}
	if (urlPart) [...document.querySelectorAll('a')]
		.find(a => a.href.includes(urlPart))
		?.scrollIntoView()
}

const $perRow = $('#perRow')
$perRow.onchange = e => {
	const v = $perRow.value
	document.documentElement.style.setProperty('--repeat', v || 'auto-fit')
	$cards.style['grid-template-columns'] = v
		? 'repeat(var(--repeat), 1fr)'
		: ''
	if (e) localStorage.setItem('links-columns', v)
}
$perRow.value = localStorage.getItem('links-columns') || ''
$perRow.onchange()


const $select = $('#select')
$select.onchange = () => {
	if (!$select.checked) $$('.select')
		.forEach(e => e.classList.remove('select'))
}
const $prev = $('#prev')
let beNext
$prev.onchange = () => {
	if ($prev.checked || !beNext) return;
	beNext.style.border = ''
	beNext = null
}
document.body.addEventListener('click', e => {
	const a = e.target?.parentElement
	if ('A' != a?.tagName || !($prev.checked || $select.checked)) return;
	e.preventDefault()
	if ($select.checked) return a.classList.toggle('select')
	if (beNext) {
		const next = beNext
		beNext.style.border = ''
		beNext = null
		if (a == next) return;
		db.update('links', next.href, { prev: a.href }).then(() => {
			a.after(next)
			next.classList.add('next')
		}).catch(log)
	} else {
		beNext = a
		a.style.border = '1px solid blue'
	}
})

function sort(list) {
	let wait, sorted = [], label = `sort ${list.length} items`;
	console.time(label);
	do {
		if (wait) list = wait;
		wait = [];
		for (const i of list) {
			if (!i.prev) {
				sorted.push(i);
				continue;
			}
			const n = sorted.findIndex(si => si.url == i.prev);
			if (n > -1) {
				sorted.splice(n + 1, 0, i);
			} else if (list.some(li => li.url == i.prev)) {
				wait.push(i);
			} else {
				sorted.push(i);
			}
		}
	} while (wait.length);
	console.timeEnd(label);
	return sorted
}

const prevGap = Symbol('prevGap')
function prevMods(list) {
	list.forEach((l, i) => {
		if (l.prev && l.prev != list[i - 1]?.url)
			l[prevGap] = true
	})
	return list
}


addEventListener('message', async e => {
	if (!e.data) return;
	isLogNotify = false
	const { name, title } = e.data
	let { url, src } = e.data
	if (url) {
		const u = new URL(url)
		u.searchParams.delete('_ga')
		url = u.href
		log(url.split('/').map((s, i) => i ? '/' + s : s))
	} else log(`message ${e.data}`);
	
	const imgs = e.data.srcs?.map(choseSrc => html.img({
		src: choseSrc,
		onclick() {
			src = choseSrc
			for (const img of imgs) {
				img.classList.toggle('fade', img.src !== src)
			}
		}
	}))
	if (imgs) $cards.append(...imgs)

	document.body.append(html.input({
		placeholder: 'new tags (,|\\s separated)',
		onchange(e) {
			const tags = stringToTags(e.target.value)
			const { was, added } = addTagsToUI(tags)
			saveTags(was.union(added))
		}
	}))
	const i = await db.get('links', url)
	const si = url.indexOf('?')
	if (~si) db.get('links', url.slice(0, si)).then(l => l && $cards.append(card(l)))
	if (!i) {
		$cards.prepend(card(e.data))
		const b = html.button({
			class: 'bgGreen',
			onclick: async () => {
				const tags = selectedOptions($tagsInc)
				if (!tags.length) return log('select least one tag')
				b.remove()
				const link = { url, src, name: name || title, tags }
				await db.add('links', link)
				close()
			}
		}, 'add')
		const bSameName = html.button(async () => {
			bSameName.remove()
			const ls = await db.getAll('links')
			const n = (name || title).toLowerCase()
			const sn = ls.filter(l => l.name.toLowerCase() == n)
			if (!sn.length) {
				log('not found same name')
				return
			}
			$cards.append(...sn.map(card));

			const first = sn[0]
			log(first.url)
			const b = html.button(async () => {
				b.remove()
				await db.add('links', { ...first, url, src })
				await db.delete('links', first.url)
				close()
			}, 'replace url and src in first same name')
			document.body.append(b)
		}, 'search same name')
		document.body.append($tags, b, bSameName)
		return
	}
	$cards.prepend(card(i));
	[...$tagsInc.options].forEach(o => o.selected = i.tags.includes(o.value));
	[...$tags.elements].forEach(cb => cb.checked = i.tags.includes(cb.value))
	if (imgs) for (const img of imgs) {
		img.classList.toggle('fade', img.src !== i.src)
	}
	const b = html.button({
		class: 'bgRed',
		onclick: async () => {
			if (!confirm('remove?')) return;
			b.remove()
			await db.delete('links', url)
			log(`"${name || title}" removed\n${url}`)
		}
	}, 'remove')
	const bSrc = html.button(async () => {
		bSrc.remove()
		await db.update('links', url, { src })
		log('src updated')
	}, 'update src')
	const bTags = html.button(async () => {
		const tags = selectedOptions($tagsInc)
		if (!tags.length) return log('select least one tag')
		const { eqSet } = await import('../lib/diff.js')
		if (eqSet(tags, i.tags)) return;
		bTags.disabled = true
		await db.update('links', url, { tags })
		i.tags = tags
		bTags.disabled = false
		log('tags updated to ' + tags)
	}, 'update tags')
	document.body.append(b, bTags, bSrc)
})
opener?.postMessage('ready', '*')

const actionButton = fn => html.button(e => { 
	fn(e)
	$('#actions').close()
}, fn.name)
$('#actions').append(
	actionButton(modTags),
	actionButton(download),
	actionButton(diffUpload_localOnly),
	actionButton(diffUpload_remoteOnly),
	actionButton(diffUpload_changs),
	actionButton(upload)
)

async function download() {
	const d = new Date().toISOString().slice(2, 10)
	const name = prompt('{name}.json', 'links_' + d)
	if (!name) return;
	const ls = await db.getAll('links')
	log(`export ${ls.length} links`)
	saveJson(ls, name) // TODO 
}

async function upload() {
	const ls = await readJson()
	log(`import ${ls.length} links`)
	const progress = html.progress({ max: ls.length, value: 0, class: 'wide' })
	$('#tool').prepend(progress)
	for (const link of ls) {
		await db.add('links', link)
		progress.value += 1
	}
	progress.remove()
}

function diffCard(link, cl) {
	const c = card(link)
	if (Array.isArray(cl)) c.classList.add(...cl);
	else c.classList.add(cl);
	return c
}

async function diffUpload_localOnly() {
	const ls = await readJson()
	log(`remote ${ls.length} links`)
	const remotes = new Set(ls.map(l => l.url))
	const remoteNames = new Map(ls.map(l => [l.name, l])) // ! last key win !
	let localOnly = 0 // added on local OR removed on remote
	await db.each('links', local => {
		if (!remotes.has(local.url)) {
			localOnly++
			$cards.append(diffCard(local, 'local-only'))
			const sameName = remoteNames.get(local.name)
			if (sameName) $cards.append(card(sameName)) // TODO is remoteOnly / diff
		}
	})
	log(`local-only ${localOnly}`)
}

async function diffUpload_remoteOnly() {
	const ls = await readJson()
	log(`remote ${ls.length} links`)
	const progress = html.progress({ max: ls.length, value: 0, class: 'wide' })
	$('#tool').prepend(progress)
	let remoteOnly = new Map // removed on local OR added on remote
	for (const remote of ls) {
		const local = await db.get('links', remote.url)
		if (!local) {
			remoteOnly.set(remote.url, remote)
			$cards.append(card(remote))
		}
		progress.value += 1
	}
	progress.remove()
	log('remote-only', remoteOnly.size)

	document.body.append(html.button(async () => {
		for (const a of $$('a.select')) {
			const link = remoteOnly.get(a.href)
			if (!link) continue;
			await db.add('links', link)
			a.remove()
		}
	}, 'add selected'))
}

async function diffUpload_changs() {
	$perRow.value = 2
	$perRow.onchange()
	$perRow.disabled = true

	const ls = await readJson()
	log(`remote ${ls.length} links`)
	const remotes = new Map(ls.map(l => [l.url, l]))
	let same = 0, changed = 0
	await db.each('links', local => {
		const remote = remotes.get(local.url)
		if (!remote) return;
		if (JSON.stringify(local) === JSON.stringify(remote)) { // TODO
			same++
		} else {
			changed++
			appendDiff(local, remote)
		}
	})
	log(`same: ${same}, changed: ${changed}`)

	document.body.append(html.button(async () => {
		for (const a of $$('a.select')) {
			const remote = remotes.get(a.href)
			if (!remote) continue;
			await db.update('links', remote.url, { tags: remote.tags })
			a.previousElementSibling.remove()
			a.remove()
		}
	}, 'replace selected to remote .tags'))
}

function appendDiff(local, remote) {
	if (!$cards.lastElementChild.classList.contains('diff')) {
		$cards.append(html.p({ class: 'div' }))
	}
	const dt = diffTags(local.tags, remote.tags)
	const cardLocal = diffCard(local, 'diff')
	cardLocal.querySelector('.tags').replaceChildren(...local.tags.map(
		t => dt.rm.has(t) ? html.span({ class: 'red' }, t) : html.span(t)
	))
	const cardRemote = diffCard(remote, ['diff', 'remote'])
	cardRemote.querySelector('.tags').replaceChildren(...remote.tags.map(
		t => dt.add.has(t) ? html.span({ class: 'green' }, t) : html.span(t)
	))
	$cards.append(cardLocal, cardRemote)
}

async function modTags() {
	const add = new Set(selectedOptions($tagsInc))
	const rm = new Set(selectedOptions($tagsEx))
	for (const { href: url } of $$('a.select')) {
		const l = await db.get('links', url)
		if (!l) continue;
		const tags = subtractSet([...l.tags, ...add], rm)
		if (!tags.size) throw new Error('link must have at least one tag')
		const diff = diffTags(l.tags, tags)
		if (!diff.rm.size && !diff.add.size) continue;
		await db.update('links', url, { tags: [...tags] })
		log(
			url,
			html.br(),
			html.span({ class: 'red' }, [...diff.rm]),
			` ${[...diff.same]} `,
			html.span({ class: 'green' }, [...diff.add]),
		)
	}
}

function stringToTags(s) {
	return s
		.split(/,|\s/)
		.map(s => s.trim())
		.filter(Boolean)
}

function diffTags(old, current) {
	const o = new Set(old), c = new Set(current)
	return {
		rm: o.difference(c),
		add: c.difference(o),
		same: c.intersection(o),
	}
}

function subtractSet(set, subs) {
	const ss = new Set(set)
	for (const s of subs) ss.delete(s)
	return ss
}

async function duplicates(inc, exclude) {
	const all = await db.getAll('links')
	const ds = all.filter(l => l.url.includes('?')
		&& (!inc || l.url.includes(inc))
		&& (!exclude || !l.url.includes(exclude)))
	ds.forEach(l => {
		const url = l.url.slice(0, l.url.indexOf('?'))
		const o = all.find(ll => ll.url != l.url && ll.url.startsWith(url))
		if (o) ds.push(o)
	})
	ds.sort(({ url: a }, { url: b }) => a > b ? 1 : a < b ? -1 : 0)
	$cards.innerHTML = ''
	$cards.append(...ds.map(card))
}

async function pull(olds, addTags = []) {
	if (!Array.isArray(addTags)) addTags = []
	addTags.filter(Boolean)
	if (typeof olds == 'string') olds = JSON.parse(olds)
	if (!olds) return;
	const count = { all: olds.length, upTags: 0, upPrev: 0 }
	for (const o of olds) {
		const link = await db.get('links', o.url)
		if (!link) continue;
		if (addTags.some(t => !link.tags.includes(t))) {
			const tags = [...new Set([...link.tags, ...addTags])]
			await db.update('links', o.url, { tags })
			count.upTags++
		}
		if (!o.prev || link.prev == o.prev) continue;
		if (!link.prev) {
			await db.update('links', o.url, { prev: o.prev })
			count.upPrev++
		}
		const ls = await Promise.all([
			db.get('links', link.prev),
			link,
			db.get('links', o.prev),
			link,
		])
		$cards.append(ls.map(card), html.p({ class: 'div' }))
	}
	log('pull done ' + Object.entries(count).map(p => p.join(' ')))
}
