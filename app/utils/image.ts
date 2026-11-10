/** Leest een gekozen bestand in, draait 'm goed (EXIF) en verkleint naar max `max` px. */
export async function fileToJpeg(file: Blob, max = 1600): Promise<string> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(
      'Deze foto kan niet worden geopend. Probeer een JPG- of PNG-foto, of maak een screenshot van de foto.',
    )
  }
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')!
  context.fillStyle = '#fff' // transparante PNG's krijgen een witte achtergrond
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.9)
}

/** Draait een afbeelding 90° met de klok mee. */
export async function rotateJpeg(src: string): Promise<string> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalHeight
  canvas.height = image.naturalWidth
  const context = canvas.getContext('2d')!
  context.translate(canvas.width, 0)
  context.rotate(Math.PI / 2)
  context.drawImage(image, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.9)
}

/** Schaalt een canvas naar een vierkante JPEG van `size` px. */
export function canvasToSquareJpeg(source: HTMLCanvasElement, size = 800): string {
  const canvas = document.createElement('canvas')
  const target = Math.min(size, source.width)
  canvas.width = target
  canvas.height = target
  const context = canvas.getContext('2d')!
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, target, target)
  return canvas.toDataURL('image/jpeg', 0.88)
}

/** Haalt een (server-)afbeelding op als data-URL zonder opnieuw te comprimeren. */
export async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  const blob = await fetch(url).then((response) => response.blob())
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}
