// Normaliza la foto de una prenda (WebP/PNG con fondo transparente) para el perchero.
// Se ejecuta sola desde productos.ts (al arrancar `astro dev` o `astro build`); no hay que correr nada a mano.
//
// - Recorta el borde transparente (y rota antes si hace falta enderezar la foto).
// - Escala la prenda para que quepa en 1000x1400 sin deformarla.
// - La pega en un lienzo fijo de 1200x1500, ARRIBA y centrada: el punto de anclaje
//   (cuello o pretina) siempre queda en el borde superior y al centro.
// - Devuelve el tamaño real de la prenda como fracción del lienzo (lo usa PrendaColgada para dimensionar la percha).
import sharp from "sharp"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const LIENZO = { w: 1200, h: 1500 }
const CAJA = { w: 1000, h: 1400 }
const UMBRAL_ALPHA = 24 // ignora sombras muy tenues al medir

export interface Medidas {
    ancho: number
    alto: number
}

// Recorta usando solo píxeles realmente visibles (alpha > umbral)
async function recortar(buffer: Buffer) {
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let minX = info.width, minY = info.height, maxX = -1, maxY = -1
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            if (data[(y * info.width + x) * 4 + 3] > UMBRAL_ALPHA) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }
    if (maxX < 0) throw new Error("La imagen no tiene píxeles visibles (¿ya viene sin fondo?)")
    return sharp(buffer).extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
}

export async function normalizarPrenda(entrada: string, salida: string, rotar = 0): Promise<Medidas> {
    let base = sharp(entrada).ensureAlpha()
    if (rotar) base = sharp(await base.rotate(rotar, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer())

    const recortada = await (await recortar(await base.png().toBuffer())).png().toBuffer()
    const prenda = await sharp(recortada).resize(CAJA.w, CAJA.h, { fit: "inside" }).png().toBuffer()
    const { width, height } = await sharp(prenda).metadata()

    await mkdir(path.dirname(salida), { recursive: true })
    await sharp({ create: { width: LIENZO.w, height: LIENZO.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: prenda, left: Math.round((LIENZO.w - width) / 2), top: 0 }])
        .webp({ quality: 88, alphaQuality: 100 })
        .toFile(salida)

    return { ancho: Number((width / LIENZO.w).toFixed(3)), alto: Number((height / LIENZO.h).toFixed(3)) }
}
