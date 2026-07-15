import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import {
  type ExtractedBullet,
  hashBullet,
  labelAdd,
  labelRemove,
  listStoreRows,
  normalize,
  type ScopedRow,
  type StoreRow,
  setMetadata,
  storeBulletsForCompany,
} from '../lib/bullets'

const AGENT_BASE = 'http://127.0.0.1:31337'
const AGENT_TOKEN = 'dev-agent-token'
// Card URLs are RELATIVE by default so the client opens them on whatever origin
// its PWA already loaded from (reachable by definition — no tailnet assumption).
// Set CARD_HOST to force an absolute host prefix (e.g. a stable public URL).
// See robots-zbh: hardcoding a Tailscale IP here 404s the phone when off-tailnet.
const CARD_HOST = process.env.CARD_HOST?.replace(/\/$/, '') ?? ''
const MARKER = 'BULLET REVIEW'
const APPROVED_LABEL = 'review:approved'
const REJECTED_LABEL = 'review:rejected'
const PENDING_LABEL = 'review:pending'

const DIM = '\x1b[2m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

interface CardBullet {
  id: string
  text: string
  hash: string
  sourceFile: string
}

interface ReviewSubmission {
  approved: Array<{ id: string; hash: string }>
  rejected: Array<{ id: string; hash: string }>
  edits: Array<{ id: string; hash: string; text: string }>
}

function chatIdFor(company: string): string {
  return `bullet-review-${company}`
}

function pageDir(company: string): string {
  return path.join(homedir(), 'pulse-pages', `bullet-review-${company}`)
}

async function agentCall(method: string, endpoint: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${AGENT_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${AGENT_TOKEN}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const parsed: unknown = text ? safeJson(text) : null
  if (!res.ok) {
    const detail =
      parsed && typeof parsed === 'object' && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : text
    throw new Error(`${method} ${endpoint} → ${res.status}: ${detail}`)
  }
  return parsed
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderPage(company: string, chatId: string, bullets: CardBullet[]): string {
  const data = JSON.stringify(
    bullets.map((b) => ({ id: b.id, text: b.text, hash: b.hash, src: b.sourceFile })),
  )
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bullet Review — ${escapeHtml(company)}</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font: 16px/1.5 -apple-system, system-ui, sans-serif; background: #111318; color: #e8eaf0; padding: 16px 14px 150px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .sub { color: #9aa1b0; font-size: 13px; margin-bottom: 12px; }
  .note { background: #1b2436; border-left: 3px solid #4a7dff; border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-bottom: 14px; color: #c8d2e8; }
  .listenAll { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px; border: 1px solid #4a7dff; border-radius: 12px; background: #14203a; color: #bcd0ff; font-size: 15px; font-weight: 600; margin-bottom: 18px; cursor: pointer; }
  .listenAll.on { border-color: #8fb4ff; background: #1b2c4d; }
  .b { background: #191c24; border: 1px solid #262a36; border-radius: 12px; padding: 14px; margin-bottom: 14px; transition: border-color .15s, box-shadow .15s; }
  .b.approved { border-color: #2ea36b; }
  .b.rejected { border-color: #d95c5c; }
  .b.editing { border-color: #d9a53a; }
  .b.current { border-color: #8fb4ff; box-shadow: 0 0 0 2px rgba(74,125,255,0.25); }
  .bid { display: inline-block; background: #262a36; color: #9aa1b0; font-size: 11px; font-weight: 700; border-radius: 6px; padding: 2px 7px; margin-bottom: 6px; }
  .src { display: inline-block; background: #14202b; color: #7fb7d9; font-size: 10.5px; border-radius: 6px; padding: 2px 7px; margin-bottom: 6px; margin-left: 6px; }
  .playrow { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
  .play { flex: 0 0 auto; width: 42px; height: 42px; border-radius: 50%; border: 1px solid #3a5aa8; background: #16203a; color: #9fc0ff; font-size: 16px; line-height: 40px; text-align: center; cursor: pointer; user-select: none; padding: 0; -webkit-tap-highlight-color: transparent; }
  .play:active { transform: scale(0.94); }
  .play.on { border-color: #8fb4ff; background: #24365e; color: #dbe6ff; }
  .play.loading { color: #6d7a95; }
  .bt { font-size: 14.5px; color: #dbe0ea; align-self: center; }
  .row { display: flex; gap: 8px; }
  .opt { flex: 1; text-align: center; padding: 9px 4px; border-radius: 9px; border: 1px solid #303542; background: #1e222c; color: #c6cbd6; font-size: 13.5px; cursor: pointer; user-select: none; }
  .opt.sel-approve { background: #173527; border-color: #2ea36b; color: #8fe0b4; font-weight: 600; }
  .opt.sel-reject { background: #351717; border-color: #d95c5c; color: #e79a9a; font-weight: 600; }
  .opt.sel-edit { background: #3a2d13; border-color: #d9a53a; color: #ecc06a; font-weight: 600; }
  textarea { display: none; width: 100%; margin-top: 10px; background: #14161c; color: #e8eaf0; border: 1px solid #d9a53a; border-radius: 9px; padding: 10px; font: 14px/1.4 inherit; min-height: 72px; }
  .b.editing textarea { display: block; }
  .bar { position: fixed; bottom: 0; left: 0; right: 0; background: #191c24; border-top: 1px solid #262a36; padding: 12px 14px calc(12px + env(safe-area-inset-bottom)); }
  .counts { font-size: 12.5px; color: #9aa1b0; margin-bottom: 8px; }
  button.bulk { width: 100%; padding: 10px; border: 1px solid #2ea36b; border-radius: 10px; background: #14201a; color: #8fe0b4; font-size: 13.5px; font-weight: 600; margin-bottom: 8px; }
  button.send { width: 100%; padding: 13px; border: 0; border-radius: 11px; background: #4a7dff; color: #fff; font-size: 16px; font-weight: 700; }
  button.send:disabled { background: #2c3243; color: #778; }
  .ok { color: #6fd39c; }
</style>
</head>
<body>
<h1>Bullet Review — ${escapeHtml(company)}</h1>
<p class="sub" id="sub"></p>
<div class="note">Tap <b>▶</b> on any bullet to hear it read aloud, or <b>Listen to all</b> to walk the whole set hands-free. Then mark each — <b>Approve</b>, <b>Reject</b>, or <b>✎ Edit</b>. Unmarked bullets are left out of this submission.</div>
<div class="listenAll" id="listenAll"><span id="listenAllIcon">▶</span><span id="listenAllLabel">Listen to all</span></div>
<div id="bs"></div>

<div class="bar">
  <div class="counts" id="counts">0 approved · 0 rejected · 0 edited · 0 unmarked</div>
  <button class="bulk" id="approveAll">Approve all remaining unmarked</button>
  <button class="send" id="send">Send review to agent</button>
</div>

<script>
const CHAT_ID = ${JSON.stringify(chatId)}
const COMPANY = ${JSON.stringify(company)}
const MARKER = ${JSON.stringify(MARKER)}
const BULLETS = ${data}
const newMessageId = () =>
  window.crypto?.randomUUID?.() ??
  "m-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
const state = {}
const bs = document.getElementById("bs")
document.getElementById("sub").textContent = BULLETS.length + " bullet" + (BULLETS.length === 1 ? "" : "s") + " to review"
const textById = {}
for (const b of BULLETS) {
  textById[b.id] = b.text
  state[b.id] = { mode: "none", text: "" }
  const el = document.createElement("div")
  el.className = "b"
  el.id = "b-" + b.id
  el.innerHTML =
    '<span class="bid">' + b.id + '</span>' +
    '<span class="src">' + b.src + '</span>' +
    '<div class="playrow">' +
    '<button class="play" data-b="' + b.id + '" aria-label="Play bullet">▶</button>' +
    '<div class="bt">' + b.text.replace(/</g, "&lt;") + '</div>' +
    '</div>' +
    '<div class="row">' +
    '<div class="opt" data-b="' + b.id + '" data-m="approve">✓ Approve</div>' +
    '<div class="opt" data-b="' + b.id + '" data-m="edit">✎ Edit</div>' +
    '<div class="opt" data-b="' + b.id + '" data-m="reject">✕ Reject</div>' +
    '</div>' +
    '<textarea placeholder="Edited text…">' + b.text.replace(/</g, "&lt;") + '</textarea>'
  bs.appendChild(el)
}

// ── Audio: Parlay-style TTS (POST /api/chat/tts → audio/wav, RIFF-sniff, fallback) ──
const audioEl = new Audio()
let curId = null
let curUrl = null
let playAllOn = false
function setPlayUI(id, on, loading) {
  const card = document.getElementById("b-" + id)
  if (!card) return
  const btn = card.querySelector(".play")
  if (btn) {
    btn.textContent = loading ? "…" : (on ? "⏸" : "▶")
    btn.className = "play" + (on ? " on" : "") + (loading ? " loading" : "")
  }
  card.classList.toggle("current", !!on || !!loading)
}
function stopAudio() {
  try { audioEl.pause() } catch (e) {}
  try { window.speechSynthesis.cancel() } catch (e) {}
  if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = null }
  if (curId) { setPlayUI(curId, false, false); curId = null }
}
function speakFallback(text) {
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.05
      u.onend = resolve
      u.onerror = resolve
      window.speechSynthesis.speak(u)
    } catch (e) { resolve() }
  })
}
function playText(id, text) {
  return new Promise((resolve) => {
    stopAudio()
    curId = id
    setPlayUI(id, false, true)
    fetch("/api/chat/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: text }),
    })
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const bytes = new Uint8Array(buf)
        const isRiff = bytes.length > 4 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70
        if (!isRiff) {
          setPlayUI(id, true, false)
          speakFallback(text).then(() => { setPlayUI(id, false, false); if (curId === id) curId = null; resolve() })
          return
        }
        curUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }))
        audioEl.src = curUrl
        setPlayUI(id, true, false)
        audioEl.onended = () => { setPlayUI(id, false, false); if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = null } if (curId === id) curId = null; resolve() }
        audioEl.onerror = () => { setPlayUI(id, false, false); resolve() }
        audioEl.play().catch(() => { setPlayUI(id, false, false); resolve() })
      })
      .catch(() => {
        setPlayUI(id, true, false)
        speakFallback(text).then(() => { setPlayUI(id, false, false); if (curId === id) curId = null; resolve() })
      })
  })
}
function setAllUI(on) {
  const box = document.getElementById("listenAll")
  document.getElementById("listenAllIcon").textContent = on ? "⏹" : "▶"
  document.getElementById("listenAllLabel").textContent = on ? "Stop" : "Listen to all"
  box.className = "listenAll" + (on ? " on" : "")
}
async function playAll() {
  if (playAllOn) { playAllOn = false; stopAudio(); setAllUI(false); return }
  playAllOn = true
  setAllUI(true)
  for (let i = 0; i < BULLETS.length; i++) {
    if (!playAllOn) break
    const b = BULLETS[i]
    const card = document.getElementById("b-" + b.id)
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" })
    await playText(b.id, b.text)
    if (!playAllOn) break
    await new Promise((res) => setTimeout(res, 350))
  }
  playAllOn = false
  setAllUI(false)
}
document.getElementById("listenAll").addEventListener("click", playAll)

function applyMode(id, mode) {
  state[id].mode = mode
  const card = document.getElementById("b-" + id)
  card.classList.toggle("editing", mode === "edit")
  card.classList.toggle("approved", mode === "approve")
  card.classList.toggle("rejected", mode === "reject")
  const cls = { approve: "sel-approve", edit: "sel-edit", reject: "sel-reject" }
  for (const o of card.querySelectorAll(".opt")) {
    o.className = "opt" + (o.dataset.m === mode ? " " + cls[mode] : "")
  }
  if (mode === "edit") {
    const ta = card.querySelector("textarea")
    if (!state[id].text) state[id].text = ta.value
    ta.focus()
  }
  refresh()
}
document.addEventListener("click", (e) => {
  const play = e.target.closest(".play")
  if (play) {
    const id = play.dataset.b
    if (playAllOn) { playAllOn = false; setAllUI(false) }
    if (curId === id) { stopAudio() } else { playText(id, textById[id]) }
    return
  }
  const opt = e.target.closest(".opt")
  if (!opt) return
  applyMode(opt.dataset.b, opt.dataset.m)
})
document.addEventListener("input", (e) => {
  if (e.target.tagName !== "TEXTAREA") return
  const id = e.target.closest(".b").id.slice(2)
  state[id].text = e.target.value
})
document.getElementById("approveAll").addEventListener("click", () => {
  for (const b of BULLETS) if (state[b.id].mode === "none") applyMode(b.id, "approve")
})
function tally() {
  let a = 0, r = 0, ed = 0, none = 0
  for (const s of Object.values(state)) {
    if (s.mode === "approve") a++
    else if (s.mode === "reject") r++
    else if (s.mode === "edit") ed++
    else none++
  }
  return { a, r, ed, none }
}
function refresh() {
  const t = tally()
  document.getElementById("counts").textContent =
    t.a + " approved · " + t.r + " rejected · " + t.ed + " edited · " + t.none + " unmarked"
}
refresh()
document.getElementById("send").addEventListener("click", async () => {
  const btn = document.getElementById("send")
  btn.disabled = true
  btn.textContent = "Sending…"
  const payload = { approved: [], rejected: [], edits: [] }
  for (const b of BULLETS) {
    const s = state[b.id]
    if (s.mode === "approve") payload.approved.push({ id: b.id, hash: b.hash })
    else if (s.mode === "reject") payload.rejected.push({ id: b.id, hash: b.hash })
    else if (s.mode === "edit") payload.edits.push({ id: b.id, hash: b.hash, text: (s.text || "").trim() })
  }
  const body = MARKER + " " + COMPANY + "\\n" + JSON.stringify(payload)
  try {
    const res = await fetch("/chats/" + CHAT_ID + "/messages", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer test-token" },
      body: JSON.stringify({ clientMessageId: newMessageId(), kind: "text", body }),
    })
    if (!res.ok) throw new Error("HTTP " + res.status)
    btn.textContent = "✓ Sent — run cvgen bullets ratify"
    btn.className = "send ok"
  } catch (err) {
    btn.disabled = false
    btn.textContent = "Failed (" + err.message + ") — tap to retry"
  }
})
</script>
</body>
</html>
`
}

async function reviewCompany(company: string): Promise<number> {
  let scoped: ScopedRow[]
  let drift: ExtractedBullet[]
  try {
    ;({ scoped, drift } = storeBulletsForCompany(company))
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    return 2
  }
  if (drift.length > 0) {
    console.log(
      `${YELLOW}library↔store drift${RESET} — ${drift.length} bullet(s) with no store row:`,
    )
    for (const b of drift) console.log(`  ${b.text.slice(0, 80)}`)
  }
  if (scoped.length === 0) {
    console.log(`no store-backed bullets found for ${company}`)
    return drift.length > 0 ? 1 : 0
  }
  const pending = scoped.filter((s) => !s.row.labels.includes(APPROVED_LABEL))
  if (pending.length === 0) {
    console.log(`all ${scoped.length} bullets already approved for ${company} — nothing to review`)
    return 0
  }
  const cards: CardBullet[] = pending.map((s) => ({
    id: s.row.id,
    text: normalize(s.row.title),
    hash: s.hash,
    sourceFile: s.sourceFile,
  }))
  const chatId = chatIdFor(company)
  const dir = pageDir(company)
  mkdirSync(dir, { recursive: true })
  const pageFile = path.join(dir, 'index.html')
  writeFileSync(pageFile, renderPage(company, chatId, cards), 'utf-8')

  await agentCall('POST', '/agent/chats', {
    id: chatId,
    title: `Bullet review — ${company}`,
  })
  const epoch = Date.now()
  const cardUrl = `${CARD_HOST}/bullet-review-${company}/?v=${epoch}`
  await agentCall('POST', '/agent/cards', {
    id: `bullet-review-${company}`,
    url: cardUrl,
    title: `Bullet review — ${company} (${cards.length})`,
  })

  console.log(`${GREEN}bullet review ready${RESET}`)
  console.log(`  chatId   ${chatId}`)
  console.log(`  card     ${cardUrl}`)
  console.log(
    `  bullets  ${cards.length} pending (${scoped.length} total, ${scoped.length - cards.length} already approved)`,
  )
  console.log(`  page     ${pageFile}`)
  return 0
}

function parseSubmission(body: string): { company: string; submission: ReviewSubmission } | null {
  if (!body.startsWith(MARKER)) return null
  const newline = body.indexOf('\n')
  if (newline === -1) return null
  const header = body.slice(0, newline).trim()
  const company = header.slice(MARKER.length).trim()
  const json = body.slice(newline + 1).trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  if (parsed === null || typeof parsed !== 'object') return null
  const p = parsed as Record<string, unknown>
  const submission: ReviewSubmission = {
    approved: coerceEntries(p.approved),
    rejected: coerceEntries(p.rejected),
    edits: coerceEdits(p.edits),
  }
  return { company, submission }
}

function coerceEntries(value: unknown): Array<{ id: string; hash: string }> {
  if (!Array.isArray(value)) return []
  const out: Array<{ id: string; hash: string }> = []
  for (const raw of value) {
    const id = (raw as { id?: unknown })?.id
    const hash = (raw as { hash?: unknown })?.hash
    if (typeof id === 'string' && typeof hash === 'string') out.push({ id, hash })
  }
  return out
}

function coerceEdits(value: unknown): Array<{ id: string; hash: string; text: string }> {
  if (!Array.isArray(value)) return []
  const out: Array<{ id: string; hash: string; text: string }> = []
  for (const raw of value) {
    const id = (raw as { id?: unknown })?.id
    const hash = (raw as { hash?: unknown })?.hash
    const text = (raw as { text?: unknown })?.text
    if (typeof id === 'string' && typeof hash === 'string' && typeof text === 'string') {
      out.push({ id, hash, text })
    }
  }
  return out
}

interface StoreMessage {
  id: string
  role: string
  body: string
}

async function fetchMessages(chatId: string): Promise<StoreMessage[]> {
  const res = await fetch(`${AGENT_BASE}/chats/${encodeURIComponent(chatId)}/messages`, {
    headers: { Authorization: 'Bearer test-token' },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`GET /chats/${chatId}/messages → ${res.status}: ${text}`)
  }
  const parsed = safeJson(text)
  const messages = (parsed as { messages?: unknown })?.messages
  if (!Array.isArray(messages)) return []
  return messages.map((m) => ({
    id: String((m as { id?: unknown }).id ?? ''),
    role: String((m as { role?: unknown }).role ?? ''),
    body: String((m as { body?: unknown }).body ?? ''),
  }))
}

function buildHashIndex(rows: StoreRow[]): Map<string, StoreRow[]> {
  const index = new Map<string, StoreRow[]>()
  for (const row of rows) {
    for (const field of [row.title, row.description]) {
      if (field.trim().length === 0) continue
      const hash = hashBullet(field)
      const bucket = index.get(hash) ?? []
      bucket.push(row)
      index.set(hash, bucket)
    }
  }
  return index
}

async function ratifyChat(chatId: string): Promise<number> {
  let messages: StoreMessage[]
  try {
    messages = await fetchMessages(chatId)
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    return 2
  }
  let parsed: { company: string; submission: ReviewSubmission } | null = null
  for (const message of [...messages].reverse()) {
    if (message.role !== 'user') continue
    const candidate = parseSubmission(message.body)
    if (candidate) {
      parsed = candidate
      break
    }
  }
  if (!parsed) {
    console.error(`no message matching '${MARKER} <company>' grammar found in ${chatId}`)
    return 2
  }

  const { company, submission } = parsed
  const rows = listStoreRows()
  const index = buildHashIndex(rows)
  const byId = new Map(rows.map((r) => [r.id, r]))
  const nowIso = new Date().toISOString()

  let matched = 0
  let patched = 0
  let rejected = 0
  let drifted = 0
  const drift: string[] = []

  const uniqueRow = (entry: { id: string; hash: string }): StoreRow | null => {
    const direct = byId.get(entry.id)
    if (direct) {
      const hashes = [direct.title, direct.description]
        .filter((f) => f.trim().length > 0)
        .map(hashBullet)
      if (hashes.includes(entry.hash)) return direct
      return null
    }
    const bucket = index.get(entry.hash)
    return bucket && bucket.length > 0 ? bucket[0] : null
  }

  console.log(`ratifying ${chatId} (company: ${company})`)

  for (const entry of submission.approved) {
    const row = uniqueRow(entry)
    if (!row) {
      drifted++
      drift.push(`${entry.id} approved hash=${entry.hash.slice(0, 12)}… (no store row)`)
      continue
    }
    matched++
    if (!row.labels.includes(APPROVED_LABEL)) labelAdd(row.id, APPROVED_LABEL)
    if (row.labels.includes(PENDING_LABEL)) labelRemove(row.id, PENDING_LABEL)
    if (row.labels.includes(REJECTED_LABEL)) labelRemove(row.id, REJECTED_LABEL)
    setMetadata(row.id, {
      review_hash: entry.hash,
      reviewed_at: nowIso,
      reviewed_via: 'forefront-card',
      review_evidence: chatId,
    })
    patched++
    console.log(`  ${GREEN}approved${RESET}  ${entry.id} → ${row.id}`)
  }

  for (const entry of submission.rejected) {
    const row = uniqueRow(entry)
    if (!row) {
      drifted++
      drift.push(`${entry.id} rejected hash=${entry.hash.slice(0, 12)}… (no store row)`)
      continue
    }
    matched++
    if (!row.labels.includes(REJECTED_LABEL)) labelAdd(row.id, REJECTED_LABEL)
    if (row.labels.includes(APPROVED_LABEL)) labelRemove(row.id, APPROVED_LABEL)
    if (row.labels.includes(PENDING_LABEL)) labelRemove(row.id, PENDING_LABEL)
    rejected++
    console.log(`  ${RED}rejected${RESET}  ${entry.id} → ${row.id}`)
  }

  for (const entry of submission.edits) {
    const row = uniqueRow(entry)
    const target = row ? row.id : '(no matched row)'
    console.log(
      `  ${YELLOW}edit proposed${RESET}  ${entry.id} → ${target}: "${normalize(entry.text)}" ${DIM}(not applied — report only)${RESET}`,
    )
  }

  if (drift.length > 0) {
    console.log(`${RED}library↔store drift${RESET} — ${drift.length} hash(es) with no store row:`)
    for (const line of drift) console.log(`  ${line}`)
  }

  console.log(
    `${DIM}summary${RESET} matched=${matched} patched=${patched} rejected=${rejected} edits=${submission.edits.length} drifted=${drifted}`,
  )
  return 0
}

export async function runBullets(args: string[]): Promise<number> {
  const [sub, ...rest] = args
  if (sub === 'review') {
    const company = rest.find((a) => !a.startsWith('--'))
    if (!company) {
      console.error('usage: cvgen bullets review <company>')
      return 2
    }
    return reviewCompany(company)
  }
  if (sub === 'ratify') {
    const chatId = rest.find((a) => !a.startsWith('--'))
    if (!chatId) {
      console.error('usage: cvgen bullets ratify <chatId>')
      return 2
    }
    return ratifyChat(chatId)
  }
  console.error('usage: cvgen bullets <review|ratify> <arg>')
  return 2
}
