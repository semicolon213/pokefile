import { EmptyState, ErrorState, LoadingState } from '@/shared/ui'

// DESIGN.md §5 SectionState: 섹션별 로딩·오류·빈 상태·재시도. 부가 데이터 실패는 해당 섹션만 표시한다 (NFR-07).
type Props =
  | { status: 'loading'; message?: string }
  | { status: 'empty'; message?: string }
  | { status: 'error'; message?: string; onRetry?: () => void }

export function SectionState(props: Props) {
  if (props.status === 'loading') return <LoadingState message={props.message ?? '정보를 불러오는 중입니다.'} />
  if (props.status === 'empty') return <EmptyState message={props.message ?? '등록된 정보가 없습니다.'} />
  return (
    <div className="detail-section-error">
      <ErrorState message={props.message ?? '정보를 불러오지 못했습니다.'} />
      {props.onRetry && (
        <button type="button" onClick={props.onRetry}>
          다시 시도
        </button>
      )}
    </div>
  )
}
