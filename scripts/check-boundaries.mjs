#!/usr/bin/env node
// 모듈 경계 검사 (DESIGN.md §3, OWNERSHIP.md)
// 1. feature는 다른 feature를 public API(index.ts)로만 import한다.  @/features/x  (O)  @/features/x/components/y  (X)
// 2. shared는 features/app을 import하지 않는다.
// 3. features는 app을 import하지 않는다.
// tests/<layer>/<feature>/ 는 해당 feature 내부를 import할 수 있다.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const srcDir = join(root, 'src')
const scanDirs = ['src', 'tests'].map((d) => join(root, d))
const importRe = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g

function walk(dir) {
  let out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out = out.concat(walk(p))
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(p)
  }
  return out
}

function toPosix(p) {
  return p.split(sep).join('/')
}

// 파일/모듈 경로 → { zone: 'app'|'shared'|'feature'|'test'|'other', feature?, rest? }
function classify(absPath) {
  const rel = toPosix(relative(root, absPath))
  let m = rel.match(/^src\/features\/([^/]+)(?:\/(.*))?$/)
  if (m) return { zone: 'feature', feature: m[1], rest: m[2] ?? '' }
  if (rel.startsWith('src/shared')) return { zone: 'shared' }
  if (rel.startsWith('src/app')) return { zone: 'app' }
  m = rel.match(/^tests\/[^/]+\/([^/]+)\//)
  if (m) return { zone: 'test', feature: m[1] }
  return { zone: 'other' }
}

function resolveSpecifier(fromFile, spec) {
  if (spec.startsWith('@/')) return join(srcDir, spec.slice(2))
  if (spec.startsWith('.')) return resolve(dirname(fromFile), spec)
  return null // 외부 패키지
}

const isPublicEntry = (rest) => rest === '' || /^index(\.tsx?)?$/.test(rest)

const errors = []
for (const file of scanDirs.flatMap((d) => { try { return walk(d) } catch { return [] } })) {
  const from = classify(file)
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(importRe)) {
    const spec = match[1] ?? match[2] ?? match[3]
    const target = resolveSpecifier(file, spec)
    if (!target) continue
    const to = classify(target)
    const where = `${toPosix(relative(root, file))}: '${spec}'`

    if (from.zone === 'shared' && (to.zone === 'feature' || to.zone === 'app')) {
      errors.push(`${where} — shared는 features/app을 import할 수 없습니다.`)
    } else if (from.zone === 'feature' && to.zone === 'app') {
      errors.push(`${where} — feature는 app을 import할 수 없습니다.`)
    } else if (to.zone === 'feature' && from.feature !== to.feature && !isPublicEntry(to.rest)) {
      errors.push(`${where} — 다른 feature는 '@/features/${to.feature}' (index.ts)로만 import하세요.`)
    }
  }
}

if (errors.length) {
  console.error(`모듈 경계 위반 ${errors.length}건:\n` + errors.map((e) => `  - ${e}`).join('\n'))
  process.exit(1)
}
console.log('모듈 경계 검사 통과')
