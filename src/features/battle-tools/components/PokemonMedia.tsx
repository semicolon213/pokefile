import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { PokemonTools } from '../model/tools'
import './PokemonCry.css'

export function PokemonMedia({ data, name }: { data: PokemonTools; name: string }) {
  return (
    <div className="pokemon-tools__panel">
      <PokemonCry key={data.cries.join('|')} urls={data.cries} name={name} />
    </div>
  )
}

export function PokemonCry({ urls, name }: { urls: readonly string[]; name: string }) {
  const [failed, setFailed] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const retryRef = useRef<HTMLButtonElement>(null)
  const restoreFocus = useRef(false)
  const messageId = useId()
  const url = urls[failed]
  useLayoutEffect(() => {
    if (!restoreFocus.current) return
    restoreFocus.current = false
    const target = audioRef.current ?? retryRef.current
    target?.focus()
  }, [url])
  useEffect(() => {
    const audio = audioRef.current
    return () => { audio?.pause() }
  }, [url])
  const message = failed > 0
    ? url ? '울음소리를 불러오지 못해 다른 음원으로 전환했습니다. 재생 버튼을 눌러 주세요.' : '울음소리를 재생할 수 없습니다.'
    : url ? '' : '울음소리 정보 없음'
  return <div className="pokemon-cry">
    {url && <audio ref={audioRef} key={url} controls tabIndex={0} preload="none" aria-label={`${name} 울음소리`} src={url}
      aria-describedby={messageId} onError={(event) => {
        restoreFocus.current = event.currentTarget === event.currentTarget.ownerDocument.activeElement
        setFailed(failed + 1)
      }} />}
    <p id={messageId} role="status" aria-atomic="true" className="pokemon-cry__message">{message}</p>
    {!url && failed > 0 && <button ref={retryRef} type="button" aria-describedby={messageId} onClick={(event) => {
      restoreFocus.current = event.currentTarget === event.currentTarget.ownerDocument.activeElement
      setFailed(0)
    }}>울음소리 다시 시도</button>}
  </div>
}
