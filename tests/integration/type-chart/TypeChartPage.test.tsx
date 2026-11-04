import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { TypeMatchups } from '@/features/type-chart'
import { TypeChartPage } from '@/features/type-chart/pages/TypeChartPage'

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>
}

const renderAt = (path = '/types') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/types" element={<TypeChartPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )

const row = (label: RegExp) => screen.getByText(label).closest('.defense-groups__row') as HTMLElement

describe('타입 상성 화면 (FR-24, TASK-021)', () => {
  it('방어 타입을 고르면 받는 피해를 묶어 보여 주고 URL에 반영한다', async () => {
    const user = userEvent.setup()
    renderAt()
    const picker = screen.getByRole('group', { name: '방어 타입' })
    await user.click(within(picker).getByRole('button', { name: '불꽃' }))
    await user.click(within(picker).getByRole('button', { name: '비행' }))
    expect(screen.getByTestId('location')).toHaveTextContent('?type=fire&type=flying')
    expect(screen.getByRole('heading', { name: '불꽃·비행 타입이 받는 피해' })).toBeInTheDocument()
    expect(within(row(/×4/)).getByText('바위')).toBeInTheDocument()
    expect(within(row(/×0/)).getByText('땅')).toBeInTheDocument()
    // 2개를 고르면 나머지는 비활성
    expect(within(picker).getByRole('button', { name: '물' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '선택 해제' }))
    expect(screen.getByTestId('location')).toHaveTextContent('')
  })

  it('전체 상성표는 공격×방어 18×18이고 고른 방어 타입 열을 강조한다', () => {
    renderAt('/types?type=ghost')
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(19)
    expect(within(table).getAllByRole('rowheader')).toHaveLength(18)
    const normalRow = within(table).getByRole('rowheader', { name: '노말' }).closest('tr')!
    const ghostCol = within(table).getAllByRole('columnheader').findIndex((th) => th.textContent === '고스트')
    const cell = normalRow.children[ghostCol] as HTMLElement
    expect(cell).toHaveTextContent('0')
    expect(cell).toHaveAttribute('data-highlight', 'true')
  })
})

describe('상세 타입 상성 섹션', () => {
  it('폼 타입 기준 받는 피해와 전체 상성표 링크를 보여 준다', () => {
    render(
      <MemoryRouter>
        <TypeMatchups types={['water', 'ground']} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: '타입 상성' })).toBeInTheDocument()
    expect(within(row(/×4/)).getByText('풀')).toBeInTheDocument()
    expect(within(row(/×0/)).getByText('전기')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '전체 상성표' })).toHaveAttribute('href', '/types?type=water&type=ground')
  })
})
