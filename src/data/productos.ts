// Fuente única de datos de la sección de productos.
//
// FOTOS DE PRODUCTO: todas van sueltas en la carpeta de su marca, con el nombre que quieras:
//
//   public/images/productos/{marca}/mi-foto.webp     (solo .webp; convierte con /convertir-webp y /quitar-fondo si hace falta)
//
// Para agregar un producto, escribe UNA entrada en el arreglo `base` de abajo y lista sus fotos en `imagenes`:
//
//   imagenes: [
//       { src: "camiseta-frente.webp", alt: "Camiseta negra, vista de frente" },   // 1.ª: la que se ve en el perchero
//       { src: "camiseta-atras.webp",  alt: "Camiseta negra, vista de espalda" },
//       { src: "camiseta-logo.webp",   alt: "Detalle del logo" },                  // las que quieras: se recorren con ‹ › en la ficha
//   ]
//
// - `alt` es obligatorio (accesibilidad): describe lo que se ve en la foto.
// - TODAS las fotos deben venir SIN FONDO (todas cuelgan de la percha). Se ajustan solas (lienzo común + medidas)
//   al correr `astro dev`/`astro build` y se guardan en public/images/productos/_perchero/ (carpeta generada: no la toques).
//   Si cambias una foto, su `src` o el orden, se vuelven a ajustar solas. Si una queda inclinada, agrega `rotar: -3` (grados).
//
// TIPO decide el colgador: "superior" (percha de hombros), "inferior" (percha de pinzas), "accesorio" (sin percha).
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { normalizarPrenda, type Medidas } from "./normalizar-prenda"

const PLACEHOLDER = "/images/fondo-principal.webp"
const SIN_FOTO = "/images/productos/placeholder.svg"

export type GeneroId = "hombre" | "mujer"
export type TipoPrenda = "superior" | "inferior" | "accesorio"

export interface Marca {
    id: string
    nombre: string
    imagen: string
    descripcion: string
}

export interface Genero {
    id: GeneroId
    nombre: string
    imagen: string
}

// Una foto declarada a mano: archivo dentro de public/images/productos/{marca}/ + su texto alternativo
interface ImagenBase {
    src: string
    alt: string
    rotar?: number // grados para enderezar la prenda
}

// Foto ya resuelta, lista para usar en las páginas
export interface Foto {
    src: string
    alt: string
}

// Lo que se escribe a mano por producto
interface ProductoBase {
    id: string
    nombre: string
    marca: string
    genero: GeneroId
    tipo: TipoPrenda
    precio: number // USD
    tallas: string[]
    disponible: boolean
    descripcion?: string
    imagenes: ImagenBase[] // la 1.ª es la portada del perchero; vacío = marcador de posición
}

// Lo que usan las páginas (rutas y medidas ya resueltas)
export interface Producto extends Omit<ProductoBase, "imagenes"> {
    imagen: Foto // portada (= fotos[0])
    fotos: Foto[] // todas, en orden (siempre al menos una)
    meta: Medidas // tamaño de la prenda como fracción del lienzo
}

export const marcas: Marca[] = [
    { id: "youngla", nombre: "YoungLA", imagen: PLACEHOLDER, descripcion: "Ropa de gimnasio con ajuste y estilo." }, // /images/marcas/youngla.webp
    { id: "gymshark", nombre: "Gymshark", imagen: PLACEHOLDER, descripcion: "Rendimiento y comodidad para entrenar." }, // /images/marcas/gymshark.webp
]

export const generos: Genero[] = [
    { id: "hombre", nombre: "Hombre", imagen: PLACEHOLDER }, // /images/generos/hombre.webp
    { id: "mujer", nombre: "Mujer", imagen: PLACEHOLDER }, // /images/generos/mujer.webp
]

// Precio en USD. Los productos de ejemplo sin fotos propias usan `imagenes: []` (marcador) o reutilizan fotos de otro.
const base: ProductoBase[] = [
    {
        id: "racing-crewneck", nombre: "Crewneck Racing", marca: "youngla", genero: "hombre", tipo: "superior", precio: 36, tallas: ["S", "M", "L", "XL"], disponible: true,
        imagenes: [
            { src: "racing-crewneck-frente.webp", alt: "Crewneck Racing YoungLA, vista de frente" },
            { src: "racing-crewneck-espalda.webp", alt: "Crewneck Racing YoungLA, vista de espalda" },
            { src: "youngla-product-tshirt-01-atras-sin-fondo.webp", alt: "Tercera imagen de la hoodie youngla" },
        ],
    },
    {
        id: "tshirt-01", nombre: "Camiseta YoungLA", marca: "youngla", genero: "hombre", tipo: "superior", precio: 30, tallas: ["S", "M", "L", "XL"], disponible: true,
        imagenes: [
            { src: "youngla-product-tshirt-01-delante-sin-fondo.webp", alt: "Camiseta YoungLA, vista de frente" },
            { src: "youngla/youngla-product-tshirt-01-atras-sin-fondo.webp", alt: "Camiseta YoungLA, vista de espalda" },
        ],
    },
    {
        id: "jean-cargo-01", nombre: "Jean Cargo YoungLA", marca: "youngla", genero: "hombre", tipo: "inferior", precio: 55, tallas: ["30", "32", "34", "36"], disponible: true,
        imagenes: [{ src: "youngla-product-jean-cargo-01-sin-fondo.webp", alt: "Jean cargo YoungLA, vista de frente" }],
    },
    { id: "youngla-hombre-02", nombre: "Jogger Tapered Gris", marca: "youngla", genero: "hombre", tipo: "inferior", precio: 55, tallas: ["M", "L"], disponible: true, imagenes: [] },
    { id: "youngla-hombre-03", nombre: "Short Deportivo 7\"", marca: "youngla", genero: "hombre", tipo: "inferior", precio: 32, tallas: ["S", "M", "L"], disponible: false, imagenes: [] },
    {
        id: "youngla-mujer-01", nombre: "Top Deportivo Seamless", marca: "youngla", genero: "mujer", tipo: "superior", precio: 30, tallas: ["XS", "S", "M"], disponible: true,
        imagenes: [{ src: "racing-crewneck-frente.webp", alt: "Top deportivo Seamless YoungLA (foto de ejemplo)" }],
    },
    { id: "youngla-mujer-02", nombre: "Legging Alta Compresión", marca: "youngla", genero: "mujer", tipo: "inferior", precio: 49, tallas: ["XS", "S", "M", "L"], disponible: true, imagenes: [] },
    // Gymshark: sin fotos propias todavía (marcador de posición)
    { id: "gymshark-hombre-01", nombre: "Camiseta Crest", marca: "gymshark", genero: "hombre", tipo: "superior", precio: 33, tallas: ["S", "M", "L", "XL"], disponible: true, imagenes: [] },
    { id: "gymshark-hombre-02", nombre: "Hoodie Essential", marca: "gymshark", genero: "hombre", tipo: "superior", precio: 60, tallas: ["M", "L", "XL"], disponible: true, imagenes: [] },
    { id: "gymshark-mujer-01", nombre: "Legging Vital Seamless", marca: "gymshark", genero: "mujer", tipo: "inferior", precio: 52, tallas: ["XS", "S", "M", "L"], disponible: true, imagenes: [] },
    { id: "gymshark-mujer-02", nombre: "Sports Bra Adapt", marca: "gymshark", genero: "mujer", tipo: "superior", precio: 35, tallas: ["XS", "S", "M"], disponible: true, imagenes: [] },
]

// ---- Resolución (no hace falta tocar nada de aquí hacia abajo) ----

const RAIZ = process.cwd()
const PUBLIC = path.join(RAIZ, "public")
const CARPETA_PERCHERO = path.join(PUBLIC, "images", "productos", "_perchero")
const ARCHIVO_META = path.join(RAIZ, "src", "data", "prendas-meta.json")

// Caché de lo ya ajustado: de qué foto original salió, con qué giro y qué medidas tiene
type EntradaMeta = Medidas & { src?: string; rotar?: number }
const meta: Record<string, EntradaMeta> = existsSync(ARCHIVO_META) ? JSON.parse(readFileSync(ARCHIVO_META, "utf8")) : {}
let metaCambiada = false
const clavesVigentes = new Set<string>()
const salidasVigentes = new Set<string>()

// Ajusta la foto n al lienzo del perchero (solo si falta, cambió el original, su nombre o `rotar`) y devuelve su ruta + medidas
async function colgar(p: ProductoBase, n: number, img: ImagenBase): Promise<{ foto: Foto; medidas: Medidas } | undefined> {
    const rutaOrigen = `/images/productos/${p.marca}/${img.src}`
    const origen = path.join(PUBLIC, rutaOrigen)
    if (!existsSync(origen)) {
        console.warn(`[productos] ${p.id}: no existe ${rutaOrigen}`)
        return undefined
    }
    const archivo = `${p.id}-${n}.webp`
    const rutaSalida = `/images/productos/_perchero/${p.marca}/${archivo}`
    const salida = path.join(PUBLIC, rutaSalida)
    const clave = `${p.marca}/${p.id}/${n}`
    clavesVigentes.add(clave)
    salidasVigentes.add(path.join(p.marca, archivo))

    const previa = meta[clave]
    const vigente = existsSync(salida) && previa && previa.src === img.src && (previa.rotar ?? 0) === (img.rotar ?? 0) && statSync(origen).mtimeMs <= statSync(salida).mtimeMs
    if (!vigente) {
        try {
            const medidas = await normalizarPrenda(origen, salida, img.rotar ?? 0)
            meta[clave] = { ...medidas, src: img.src, ...(img.rotar ? { rotar: img.rotar } : {}) }
            metaCambiada = true
        } catch (e) {
            console.warn(`[productos] ${p.id}: no se pudo ajustar ${img.src}: ${(e as Error).message}`)
            return undefined
        }
    }
    const { ancho, alto } = meta[clave]
    return { foto: { src: rutaSalida, alt: img.alt }, medidas: { ancho, alto } }
}

async function resolver(p: ProductoBase): Promise<Producto> {
    const { imagenes, ...resto } = p
    if (!imagenes.length) console.warn(`[productos] ${p.id}: sin imágenes (se usa el marcador de posición)`)

    const hechas = (await Promise.all(imagenes.map((img, n) => colgar(p, n, img)))).filter((h): h is NonNullable<typeof h> => !!h)
    const fotos = hechas.map((h) => h.foto)

    // Todas las fotos comparten medida (la mayor) para que la prenda no salte al cambiar de foto
    const dimensiones = hechas.length
        ? { ancho: Math.max(...hechas.map((h) => h.medidas.ancho)), alto: Math.max(...hechas.map((h) => h.medidas.alto)) }
        : { ancho: 1, alto: 1 } // el marcador ocupa todo el lienzo

    const sinFoto: Foto = { src: SIN_FOTO, alt: `${p.nombre} (sin foto todavía)` }
    return { ...resto, imagen: fotos[0] ?? sinFoto, fotos: fotos.length ? fotos : [sinFoto], meta: dimensiones }
}

export const productos: Producto[] = await Promise.all(base.map(resolver))

// Limpieza: fuera lo que ya no corresponde a ninguna foto declarada (fotos quitadas, renombradas o con otro orden)
for (const clave of Object.keys(meta)) {
    if (!clavesVigentes.has(clave)) {
        delete meta[clave]
        metaCambiada = true
    }
}
if (existsSync(CARPETA_PERCHERO)) {
    for (const marca of readdirSync(CARPETA_PERCHERO)) {
        for (const archivo of readdirSync(path.join(CARPETA_PERCHERO, marca))) {
            if (!salidasVigentes.has(path.join(marca, archivo))) rmSync(path.join(CARPETA_PERCHERO, marca, archivo), { force: true })
        }
    }
}
if (metaCambiada) writeFileSync(ARCHIVO_META, JSON.stringify(meta, null, 4) + "\n")
