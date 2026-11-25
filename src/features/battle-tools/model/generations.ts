import { SCOPE } from '@/shared/config/scope'

type SmogonScope = { smogon: { generation: number; generations?: readonly number[] } }

/** 여러 세대를 지원하는 설정과 기존 단일 세대 설정을 모두 읽는다. 값의 원본은 scope.json이다. */
export function smogonGenerations(scope: SmogonScope = SCOPE): number[] {
  return [...new Set(scope.smogon.generations ?? [scope.smogon.generation])]
    .filter((generation) => Number.isInteger(generation) && generation > 0)
    .sort((a, b) => b - a)
}

export const SMOGON_GENERATIONS = smogonGenerations()

export function isMegaForm(formKey: string): boolean {
  return /(?:^|-)mega(?:-|$)/.test(formKey)
}

/** ADR-016의 메가 세팅 범위. 최신 메가도 이 범위에 실제 세팅이 없으면 부재로 처리한다. */
export function supportsSmogonForm(generation: number, formKey: string): boolean {
  return !isMegaForm(formKey) || generation === 6 || generation === 7
}
