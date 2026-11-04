import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { SCOPE } from '@/shared/config/scope'
import { MY_GAME_PARAM, findGameVersion, setMyGame, useMyGame } from '@/shared/state'

/**
 * 상단 바의 '내 게임' 선택 (FR-26). 선택은 브라우저에 저장되고 URL 쿼리 `game`에도 반영해 링크로 공유된다.
 * - 공유 링크로 들어오면 URL의 게임을 저장한다.
 * - 저장된 게임이 있는데 URL에 없으면(다른 화면으로 이동 등) 현재 주소에 붙인다(replace, 기록을 늘리지 않음).
 */
export function MyGameSelect() {
  const game = useMyGame()
  const [params, setParams] = useSearchParams()
  const urlGame = findGameVersion(params.get(MY_GAME_PARAM))?.version ?? null
  const stored = game?.version ?? null
  // 사용자가 직접 바꾼 직후에는 URL 반영이 한 박자 늦다. 둘이 같아질 때까지 동기화를 건너뛰어 이전 값이 되살아나지 않게 한다.
  const changing = useRef(false)

  useEffect(() => {
    if (changing.current) {
      if (urlGame === stored) changing.current = false
      return
    }
    if (urlGame && urlGame !== stored) setMyGame(urlGame)
    else if (!urlGame && stored)
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set(MY_GAME_PARAM, stored)
          return next
        },
        { replace: true },
      )
  }, [urlGame, stored, setParams])

  const change = (version: string) => {
    const next = version || null
    changing.current = true
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
