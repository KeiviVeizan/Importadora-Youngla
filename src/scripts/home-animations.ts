// Animaciones de las secciones del inicio.
// Pone la clase "js" en <html>: las reglas que ocultan contenido dependen de ella,
// así que sin JavaScript todo se ve normal.
document.documentElement.classList.add("js")

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches

// 1. Aparición al hacer scroll (una sola vez por elemento)
const elementos = document.querySelectorAll<HTMLElement>("[data-reveal]")
if (reducirMovimiento || !("IntersectionObserver" in window)) {
    elementos.forEach((el) => el.classList.add("is-visible"))
} else {
    const observer = new IntersectionObserver(
        (entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("is-visible")
                    observer.unobserve(entrada.target)
                }
            })
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    )
    elementos.forEach((el) => observer.observe(el))
}

// 2. Progreso de la línea de tiempo ("¿Cómo funciona?")
document.querySelectorAll<HTMLElement>("[data-timeline]").forEach((linea) => {
    let visible = false
    let pendiente = false

    const actualizar = () => {
        pendiente = false
        const rect = linea.getBoundingClientRect()
        const alto = window.innerHeight
        // 0 cuando el borde superior entra por abajo al 80% de la pantalla; 1 cuando el final llega al 60%
        const inicio = alto * 0.8
        const fin = alto * 0.6
        const progreso = (inicio - rect.top) / (rect.height + inicio - fin)
        linea.style.setProperty("--progress", Math.min(1, Math.max(0, progreso)).toFixed(3))
    }
    const pedirActualizacion = () => {
        if (!pendiente) {
            pendiente = true
            requestAnimationFrame(actualizar)
        }
    }

    if (reducirMovimiento) {
        linea.style.setProperty("--progress", "1")
        return
    }

    new IntersectionObserver((entradas) => {
        visible = entradas[0].isIntersecting
        if (visible) pedirActualizacion()
    }).observe(linea)

    window.addEventListener("scroll", () => visible && pedirActualizacion(), { passive: true })
    window.addEventListener("resize", () => visible && pedirActualizacion(), { passive: true })
    actualizar()
})

// 3. Puntos del carrusel de testimonios (solo se ven en móvil)
document.querySelectorAll<HTMLElement>("[data-carousel]").forEach((carrusel) => {
    const dots = carrusel.parentElement?.querySelectorAll<HTMLElement>("[data-carousel-dots] .dot")
    if (!dots || !dots.length) return
    const tarjetas = Array.from(carrusel.children) as HTMLElement[]

    const activar = (indice: number) => dots.forEach((dot, i) => dot.classList.toggle("activo", i === indice))

    let pendiente = false
    carrusel.addEventListener(
        "scroll",
        () => {
            if (pendiente) return
            pendiente = true
            requestAnimationFrame(() => {
                pendiente = false
                const centro = carrusel.scrollLeft + carrusel.clientWidth / 2
                let mejor = 0
                let distancia = Infinity
                tarjetas.forEach((tarjeta, i) => {
                    const d = Math.abs(tarjeta.offsetLeft + tarjeta.offsetWidth / 2 - centro)
                    if (d < distancia) {
                        distancia = d
                        mejor = i
                    }
                })
                activar(mejor)
            })
        },
        { passive: true },
    )

    dots.forEach((dot, i) =>
        dot.addEventListener("click", () => {
            const tarjeta = tarjetas[i]
            if (!tarjeta) return
            carrusel.scrollTo({
                left: tarjeta.offsetLeft - (carrusel.clientWidth - tarjeta.offsetWidth) / 2,
                behavior: reducirMovimiento ? "auto" : "smooth",
            })
        }),
    )
})
