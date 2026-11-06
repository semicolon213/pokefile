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
  const urls = prefersReducedMotion() ? images.filter((url) => !/\.gif(?:\?|$)/i.test(url)) : images
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

const MAX_PORTRAIT_SIZE = 216

function fitPortrait(image: HTMLImageElement) {
  const availableWidth = image.parentElement?.clientWidth || MAX_PORTRAIT_SIZE
  const box = Math.min(MAX_PORTRAIT_SIZE, availableWidth)
  if (Math.max(image.naturalWidth, image.naturalHeight) > box) return false
  fitSprite(image, box)
  return true
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
      if (image.complete && image.naturalWidth > 0 && !fitPortrait(image)) setFailed(failed + 1)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [url, failed])
  return url ? <img ref={imageRef} src={url} alt={alt} decoding="async"
    onLoad={(event) => { if (!fitPortrait(event.currentTarget)) setFailed(failed + 1) }}
    onError={() => setFailed(failed + 1)} />
    : <span className="pokemon-portrait__empty" role="img" aria-label={`${alt} 이미지 없음`}>이미지 정보 없음</span>
}
