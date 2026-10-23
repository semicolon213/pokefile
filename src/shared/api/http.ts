// API_SPEC.md §3: 404/데이터 없음, 네트워크 오류, JSON 파싱 오류를 구분한다.
export type ApiErrorKind = 'not_found' | 'http' | 'network' | 'parse'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(kind: ApiErrorKind, message: string, status?: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (cause) {
    throw new ApiError('network', `Network error: ${url}`, undefined, { cause })
  }

  if (response.status === 404) {
    throw new ApiError('not_found', `Not found: ${url}`, 404)
  }
  if (!response.ok) {
    throw new ApiError('http', `HTTP ${response.status}: ${url}`, response.status)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('parse', `Invalid JSON: ${url}`, response.status)
  }
}
