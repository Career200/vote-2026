import md from '../ballots.md?raw'
import './style.css'

type Position = 'for' | 'against' | 'abstain'
type Ballot = {
  n: number
  time: string
  sortKey: number
  position: Position
  flip: boolean
  text: string
  topic?: Topic
}
type Topic = { name: string; ballots: Ballot[] }
type BadLine = { lineNo: number; line: string }
type Part = { notes: string[]; ballots: Ballot[]; topics: Topic[] }

const LABEL: Record<Position, string> = { for: 'ЗА', against: 'ПРОТИВ', abstain: 'ВОЗДЕРЖ.' }
const COUNT_LABEL: Record<Position, string> = { for: 'за', against: 'против', abstain: 'возд.' }
const FLIPPED: Record<Position, Position> = { for: 'against', against: 'for', abstain: 'abstain' }

function parsePosition(s: string): Position | undefined {
  const p = s.toLowerCase()
  if (p === 'за' || p === 'for' || p === '+') return 'for'
  if (p === 'против' || p === 'against' || p === '-') return 'against'
  if (p.startsWith('возд') || p === 'abstain' || p === '0') return 'abstain'
}

// Splits off the text before the first "|", leaving the rest untouched.
function shift(s: string): [string, string] | null {
  const i = s.indexOf('|')
  return i === -1 ? null : [s.slice(0, i).trim(), s.slice(i + 1).trim()]
}

// "HH:mm | [!]position | text". Morning times count as after midnight.
function parseBallot(line: string): Ballot | null {
  const a = shift(line.replace(/^[-*]\s+(?=\d)/, ''))
  const time = a?.[0].match(/^(\d{1,2}):(\d{2})$/)
  if (!a || !time) return null
  const b = shift(a[1])
  if (!b || !b[1]) return null
  const flip = b[0].startsWith('!')
  const position = parsePosition(b[0].replace(/^!\s*/, ''))
  if (!position) return null
  const h = Number(time[1])
  const m = Number(time[2])
  if (h > 23 || m > 59) return null
  const sortKey = (h < 12 ? h + 24 : h) * 60 + m
  return { n: 0, time: `${String(h).padStart(2, '0')}:${time[2]}`, sortKey, position, flip, text: b[1] }
}

function parsePart(lines: string[], offset: number, errors: BadLine[]): Part {
  const part: Part = { notes: [], ballots: [], topics: [] }
  let topic: Topic | undefined

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('# ')) return
    if (line.startsWith('## ')) {
      topic = { name: line.slice(3).trim(), ballots: [] }
      part.topics.push(topic)
    } else if (line.startsWith('>')) {
      part.notes.push(line.replace(/^>\s*/, ''))
    } else {
      const ballot = parseBallot(line)
      if (!ballot) return errors.push({ lineNo: offset + i + 1, line })
      ballot.topic = topic
      topic?.ballots.push(ballot)
      part.ballots.push(ballot)
    }
  })

  part.ballots.sort((x, y) => x.sortKey - y.sortKey)
  part.ballots.forEach((b, i) => (b.n = i + 1))
  part.topics = part.topics
    .filter((t) => t.ballots.length >= 2)
    .sort((x, y) => y.ballots.length - x.ballots.length)
  return part
}

// Everything below a "---" line is example data.
function parse(src: string) {
  const lines = src.split(/\r?\n/)
  const title = lines.find((l) => l.trim().startsWith('# '))?.trim().slice(2).trim() || 'Хэллоуинский референдум'
  const errors: BadLine[] = []
  const cut = lines.findIndex((l) => l.trim() === '---')
  const real = parsePart(cut === -1 ? lines : lines.slice(0, cut), 0, errors)
  const example = cut === -1 ? null : parsePart(lines.slice(cut + 1), cut + 1, errors)
  return { title, real, example, errors }
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

function ballotsWord(n: number): string {
  const form = new Intl.PluralRules('ru').select(n)
  return form === 'one' ? 'бюллетень' : form === 'few' ? 'бюллетеня' : 'бюллетеней'
}

function renderTopic(t: Topic): HTMLElement {
  const counts: Record<Position, number> = { for: 0, against: 0, abstain: 0 }
  for (const b of t.ballots) counts[b.flip ? FLIPPED[b.position] : b.position]++

  const card = el('article', 'result')
  card.append(el('h3', '', t.name))

  const bar = el('div', 'bar')
  bar.setAttribute('aria-hidden', 'true')
  for (const p of ['for', 'against', 'abstain'] as const) {
    if (!counts[p]) continue
    const seg = el('span', p)
    seg.style.flexGrow = String(counts[p])
    bar.append(seg)
  }

  const line = el('p', 'counts')
  for (const p of ['for', 'against', 'abstain'] as const) {
    line.append(el('span', p, `${counts[p]} ${COUNT_LABEL[p]}`))
  }

  const nums = t.ballots.map((b) => b.n).sort((x, y) => x - y)
  card.append(bar, line, el('p', 'refs', `Бюллетени № ${nums.join(', ')}`))
  return card
}

function renderBallot(b: Ballot): HTMLElement {
  const item = el('li', 'ballot')
  const meta = el('div', 'meta')
  meta.append(el('span', 'num', `#${b.n} · ${b.time}`), el('span', `badge ${b.position}`, LABEL[b.position]))
  item.append(meta, el('p', 'text', b.text))
  // Only topics that made it into a results card get a tag.
  if (b.topic && b.topic.ballots.length >= 2) {
    const tag = b.flip ? `→ ${b.topic.name} (засчитан как «${COUNT_LABEL[FLIPPED[b.position]]}»)` : `→ ${b.topic.name}`
    item.append(el('p', 'tag', tag))
  }
  return item
}

function renderPart(p: Part, emptyText: string): HTMLElement[] {
  const out: HTMLElement[] = []
  for (const note of p.notes) out.push(el('p', 'note', note))

  if (p.topics.length) {
    const section = el('section', 'results')
    section.append(el('h2', '', 'Итоги по темам'), ...p.topics.map(renderTopic))
    out.push(section)
  }

  const feed = el('section', 'feed')
  feed.append(el('h2', '', 'Все бюллетени'))
  if (p.ballots.length) {
    const list = el('ol')
    list.append(...p.ballots.map(renderBallot))
    feed.append(list)
  } else {
    feed.append(el('p', 'empty', emptyText))
  }
  out.push(feed)
  return out
}

function render() {
  const { title, real, example, errors } = parse(md)
  document.title = title
  const app = document.getElementById('app')!

  const header = el('header')
  header.append(el('h1', '', `🎃 ${title}`))
  const total = el('p', 'total')
  total.append(el('strong', '', String(real.ballots.length)), ` ${ballotsWord(real.ballots.length)} в урне`)
  header.append(total)
  app.append(header, ...renderPart(real, 'Урна пока пуста — первые бюллетени появятся по ходу вечера.'))

  if (example) {
    const box = el('div', 'example')
    const divider = el('div', 'example-divider')
    divider.append(
      el('span', 'example-label', 'Пример'),
      el('p', '', 'Всё, что ниже, — пример оформления, а не настоящие голоса.'),
    )
    box.append(...renderPart(example, 'Пример пуст.'))
    app.append(divider, box)
  }

  if (errors.length) {
    const box = el('section', 'errors')
    box.append(el('h2', '', 'Не удалось прочитать строки'))
    const list = el('ul')
    list.append(...errors.map((e) => el('li', '', `строка ${e.lineNo}: ${e.line}`)))
    box.append(list)
    app.append(box)
  }
}

render()

// Open the page with ?tv to make it reload every minute (for a screen on the wall).
if (new URLSearchParams(location.search).has('tv')) {
  setTimeout(() => location.reload(), 60_000)
}
