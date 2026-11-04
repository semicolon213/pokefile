import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { SCOPE } from '@/shared/config/scope'
import { MY_GAME_PARAM, findGameVersion, setMyGame, useMyGame } from '@/shared/state'

/**
 * 상단 바의 '내 게임' 선택 (FR-26). 선택은 브라우저에 저장되고 URL 쿼리 `game`에도 반영해 링크로 공유된다.
 * - 앱에 처음 들어올 때(공유 링크·새 탭·새로고침)만 URL의 게임을 저장한다.
 * - 그 뒤로는 저장된 선택이 기준이다. 뒤로 가기·앱 안 링크로 바뀐 주소의 game이 달라도 선택을 되돌리지 않고,
 *   현재 주소를 저장된 선택에 맞춘다(replace, 기록을 늘리지 않음). (QA D-014-01)
 */
export function MyGameSelect() {
  const game = useMyGame()
  const [params, setParams] = useSearchParams()
  const urlGame = findGameVersion(params.get(MY_GAME_PARAM))?.version ?? null
  const stored = game?.version ?? null
  const entered = useRef(false)
  // 처음 주소의 게임을 저장한 직후에는 저장값 반영이 한 박자 늦다(StrictMode의 효과 재실행 포함).
  // 저장값이 그 게임이 될 때까지 주소를 덮어쓰지 않는다.
  const adopting = useRef<string | null>(null)

  useEffect(() => {
    if (!entered.current) {
      entered.current = true
      if (urlGame && urlGame !== stored) {
        adopting.current = urlGame
        setMyGame(urlGame)
        return
      }
    }
    if (adopting.current) {
      if (stored !== adopting.current) return
      adopting.current = null
    }
    if (urlGame !== stored)
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (stored) next.set(MY_GAME_PARAM, stored)
          else next.delete(MY_GAME_PARAM)
          return next
        },
        { replace: true },
      )
  }, [urlGame, stored, setParams])

  const change = (version: string) => {
    const next = version || null
    setMyGame(next)
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next) p.set(MY_GAME_PARAM, next)
        else p.delete(MY_GAME_PARAM)
        return p
      },
      { replace: true },
    )
  }

  return (
    <label className="my-game">
      <span className="my-game__label">내 게임</span>
      <select value={stored ?? ''} onChange={(e) => change(e.target.value)}>
        <option value="">전체 게임</option>
        {SCOPE.generations.map((gen) => (
          <optgroup key={gen.id} label={`${gen.name} · ${gen.region}`}>
            {SCOPE.gameVersions
              .filter((v) => v.generation === gen.id)
              .map((v) => (
                <option key={v.version} value={v.version}>
                  {v.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
