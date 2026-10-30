import md from '../ballots.md?raw'
import './style.css'

type Position = 'for' | 'against' | 'abstain'
type Ballot = { n: number; time?: string; position: Position; text: string }
type Result = { topic: string; for: number; against: number; abstain: number }
type BadLine = { lineNo: number; line: string }

const POSITIONS: Record<string, Position> = {
  for: 'for', '+': 'for',
  against: 'against', '-': 'against',
  abstain: 'abstain', '0': 'abstain',
}

// Splits off the text before the first "|", leaving the rest untouched.
function shift(s: string): [string, string] | null {
  const i = s.indexOf('|')
  return i === -1 ? null : [s.slice(0, i).trim(), s.slice(i + 1).trim()]
}

function parseBallot(line: string, n: number): Ballot | null {
  let head = shift(line)
  if (!head) return null
  let time: string | undefined
  // Tolerate a Markdown bullet in front of the first field ("- for | ...").
  let first = head[0].replace(/^[-*]\s+(?=\S)/, '')
  if (/^\d{1,2}:\d{2}$/.test(first)) {
    time = first
    head = shift(head[1])
    if (!head) return null
    first = head[0]
  }
  const position = POSITIONS[first.toLowerCase()]
  const text = head[1]
  return position && text ? { n, time, position, text } : null
}

function parseResult(line: string): Result | null {
  const parts = line.replace(/^[-*]\s+/, '').split('|').map((p) => p.trim())
  if (parts.length < 4) return null
  const counts = parts.slice(-3)
  if (!counts.every((c) => /^\d+$/.test(c))) return null
  const topic = parts.slice(0, -3).join(' | ')
  if (!topic) return null
  const [f, a, ab] = counts.map(Number)
  return { topic, for: f, against: a, abstain: ab }
}

function parse(src: string) {
  let title = 'Halloween Referendum'
  let section = ''
  const ballots: Ballot[] = []
  const results: Result[] = []
  const errors: BadLine[] = []

  src.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    if (line.startsWith('## ')) section = line.slice(3).trim().toLowerCase()
    else if (line.startsWith('# ')) title = line.slice(2).trim()
    else if (section === 'ballots') {
      const b = parseBallot(line, ballots.length + 1)
      b ? ballots.push(b) : errors.push({ lineNo: i + 1, line })
    } else if (section === 'results') {
      const r = parseResult(line)
      r ? results.push(r) : errors.push({ lineNo: i + 1, line })
    } else errors.push({ lineNo: i + 1, line })
  })

  return { title, ballots, results, errors }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function renderResult(r: Result): HTMLElement {
  const total = r.for + r.against + r.abstain
  const card = el('article', 'result')
  card.append(el('h3', '', r.topic))

  const bar = el('div', 'bar')
  bar.setAttribute('aria-hidden', 'true')
  for (const p of ['for', 'against', 'abstain'] as const) {
    if (!r[p]) continue
    const seg = el('span', p)
    seg.style.flexGrow = String(r[p])
    bar.append(seg)
  }
  if (total) card.append(bar)

  const counts = el('p', 'counts')
  counts.append(
    el('span', 'for', `${r.for} for`),
    el('span', 'against', `${r.against} against`),
    el('span', 'abstain', `${r.abstain} abstain`),
  )
  card.append(counts)
  return card
}

function renderBallot(b: Ballot): HTMLElement {
  const item = el('li', 'ballot')
  const meta = el('div', 'meta')
  meta.append(el('span', 'num', b.time ? `#${b.n} · ${b.time}` : `#${b.n}`))
  meta.append(el('span', `badge ${b.position}`, b.position.toUpperCase()))
  item.append(meta, el('p', 'text', b.text))
  return item
}

function render() {
  const { title, ballots, results, errors } = parse(md)
  document.title = title
  const app = document.getElementById('app')!

  const header = el('header')
  header.append(el('h1', '', `🎃 ${title}`))
  const total = el('p', 'total')
  total.append(el('strong', '', String(ballots.length)), ` ballot${ballots.length === 1 ? '' : 's'} cast`)
  header.append(total)
  app.append(header)

  if (results.length) {
    const section = el('section', 'results')
    section.append(el('h2', '', 'Results'), ...results.map(renderResult))
    app.append(section)
  }

  const feed = el('section', 'feed')
  feed.append(el('h2', '', 'Every ballot'))
  if (ballots.length) {
    const list = el('ol')
    list.append(...ballots.map(renderBallot))
    feed.append(list)
  } else {
    feed.append(el('p', 'empty', 'The ballot box is still empty… for now.'))
  }
  app.append(feed)

  if (errors.length) {
    const box = el('section', 'errors')
    box.append(el('h2', '', "Couldn't read these lines"))
    const list = el('ul')
    list.append(...errors.map((e) => el('li', '', `line ${e.lineNo}: ${e.line}`)))
    box.append(list)
    app.append(box)
  }
}

render()

// Open the page with ?tv to make it reload every minute (for a screen on the wall).
if (new URLSearchParams(location.search).has('tv')) {
  setTimeout(() => location.reload(), 60_000)
}
