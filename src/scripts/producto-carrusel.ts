// Carrusel de fotos de la ficha: todas las fotos cuelgan de la misma percha.
// Flechas ‹ ›, puntos, teclas ← →, y deslizar horizontalmente sobre la prenda.
interface Foto {
    src: string
    alt: string
}

const escena = document.querySelector<HTMLElement>("[data-carrusel]")
const foto = escena?.querySelector<HTMLImageElement>("[data-foto]")
const fotos: Foto[] = JSON.parse(escena?.dataset.fotos ?? "[]")

if (escena && foto && fotos.length > 1) {
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const puntos = Array.from(escena.querySelectorAll<HTMLButtonElement>("[data-punto]"))
    const estado = escena.querySelector<HTMLElement>("[data-estado]")
    let actual = 0
    let versionCambio = 0

    // Precarga para que el cambio sea instantáneo
    fotos.slice(1).forEach((f) => {
        const pre = new Image()
        pre.src = f.src
    })

    const aplicar = (i: number) => {
        foto.src = fotos[i].src
        foto.alt = fotos[i].alt
        puntos.forEach((p, n) => (n === i ? p.setAttribute("aria-current", "true") : p.removeAttribute("aria-current")))
        if (estado) estado.textContent = `Foto ${i + 1} de ${fotos.length}`
    }

    const ir = (i: number, sentido = 1) => {
        const destino = (i + fotos.length) % fotos.length
        if (destino === actual) return
        actual = destino
        const esta = ++versionCambio
        if (reducir) return aplicar(destino)
        // Sale deslizándose, cambia la foto y entra desde el lado contrario
        foto.style.transition = "transform .18s ease-in, opacity .18s"
        foto.style.transform = `translateX(${-sentido * 8}%)`
        foto.style.opacity = "0"
        window.setTimeout(() => {
            if (esta !== versionCambio) return
            aplicar(destino)
            foto.style.transition = "none"
            foto.style.transform = `translateX(${sentido * 8}%)`
            void foto.offsetWidth
            foto.style.transition = "transform .25s ease-out, opacity .25s"
            foto.style.transform = ""
            foto.style.opacity = ""
        }, 180)
    }

    escena.querySelector("[data-ant]")?.addEventListener("click", () => ir(actual - 1, -1))
    escena.querySelector("[data-sig]")?.addEventListener("click", () => ir(actual + 1, 1))
    puntos.forEach((p, n) => p.addEventListener("click", () => ir(n, n > actual ? 1 : -1)))

    document.addEventListener("keydown", (e) => {
        const t = e.target as HTMLElement
        if (t.closest("input, textarea, select")) return
        if (e.key === "ArrowLeft") ir(actual - 1, -1)
        if (e.key === "ArrowRight") ir(actual + 1, 1)
    })

    // Deslizar con el dedo / ratón sobre la prenda (solo si el gesto es más horizontal que vertical)
    const zona = escena.querySelector<HTMLElement>(".prenda")
    if (zona) {
        zona.style.touchAction = "pan-y"
        let x0 = 0
        let y0 = 0
        let activo = false
        zona.addEventListener("pointerdown", (e) => {
            activo = true
            x0 = e.clientX
            y0 = e.clientY
        })
        const soltar = (e: PointerEvent) => {
            if (!activo) return
            activo = false
            const dx = e.clientX - x0
            const dy = e.clientY - y0
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) ir(actual + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1)
        }
        zona.addEventListener("pointerup", soltar)
        zona.addEventListener("pointercancel", () => (activo = false))
    }
}
