/**
 * 도감 목록으로 돌아올 때 상태 복원 (목록 ↔ 상세).
 * - 마지막으로 본 목록 주소(필터·정렬·검색어 쿼리) → 상세의 '도감 목록으로' 링크가 그 주소로 돌아간다.
 * - 목록 주소별로 무한 스크롤로 펼친 카드 수 → 돌아오면 같은 길이로 다시 그려 스크롤 위치(ScrollRestoration)를 되찾는다.
 * 탭을 닫으면 사라지도록 sessionStorage에 두고, 막혀 있으면 메모리로만 유지한다.
 */
const STORAGE_KEY = 'pokefile:list-return'
/** 기억할 목록 주소 수 (오래된 것부터 버린다) */
const MAX_LISTS = 20

type ListMemory = { search: string; visible: Record<string, number> }

let memory: ListMemory | undefined

function load(): ListMemory {
  if (memory) return memory
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<ListMemory> | null
    memory = {
      search: typeof parsed?.search === 'string' ? parsed.search : '',
      visible: parsed?.visible && typeof parsed.visible === 'object' ? parsed.visible : {},
    }
  } catch {
    memory = { search: '', visible: {} }
  }
  return memory
}

function save(next: ListMemory) {
  memory = next
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 저장 실패는 무시한다 (이번 세션은 메모리 값으로 유지)
  }
}

/** 목록 화면에서 현재 주소의 쿼리('?type=fire' 또는 '')를 기억한다 */
export function rememberListSearch(search: string) {
  const current = load()
  if (current.search !== search) save({ ...current, search })
}

/** 마지막으로 본 목록 주소. 기억한 것이 없으면 '/' */
export function lastListPath(): string {
  return `/${load().search}`
}

/** 이 목록 주소에서 펼친 카드 수를 기억한다 */
export function rememberVisibleCount(listKey: string, count: number) {
  const current = load()
  if (current.visible[listKey] === count) return
  const entries = Object.entries(current.visible).filter(([key]) => key !== listKey)
  entries.push([listKey, count])
  save({ ...current, visible: Object.fromEntries(entries.slice(-MAX_LISTS)) })
}

export function savedVisibleCount(listKey: string): number | undefined {
  const count = load().visible[listKey]
  return Number.isInteger(count) && count > 0 ? count : undefined
}

/** 테스트용 */
export function resetListReturnForTest() {
  memory = undefined
}
