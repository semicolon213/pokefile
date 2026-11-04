import { useEffect, useState } from 'react'

/**
 * 목록 끝(sentinel)이 화면에 들어오면 pageSize만큼 더 보여준다 (FR-08, 버튼 없음).
 * 필터가 바뀌면 호출하는 쪽에서 key로 컴포넌트를 다시 만들어 처음부터 보여준다.
 * IntersectionObserver가 없는 환경에서는 전체를 보여준다.
 */
export function useInfiniteScroll(total: number, pageSize: number) {
  const supported = typeof IntersectionObserver !== 'undefined'
  const [visibleCount, setVisibleCount] = useState(supported ? pageSize : total)
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null)

  // 한 묶음을 추가할 때마다 다시 관찰한다. 추가 후에도 sentinel이 화면 안에 있으면
  // 새 관찰의 첫 콜백이 다시 불려 다음 묶음을 이어서 불러온다.
  useEffect(() => {
    if (!sentinel || !supported) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisibleCount((n) => Math.min(n + pageSize, total))
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinel, supported, pageSize, total, visibleCount])

  return { visibleCount: Math.min(visibleCount, total), hasMore: visibleCount < total, sentinelRef: setSentinel }
}
