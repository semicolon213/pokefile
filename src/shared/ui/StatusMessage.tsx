// DESIGN.md §9: 로딩 / 오류 / 결과 없음을 구분해 표시한다.
type Props = { message?: string }

export function LoadingState({ message = '불러오는 중…' }: Props) {
  return (
    <p role="status" aria-live="polite">
      {message}
    </p>
  )
}

export function ErrorState({ message = '데이터를 불러오지 못했습니다.' }: Props) {
  return <p role="alert">{message}</p>
}

export function EmptyState({ message = '정보 없음' }: Props) {
  return <p>{message}</p>
}
