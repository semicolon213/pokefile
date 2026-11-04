import { useState } from 'react'
import { fitPixelArt } from '@/shared/ui'

/** box: 픽셀 아트를 정수배로 키울 상자 크기(px). 원본이 더 크면 다음 이미지로 넘어간다. */
type Props = { urls: readonly string[]; alt: string; className?: string; box: number }

// ADR-013 대체 순서: showdown GIF → PNG → 대체 아이콘
export function PokemonImage({ urls, alt, className, box }: Props) {
  const [failed, setFailed] = useState(0)
  const key = urls.join('|')
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    // 폼이 바뀌면 처음 이미지부터 다시 시도한다
    setLastKey(key)
    setFailed(0)
  }
  const url = urls[failed]

  if (!url) {
    return <span className={`detail-image__placeholder ${className ?? ''}`} role="img" aria-label={`${alt} 이미지 없음`} />
  }
  return (
    <img
      className={className}
      src={url}
      alt={alt}
      decoding="async"
      onLoad={(e) => {
        if (!fitPixelArt(e.currentTarget, box)) setFailed((i) => i + 1)
      }}
      onError={() => setFailed((i) => i + 1)}
    />
  )
}
