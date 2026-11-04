import { useEffect } from 'react'

const APP_NAME = 'PokeFile'

/** 화면마다 다른 문서 제목을 둔다 (WCAG 2.4.2). title이 없으면 앱 이름만 쓴다. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} - ${APP_NAME}` : APP_NAME
  }, [title])
}
