export const isWebGL2Supported = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    return context !== null
  } catch {
    return false
  }
}
