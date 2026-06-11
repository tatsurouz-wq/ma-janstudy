import * as THREE from 'three'

export class PanelDisplay {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D | null
  readonly texture: THREE.CanvasTexture

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
  }

  draw(text: string, color = '#e8b95a', fontScale = 0.52): void {
    if (this.ctx === null) {
      return
    }
    const { width, height } = this.canvas
    this.ctx.fillStyle = '#0c0a08'
    this.ctx.fillRect(0, 0, width, height)
    this.ctx.fillStyle = color
    this.ctx.font = `bold ${Math.floor(height * fontScale)}px "Zen Kaku Gothic New", sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(text, width / 2, height / 2 + height * 0.03)
    this.texture.needsUpdate = true
  }
}
