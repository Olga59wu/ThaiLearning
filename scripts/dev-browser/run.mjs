// 用 Chrome DevTools Protocol 操作 headless Chrome（開發時自己檢查畫面用，見 CLAUDE.md「用瀏覽器檢查畫面」）
// 用法：node scripts/dev-browser/run.mjs <步驟檔.mjs> <輸出資料夾>
// Chrome 要先在 bash 用 `(chrome ... --remote-debugging-port=9333 ... &)` 啟動（從 Node spawn 起不來）
// 步驟檔 export default 陣列，每一步可用：
//   { viewport: [寬, 高, 縮放] }  { goto: 網址, waitAfter: 毫秒 }  { eval: 程式碼（可 return） }
//   { log: 運算式, label }  { wait: 毫秒 }  { shot: 檔名.png }
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const [stepsFile, outDir] = process.argv.slice(2)
if (!stepsFile || !outDir) {
  console.error('用法：node scripts/dev-browser/run.mjs <步驟檔.mjs> <輸出資料夾>')
  process.exit(1)
}
const steps = (await import(pathToFileURL(join(process.cwd(), stepsFile)).href)).default
mkdirSync(outDir, { recursive: true })
const PORT = 9333
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let ws
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
    const page = list.find((t) => t.type === 'page')
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl)
  } catch {
    // Chrome 還沒準備好
  }
  if (!ws) await sleep(200)
}
if (!ws) {
  console.error(`連不上 Chrome（port ${PORT}），請先啟動 headless Chrome`)
  process.exit(1)
}
await new Promise((r) => ws.addEventListener('open', r))

let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails
    console.log('頁面錯誤:', d.exception?.description ?? d.text)
  }
})
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id
    pending.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
await send('Page.enable')
await send('Runtime.enable')

const evaluate = async (code) => {
  const res = await send('Runtime.evaluate', { expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true })
  const ex = res.result?.exceptionDetails
  if (ex) return 'ERROR: ' + (ex.exception?.description ?? ex.text)
  return res.result?.result?.value
}

for (const step of steps) {
  if (step.viewport) {
    const [width, height, deviceScaleFactor = 1] = step.viewport
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor, mobile: false })
    await sleep(300)
  }
  if (step.goto) {
    await send('Page.navigate', { url: step.goto })
    await sleep(step.waitAfter ?? 2500)
  }
  if (step.eval) {
    const v = await evaluate(step.eval)
    if (v !== undefined) console.log('eval:', JSON.stringify(v))
    await sleep(step.waitAfter ?? 600)
  }
  if (step.log) console.log(step.label ?? 'log', JSON.stringify(await evaluate(`return (${step.log})`)))
  if (step.wait) await sleep(step.wait)
  if (step.shot) {
    const res = await send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(outDir, step.shot), Buffer.from(res.result.data, 'base64'))
    console.log('截圖:', join(outDir, step.shot))
  }
}
ws.close()
process.exit(0)
