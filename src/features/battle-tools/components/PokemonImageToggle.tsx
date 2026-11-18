import { useEffect, useRef, useState } from 'react'
import { fitSprite, prefersReducedMotion } from '@/shared/ui'
import { PokemonCry } from './PokemonMedia'
import './PokemonImageToggle.css'

export type PokemonImageToggleProps = {
  name: string
  normalUrls: readonly string[]
  shinyUrls: readonly string[]
  cryUrls?: readonly string[]
}

/** 상세에서 이미 조회한 같은 폼의 이미지 후보를 사용한다. */
export function PokemonImageToggle({ name, normalUrls, shinyUrls, cryUrls }: PokemonImageToggleProps) {
  const [shiny, setShiny] = useState(false)
  const mode = shiny ? '이로치' : '일반'
  const images = shiny ? shinyUrls : normalUrls
  // 움직임 줄이기면 정적 PNG를 먼저 쓰되 GIF는 마지막 후보로 남긴다 (DESIGN §3.3)
  const urls = prefersReducedMotion() ? [...images.filter((url) => !isGif(url)), ...images.filter(isGif)] : images
  return (
    <div className="pokemon-portrait" role="group" aria-label="대표 이미지">
      <div className="pokemon-portrait__toolbar">
        <button type="button" role="switch" aria-label="이로치" aria-checked={shiny}
          className="pokemon-portrait__toggle" onClick={() => setShiny((value) => !value)}>
          <span className="pokemon-portrait__track" aria-hidden="true"><span /></span>
          이로치
        </button>
      </div>
      <div className="pokemon-portrait__image">
        <PortraitSprite key={`${mode}:${urls.join('|')}`} urls={urls} alt={shiny ? `${name} 이로치` : name} />
      </div>
      {cryUrls && <div className="pokemon-portrait__cry">
        <PokemonCry key={cryUrls.join('|')} urls={cryUrls} name={name} />
      </div>}
    </div>
  )
}

const isGif = (url: string) => /\.gif(?:\?|$)/i.test(url)

const MAX_PORTRAIT_SIZE = 216

// 상자보다 큰 GIF도 PNG로 바꾸지 않고 줄여서 움직임을 유지한다 (fitSprite)
function fitPortrait(image: HTMLImageElement) {
  const availableWidth = image.parentElement?.clientWidth || MAX_PORTRAIT_SIZE
  fitSprite(image, Math.min(MAX_PORTRAIT_SIZE, availableWidth))
}

function PortraitSprite({ urls, alt }: { urls: readonly string[]; alt: string }) {
  const [failed, setFailed] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)
  const url = urls[failed]
  useEffect(() => {
    const image = imageRef.current
    const container = image?.parentElement
    if (!image || !container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (image.complete && image.naturalWidth > 0) fitPortrait(image)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [url])
  return url ? <img ref={imageRef} src={url} alt={alt} decoding="async"
    onLoad={(event) => fitPortrait(event.currentTarget)}
    onError={() => setFailed(failed + 1)} />
    : <span className="pokemon-portrait__empty" role="img" aria-label={`${alt} 이미지 없음`}>이미지 정보 없음</span>
}
