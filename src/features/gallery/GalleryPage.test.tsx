import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { GalleryPage } from './GalleryPage'

afterEach(cleanup)

describe('GalleryPage', () => {
  it('タイトルと全セクションの見出しを表示する', () => {
    render(<GalleryPage />)
    expect(screen.getByText('牌ギャラリー')).toBeInTheDocument()
    const sections = [
      '萬子（マンズ）',
      '筒子（ピンズ）',
      '索子（ソーズ）',
      '字牌（ジハイ）',
      '赤ドラ・裏面',
      'サイズバリエーション',
    ]
    for (const title of sections) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    }
  })

  it('全34種+赤ドラ3種+裏面+サイズ見本5つの牌を描画する', () => {
    render(<GalleryPage />)
    expect(screen.getAllByRole('img')).toHaveLength(43)
    expect(screen.getAllByRole('img', { name: '裏向きの牌' })).toHaveLength(1)
    expect(screen.getByRole('img', { name: '赤五萬' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '赤五筒' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '赤五索' })).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: '七筒' })).toHaveLength(6)
  })

  it('牌の名前と読みを表示する', () => {
    render(<GalleryPage />)
    expect(screen.getByText('トン')).toBeInTheDocument()
    expect(screen.getByText('イーマン')).toBeInTheDocument()
    expect(screen.getByText('裏面')).toBeInTheDocument()
  })
})
