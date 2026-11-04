/**
 * 픽셀 아트 스프라이트를 상자(box px) 안에서 원본의 정수배(1·2·3배…)로만 키운다.
 * 원본이 상자보다 크면 줄이지 않고 false를 돌려준다(픽셀이 뭉개지는 소수배 축소 금지) — 호출하는 쪽이 다음 이미지로 넘어간다.
 */
export function fitPixelArt(img: HTMLImageElement, box: number): boolean {
  const longest = Math.max(img.naturalWidth, img.naturalHeight)
  if (!longest) return true
  if (longest > box) return false
  const scale = Math.floor(box / longest)
  img.style.width = `${img.naturalWidth * scale}px`
  img.style.height = `${img.naturalHeight * scale}px`
  return true
}

/** 움직임 줄이기 설정이면 애니메이션 GIF 대신 정적 이미지를 먼저 쓴다 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}
