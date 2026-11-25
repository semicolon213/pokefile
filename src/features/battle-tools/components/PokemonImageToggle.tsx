import { useCallback, useEffect, useRef, useState } from 'react'
import { fitSprite } from '@/shared/ui'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { createStillImage, type StillImage } from '../model/stillImage'
import { PokemonCry } from './PokemonMedia'
import './PokemonImageToggle.css'

export type PokemonImageToggleProps = {
  name: string
  normalUrls: readonly string[]
  /** 일반 후보가 기본 모습 대체인지 여부. 이로치에는 적용하지 않는다. */
  isBaseImage?: boolean
  shinyUrls: readonly string[]
  cryUrls?: readonly string[]
}

/** 상세에서 이미 조회한 같은 폼의 이미지 후보를 사용한다. */
export function PokemonImageToggle({ name, normalUrls, isBaseImage = false, shinyUrls, cryUrls }: PokemonImageToggleProps) {
  const [shiny, setShiny] = useState(false)
  const reducedMotion = useReducedMotion()
  const mode = shiny ? '이로치' : '일반'
  const images = shiny ? shinyUrls : normalUrls
  // 상세에서 확정한 같은 폼 후보 안에서 정적 이미지를 우선한다 (#49).
  const candidates = imageCandidates(images, reducedMotion, !shiny && isBaseImage)
  return (
    <div className="pokemon-portrait" role="group" aria-label="대표 이미지">
      <div className="pokemon-portrait__toolbar">
        <button type="button" role="switch" aria-label="이로치" aria-checked={shiny}
          className="pokemon-portrait__toggle" onClick={() => setShiny((value) => !value)}>
          <span className="pokemon-portrait__track" aria-hidden="true"><span /></span>
          이로치
        </button>
      </div>
      <PortraitSprite key={`${mode}:${reducedMotion}:${JSON.stringify(candidates)}`} candidates={candidates} alt={shiny ? `${name} 이로치` : name} />
      {cryUrls && <div className="pokemon-portrait__cry">
        <PokemonCry key={cryUrls.join('|')} urls={cryUrls} name={name} />
      </div>}
    </div>
  )
}

const isGif = (url: string) => /\.gif(?:[?#]|$)/i.test(url)

type ImageCandidate = { url: string; still: boolean; base: boolean }

function imageCandidates(urls: readonly string[], reduced: boolean, base: boolean): ImageCandidate[] {
  const ordered = reduced ? [...urls.filter((url) => !isGif(url)), ...urls.filter(isGif)] : urls
  return ordered.map((url) => ({ url, still: reduced && isGif(url), base }))
}

const MAX_PORTRAIT_SIZE = 216

// 상자보다 큰 GIF도 PNG로 바꾸지 않고 줄여서 움직임을 유지한다 (fitSprite)
function fitPortrait(image: HTMLImageElement) {
  const availableWidth = image.parentElement?.clientWidth || MAX_PORTRAIT_SIZE
  fitSprite(image, Math.min(MAX_PORTRAIT_SIZE, availableWidth))
}

function PortraitSprite({ candidates, alt }: { candidates: readonly ImageCandidate[]; alt: string }) {
  const [failed, setFailed] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const candidate = candidates[failed]
  const advance = useCallback(() => { setFailed((index) => index + 1); setLoaded(false) }, [])
  const onLoad = useCallback(() => setLoaded(true), [])
  const imageAlt = candidate?.base ? `${alt} 대신 표시한 기본 모습` : alt
  return (
    <>
      <div className="pokemon-portrait__image">
        {!candidate ? <EmptyImage alt={alt} /> : candidate.still
          ? <StillSprite key={candidate.url} url={candidate.url} alt={imageAlt} onError={advance} onLoad={onLoad} />
          : <SpriteImage src={candidate.url} alt={imageAlt} onError={advance} onLoad={onLoad} />}
      </div>
      {candidate?.base && loaded && <p className="pokemon-portrait__notice" role="status">기본 모습으로 표시 중</p>}
    </>
  )
}

function EmptyImage({ alt, still = false }: { alt: string; still?: boolean }) {
  return <span className="pokemon-portrait__empty" role="img" aria-label={`${alt}${still ? ' 정적' : ''} 이미지 없음`}>
    {still ? '움직임 줄이기 설정에서 표시할 정적 이미지가 없습니다.' : '이미지 정보 없음'}
  </span>
}

function StillSprite({ url, alt, onError, onLoad }: { url: string; alt: string; onError: () => void; onLoad: () => void }) {
  const [image, setImage] = useState<StillImage | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void createStillImage(url, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      if (result.status === 'missing') onError()
      else setImage(result)
    })
    return () => controller.abort()
  }, [url, onError])
  if (!image) return <span className="pokemon-portrait__empty" role="status">정적 이미지를 불러오는 중입니다.</span>
  if (image.status !== 'ready') return <EmptyImage alt={alt} still />
  return <SpriteImage src={image.url} alt={alt} onError={() => setImage({ status: 'unavailable' })} onLoad={onLoad} />
}

function SpriteImage({ src, alt, onError, onLoad }: { src: string; alt: string; onError: () => void; onLoad: () => void }) {
  const imageRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const image = imageRef.current
    const container = image?.parentElement
    if (!image || !container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (image.complete && image.naturalWidth > 0) fitPortrait(image)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [src])
  return <img ref={imageRef} src={src} alt={alt} decoding="async"
    onLoad={(event) => { fitPortrait(event.currentTarget); onLoad() }}
    onError={onError} />
}
