import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppShell } from './AppShell'

const buildRouter = (initialPath: string) =>
  createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <p>トップのコンテンツ</p> },
          { path: 'sub', element: <p>サブのコンテンツ</p> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )

afterEach(cleanup)

describe('AppShell', () => {
  it('ヘッダーと子ルートの内容を表示する', () => {
    render(<RouterProvider router={buildRouter('/')} />)
    expect(screen.getByText('雀学')).toBeInTheDocument()
    expect(screen.getByText('麻雀ルールと点数計算を学ぶ')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ホーム' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByText('トップのコンテンツ')).toBeInTheDocument()
    expect(screen.queryByText('サブのコンテンツ')).not.toBeInTheDocument()
  })

  it('子ルートを切り替えてもヘッダーは表示されたままになる', () => {
    render(<RouterProvider router={buildRouter('/sub')} />)
    expect(screen.getByText('サブのコンテンツ')).toBeInTheDocument()
    expect(screen.getByText('雀学')).toBeInTheDocument()
  })

  it('ホームリンクでトップの子ルートへ戻れる', async () => {
    render(<RouterProvider router={buildRouter('/sub')} />)
    fireEvent.click(screen.getByRole('link', { name: 'ホーム' }))
    expect(await screen.findByText('トップのコンテンツ')).toBeInTheDocument()
    expect(screen.queryByText('サブのコンテンツ')).not.toBeInTheDocument()
  })
})
