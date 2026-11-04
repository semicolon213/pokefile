import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { fitPixelArt, prefersReducedMotion } from '@/shared/ui'
import type { PokemonTools } from '../model/tools'

export function PokemonMedia({ data, name }: { data: PokemonTools; name: string }) {
  const [shiny, setShiny] = useState(false)
  const images = shiny ? data.shinyImages : data.normalImages
  const urls = prefersReducedMotion() ? images.filter((url) => !/\.gif(?:\?|$)/i.test(url)) : images
  const mode = shiny ? '이로치' : '일반'
  return (
    <div className="pokemon-tools__panel">
      <div className="pokemon-tools__media">
        <div>
          <div className="pokemon-tools__modes" role="group" aria-label="이미지 종류">
            <button type="button" aria-pressed={!shiny} onClick={() => setShiny(false)}>일반</button>
            <button type="button" aria-pressed={shiny} onClick={() => setShiny(true)}>이로치</button>
          </div>
          <div className="pokemon-tools__sprite">
            <ToolSprite key={`${mode}:${urls.join('|')}`} urls={urls} alt={`${name} ${mode}`} />
          </div>
        </div>
        <div>
          <h3>울음소리</h3>
          <ToolCry key={data.cries.join('|')} urls={data.cries} name={name} />
        </div>
      </div>
    </div>
  )
}

const MAX_SPRITE_SIZE = 224

function fitToolSprite(image: HTMLImageElement) {
  const availableWidth = image.parentElement?.clientWidth || MAX_SPRITE_SIZE
  return fitPixelArt(image, Math.min(MAX_SPRITE_SIZE, availableWidth))
}

function ToolSprite({ urls, alt }: { urls: readonly string[]; alt: string }) {
  const [failed, setFailed] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)
  const url = urls[failed]
  useEffect(() => {
    const image = imageRef.current
    const container = image?.parentElement
    if (!image || !container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (image.complete && image.naturalWidth > 0 && !fitToolSprite(image)) setFailed(failed + 1)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [url, failed])
  return url ? <img ref={imageRef} src={url} alt={alt} decoding="async"
    onLoad={(event) => { if (!fitToolSprite(event.currentTarget)) setFailed(failed + 1) }}
    onError={() => setFailed(failed + 1)} />
    : <p role="img" aria-label={`${alt} 이미지 없음`}>{alt} 이미지 정보 없음</p>
}

function ToolCry({ urls, name }: { urls: readonly string[]; name: string }) {
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
    : url ? '재생 버튼을 눌러 들을 수 있습니다.' : '울음소리 정보 없음'
  return <>
    {url && <audio ref={audioRef} key={url} controls tabIndex={0} preload="none" aria-label={`${name} 울음소리`} src={url}
      aria-describedby={messageId} onError={(event) => {
        restoreFocus.current = event.currentTarget === event.currentTarget.ownerDocument.activeElement
        setFailed(failed + 1)
      }} />}
    <p id={messageId} role="status" aria-atomic="true" className="pokemon-tools__note">{message}</p>
    {!url && failed > 0 && <button ref={retryRef} type="button" aria-describedby={messageId} onClick={(event) => {
      restoreFocus.current = event.currentTarget === event.currentTarget.ownerDocument.activeElement
      setFailed(0)
    }}>울음소리 다시 시도</button>}
  </>
}
