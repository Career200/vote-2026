import md from '../ballots.md?raw'
import qr from './qr.svg?raw'
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
type Topic = { name: string; num: number; ballots: Ballot[] }
type BadLine = { lineNo: number; line: string }
type Stat = [label: string, value: string]
type Part = { notes: string[]; spoiled: number; stats: Stat[]; ballots: Ballot[]; topics: Topic[] }

const VOTE: Record<Position, string> = { for: 'За', against: 'Против', abstain: 'Воздержался(-ась)' }
const TALLY: Record<Position, string> = { for: 'За', against: 'Против', abstain: 'Воздержались' }
const POSITION_ORDER = ['for', 'against', 'abstain'] as const

declare const __BUILD_TIME__: string
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
  const part: Part = { notes: [], spoiled: 0, stats: [], ballots: [], topics: [] }
  let topic: Topic | undefined

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('# ')) return
    if (line.startsWith('## ')) {
      topic = { name: line.slice(3).trim(), num: 0, ballots: [] }
      part.topics.push(topic)
    } else if (/^испорченн/i.test(line)) {
      // "Испорченные бюллетени: 4"
      const count = line.match(/[:|]\s*(\d+)$/)
      if (!count) return errors.push({ lineNo: offset + i + 1, line })
      part.spoiled = Number(count[1])
    } else if (line.startsWith('%')) {
      // "% Label | value": a statistics line entered by hand
      const stat = shift(line.slice(1))
      if (!stat || !stat[0] || !stat[1]) return errors.push({ lineNo: offset + i + 1, line })
      part.stats.push([stat[0], stat[1]])
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
  part.topics.forEach((t, i) => (t.num = i + 1))
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

// Static markup only; never used with ballot text.
function svg(markup: string): HTMLElement {
  const wrap = el('div')
  wrap.innerHTML = markup
  return wrap.firstElementChild as HTMLElement
}

const SEAL = `<svg class="seal" viewBox="0 0 120 120" aria-hidden="true">
  <defs><path id="ring" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
  <circle cx="60" cy="60" r="56" /><circle cx="60" cy="60" r="34" />
  <text><textPath href="#ring" startOffset="0">АСТРАЛЬНАЯ ИЗБИРАТЕЛЬНАЯ КОМИССИЯ • УЧАСТОК № 31 •</textPath></text>
  <text class="seal-mark" x="60" y="70" text-anchor="middle">☾✦</text>
</svg>`

const SKY = `<svg class="sky" viewBox="0 0 400 160" aria-hidden="true">
  <path d="M330 30a42 42 0 1 0 38 62a34 34 0 1 1 -38 -62z" />
  <g class="stars"><circle cx="40" cy="40" r="2.2"/><circle cx="85" cy="22" r="1.6"/><circle cx="120" cy="58" r="2"/>
  <circle cx="170" cy="30" r="1.4"/><circle cx="215" cy="70" r="2.4"/><circle cx="260" cy="38" r="1.6"/></g>
  <polyline points="40,40 85,22 120,58 170,30 215,70 260,38" />
</svg>`

const SPECIMEN = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="200"><text x="130" y="110" text-anchor="middle" transform="rotate(-30 130 100)" font-family="PT Serif, serif" font-size="40" font-weight="700" letter-spacing="6" fill="rgba(60,60,80,0.09)">ОБРАЗЕЦ</text></svg>`

function ballotsWord(n: number): string {
  const form = new Intl.PluralRules('ru').select(n)
  return form === 'one' ? 'бюллетень' : form === 'few' ? 'бюллетеня' : 'бюллетеней'
}

function protocolLine(no: number, label: string, value: number | string): HTMLElement {
  const li = el('li')
  li.append(el('span', 'label', `${no}. ${label}`), el('span', 'dots'), el('strong', '', String(value)))
  return li
}

function renderQuestion(t: Topic): HTMLElement {
  const counts: Record<Position, number> = { for: 0, against: 0, abstain: 0 }
  for (const b of t.ballots) counts[b.flip ? FLIPPED[b.position] : b.position]++
  const total = t.ballots.length

  const card = el('article', 'question')
  const h = el('h3')
  h.append(el('span', 'qnum', `Вопрос № ${t.num}.`), ` ${t.name}`)
  card.append(h)

  const table = el('table', 'tally')
  for (const p of POSITION_ORDER) {
    const row = el('tr', p)
    row.append(
      el('th', '', TALLY[p]),
      el('td', '', String(counts[p])),
      el('td', 'pct', `${Math.round((counts[p] / total) * 100)} %`),
    )
    table.append(row)
  }

  const bar = el('div', 'bar')
  bar.setAttribute('aria-hidden', 'true')
  for (const p of POSITION_ORDER) {
    if (!counts[p]) continue
    const seg = el('span', p)
    seg.style.flexGrow = String(counts[p])
    bar.append(seg)
  }

  // Accepted when "for" is more than half of all votes on the question, abstentions included.
  const accepted = counts.for * 2 > total
  const verdict = el('div', 'verdict')
  verdict.append(el('span', 'stamp', accepted ? 'Решение принято' : 'Решение не принято'))
  if (accepted) verdict.append(el('span', 'verdict-note', 'подлежит исполнению во всех планах бытия'))

  const nums = t.ballots.map((b) => b.n).sort((x, y) => x - y)
  card.append(table, bar, verdict, el('p', 'refs', `Бюллетени № ${nums.join(', ')}`))
  return card
}

function renderBallot(b: Ballot): HTMLElement {
  const item = el('li', 'ballot')
  const meta = el('div', 'meta')
  meta.append(el('span', 'num', `Бюллетень № ${b.n}`), el('span', 'time', b.time), el('span', `vote ${b.position}`, VOTE[b.position]))
  item.append(meta, el('p', 'text', b.text))
  // Only topics that made it into a question card get a reference.
  if (b.topic && b.topic.num) {
    const ref = b.flip
      ? `→ Вопрос № ${b.topic.num} (учтён как «${TALLY[FLIPPED[b.position]]}»)`
      : `→ Вопрос № ${b.topic.num}`
    item.append(el('p', 'tag', ref))
  }
  return item
}

function isShouted(text: string): boolean {
  const letters = text.match(/\p{L}/gu) ?? []
  const upper = letters.filter((c) => c !== c.toLowerCase())
  return letters.length >= 3 && upper.length > letters.length * 0.6
}

// Computed lines first, hand-entered "%" lines from ballots.md after the hearts line.
function renderStats(p: Part): HTMLElement {
  const total = p.ballots.length
  const forCount = p.ballots.filter((b) => b.position === 'for').length
  const top = p.topics[0]
  const shortest = p.ballots.reduce((a, b) => ([...b.text].length < [...a.text].length ? b : a))
  const lines: Stat[] = [
    ['Доля голосов «За»', `${Math.round((forCount / total) * 100)}\u00a0% (${forCount} из ${total})`],
    ...(top ? [[`Вопрос, собравший наибольшее число бюллетеней: «${top.name}»`, String(top.ballots.length)] as Stat] : []),
    ['Число вопросов, поставленных в единственном экземпляре', String(p.ballots.filter((b) => !b.topic?.num).length)],
    ['Число бюллетеней, заполненных заглавными буквами', String(p.ballots.filter((b) => isShouted(b.text)).length)],
    ['Число бюллетеней с графическими знаками симпатии (♡)', String(p.ballots.filter((b) => /♡|❤|<3/.test(b.text)).length)],
    ...p.stats,
    ['Самый краткий бюллетень', `«${shortest.text}»`],
    ['Число восклицательных знаков', String(p.ballots.reduce((n, b) => n + (b.text.match(/!/g)?.length ?? 0), 0))],
  ]
  const section = el('section', 'stats')
  const list = el('ol', 'protocol')
  list.append(...lines.map(([label, value], i) => protocolLine(i + 1, label, value)))
  section.append(el('h2', '', 'Статистические сведения'), list)
  return section
}

function renderPart(p: Part, emptyText: string): HTMLElement[] {
  const protocol = el('ol', 'protocol')
  protocol.append(
    protocolLine(1, 'Число бюллетеней, извлечённых из переносного ящика для голосования', p.ballots.length),
  )
  if (p.spoiled) protocol.append(protocolLine(2, 'Число испорченных бюллетеней', p.spoiled))
  protocol.append(protocolLine(p.spoiled ? 3 : 2, 'Число вопросов, по которым подведены итоги', p.topics.length))
  const out: HTMLElement[] = [protocol]

  if (p.topics.length) {
    const section = el('section', 'questions')
    section.append(el('h2', '', 'Итоги волеизъявления по вопросам'), ...p.topics.map(renderQuestion))
    out.push(section)
  }
  if (p.ballots.length) out.push(renderStats(p))

  const registry = el('section', 'registry')
  registry.append(el('h2', '', 'Реестр бюллетеней'))
  if (p.ballots.length) {
    const list = el('ol')
    list.append(...p.ballots.map(renderBallot))
    registry.append(list)
  } else {
    registry.append(el('p', 'empty', emptyText))
  }
  out.push(registry)
  return out
}

function renderFooter(): HTMLElement {
  const footer = el('footer', 'signatures')
  const lines = el('div', 'sign-lines')
  const chair = el('p')
  chair.append(el('span', '', 'Председатель комиссии'), el('span', 'sign'))
  const spirit = el('p')
  spirit.append(el('span', '', 'Дух выборов'), el('span', 'sign'))
  lines.append(chair, spirit, el('p', 'sign-note', '(подпись, при наличии телесной оболочки)'))
  const seal = el('div', 'seal-box')
  seal.append(el('span', 'mp', 'М.П.'), svg(SEAL))
  footer.append(lines, seal)
  return footer
}

// "> text" lines form the notice; a "> ! text" line becomes a stamp under it.
function renderNotice(notes: string[]): HTMLElement {
  const box = el('section', 'notice')
  box.append(el('p', 'notice-title', 'Информационное сообщение'))
  const stamps = el('div', 'notice-stamps')
  for (const note of notes) {
    if (note.startsWith('!')) stamps.append(el('span', 'stamp', note.slice(1).trim()))
    else box.append(el('p', '', note))
  }
  if (stamps.childElementCount) box.append(stamps)
  return box
}

function renderQr(): HTMLElement {
  const box = el('div', 'qr')
  const caption = el('p', 'qr-caption', 'Адрес публикации итогов')
  caption.append(el('small', '', 'career200.github.io/vote-2026'))
  box.append(svg(qr), caption)
  return box
}

function render() {
  const { title, real, example, errors } = parse(md)
  document.title = title
  const app = document.getElementById('app')!

  const header = el('header')
  header.append(
    svg(SKY),
    el('p', 'commission', 'Астральная избирательная комиссия'),
    el('p', 'precinct', 'Участок № 31 «Канун Дня всех святых»'),
    el('h1', '', title),
    el('p', 'doc-type', 'Протокол'),
    el('p', 'doc-sub', 'об итогах волеизъявления'),
  )
  const asOf = new Date(__BUILD_TIME__).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
  app.append(header, el('p', 'as-of', `Сведения по состоянию на ${asOf} (по земному времени)`))

  if (real.notes.length) app.append(renderNotice(real.notes))
  app.append(...renderPart(real, 'Переносной ящик для голосования пока пуст.'), renderFooter(), renderQr())

  if (example) {
    const divider = el('div', 'example-divider')
    divider.append(
      el('p', 'example-label', 'Образец'),
      el('p', '', 'Данные не являются результатами волеизъявления и носят иллюстративный характер.'),
    )
    const box = el('div', 'example')
    box.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(SPECIMEN)}")`
    box.append(...renderPart(example, 'Образец пуст.'))
    app.append(divider, box)
  }

  if (errors.length) {
    const box = el('section', 'errors')
    box.append(el('h2', '', 'Строки, не принятые к учёту (не поддаются прочтению)'))
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
