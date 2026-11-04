/**
 * 픽셀 아트 스프라이트를 상자(box px) 안에 맞춘다.
 * - 상자보다 크면 상자에 맞게 줄인다(GIF를 PNG로 바꾸지 않아 움직임을 유지한다). 줄인 이미지는 data-downscaled="true"로
 *   표시해 부드럽게 보간한다(global.css) — 최근접 보간으로 줄이면 픽셀 굵기가 들쭉날쭉해진다.
 * - 상자보다 작으면 upscale일 때만 원본의 정수배(2·3배…)로 키운다(소수배 확대 금지). 목록·진화 트리처럼 포켓몬끼리
 *   크기를 비교하는 곳은 upscale=false로 원본 크기를 지킨다.
 */
export function fitSprite(img: HTMLImageElement, box: number, { upscale = true }: { upscale?: boolean } = {}): void {
  const w = img.naturalWidth
  const h = img.naturalHeight
  const longest = Math.max(w, h)
  if (!longest) return
  const downscaled = longest > box
  const scale = downscaled ? box / longest : upscale ? Math.floor(box / longest) : 1
  img.dataset.downscaled = String(downscaled)
  img.style.width = `${Math.round(w * scale)}px`
  img.style.height = `${Math.round(h * scale)}px`
}

/** 움직임 줄이기 설정이면 애니메이션 GIF 대신 정적 이미지를 먼저 쓴다 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}
