import type { SVGProps } from 'react'

// 아이콘은 같은 선 굵기(1.75)·24 그리드로 직접 그린다. 장식용이므로 기본 aria-hidden.
type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </Icon>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Icon>
  )
}

/** filled=true면 채운 별(저장됨) */
export function StarIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon {...props} fill={filled ? 'currentColor' : 'none'}>
      <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
    </Icon>
  )
}

/** PokeFile 마크: 위는 강조색, 아래는 흰색인 원 (공식 로고가 아닌 자체 도형) */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true" focusable="false">
      <circle cx="13" cy="13" r="11.5" fill="var(--color-surface)" stroke="var(--color-text)" strokeWidth="2" />
      <path d="M1.5 13a11.5 11.5 0 0 1 23 0z" fill="var(--color-primary)" stroke="var(--color-text)" strokeWidth="2" />
      <circle cx="13" cy="13" r="3.4" fill="var(--color-surface)" stroke="var(--color-text)" strokeWidth="2" />
    </svg>
  )
}
