// All product imagery is displayed in a single fixed PORTRAIT frame so every
// animal card looks consistent. Each image also carries a per-image
// adjustment (zoom + focal position) so the admin can fit any photo to the
// portrait canvas without it looking cropped or off-centre.

export const PORTRAIT_ASPECT = '4 / 5' // width / height — the one true product ratio

// Normalise an image (legacy string OR the new object form) into a full record.
export function normalizeImage(img) {
  if (!img) return { url: '', zoom: 1, posX: 50, posY: 50 }
  if (typeof img === 'string') return { url: img, zoom: 1, posX: 50, posY: 50 }
  return {
    url: img.url || '',
    zoom: typeof img.zoom === 'number' ? img.zoom : 1,
    posX: typeof img.posX === 'number' ? img.posX : 50,
    posY: typeof img.posY === 'number' ? img.posY : 50,
  }
}

export function normalizeImages(images = []) {
  return images.map(normalizeImage)
}

export function imageUrl(img) {
  return normalizeImage(img).url
}

export function firstImageUrl(product) {
  return imageUrl(product?.images?.[0])
}

// Inline style for the <img> inside a fixed portrait frame. object-cover fills
// the frame; zoom scales further; focal position shifts what stays in view.
export function imageStyle(img) {
  const { zoom, posX, posY } = normalizeImage(img)
  return {
    objectPosition: `${posX}% ${posY}%`,
    transform: zoom && zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${posX}% ${posY}%`,
  }
}

// Reads an uploaded image File, downscales it on a canvas, and returns a
// compressed JPEG data URL. Keeping images small avoids blowing the
// localStorage / Firestore document limits when many products are stored.
export function fileToScaledDataURL(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Please choose an image file.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load the image.'))
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Resolves a file in public/ against the deploy base path. Hard-coding "/img/x.png"
// breaks on hosts that serve the site from a subdirectory (GitHub Pages uses
// /IGA-Sial/); Vite rewrites asset URLs it can see, but not string literals in JSX.
export function assetUrl(path) {
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, '')}`
}
