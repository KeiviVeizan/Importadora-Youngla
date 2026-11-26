// Ficha de producto: "desliza para pedir" → caja → WhatsApp.
import { CONFIG } from "./calculadora-config"

const ficha = document.querySelector<HTMLElement>("[data-ficha]")
if (ficha) {
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Pedido
    const tirador = ficha.querySelector<HTMLElement>("[data-tirador]")
    const caja = ficha.querySelector<HTMLElement>("[data-caja]")
    const prenda = ficha.querySelector<HTMLElement>("[data-prenda]")
    const tallas = ficha.querySelector<HTMLElement>("[data-tallas]")
    const pista = ficha.querySelector<HTMLElement>("[data-pista]")
    const disponible = ficha.dataset.disponible === "1"

    if (tirador && caja && prenda) {
        const tallaElegida = () => ficha.querySelector<HTMLInputElement>("input[name=talla]:checked")?.value ?? null

        const urlWhatsApp = (talla: string) => {
            const d = ficha.dataset
            const mensaje =
                `Hola, quiero pedir:\n` +
                `• Producto: ${d.nombre}\n` +
                `• Marca: ${d.marca} (${d.genero})\n` +
                `• Talla: ${talla}\n` +
                `• Precio: $${d.precio} USD\n` +
                `${d.url}`
            return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`
        }

        let ocupado = false
        const MAX = 90 // px máximos de arrastre
        const UMBRAL = 0.6

        const mover = (y: number) => {
            tirador.style.transform = `translateY(${y}px)`
            prenda.style.transform = `translateY(${y * 0.6}px)`
        }
        const volver = (conResorte = true) => {
            const t = conResorte && !reducir ? "transform .45s cubic-bezier(.34,1.56,.64,1)" : "none"
            tirador.style.transition = t
            prenda.style.transition = t
            mover(0)
            window.setTimeout(() => {
                tirador.style.transition = ""
                prenda.style.transition = ""
            }, 500)
        }
        const pedirTalla = () => {
            tallas?.classList.remove("pedir")
            void tallas?.offsetWidth
            tallas?.classList.add("pedir")
            if (pista) pista.textContent = "Elige tu talla"
            volver()
        }

        const completar = (talla: string) => {
            ocupado = true
            const destino = urlWhatsApp(talla)
            if (reducir) {
                window.location.href = destino
                return
            }
            // La prenda cae dentro de la caja
            const pr = prenda.getBoundingClientRect()
            const cr = caja.getBoundingClientRect()
            const dy = cr.top + cr.height * 0.3 - (pr.top + pr.height * 0.5)
            prenda.style.transition = "transform .7s cubic-bezier(.5,0,.75,0), opacity .3s .5s"
            prenda.style.transform = `translateY(${dy}px) scale(.18)`
            prenda.style.opacity = "0"
            tirador.style.transition = "transform .4s, opacity .3s"
            tirador.style.opacity = "0"
            window.setTimeout(() => caja.classList.add("cerrada"), 650)
            window.setTimeout(() => {
                window.location.href = destino
            }, 1500)
        }

        const intentar = () => {
            if (ocupado) return
            if (!disponible) {
                window.open(tirador.getAttribute("href") ?? "#", "_blank", "noopener")
                return
            }
            const talla = tallaElegida()
            if (!talla) return pedirTalla()
            completar(talla)
        }

        // Arrastre
        let inicio = 0
        let arrastrando = false
        let movido = false
        tirador.addEventListener("pointerdown", (e) => {
            if (ocupado || !disponible) return
            arrastrando = true
            movido = false
            inicio = e.clientY
            tirador.setPointerCapture(e.pointerId)
            tirador.style.transition = "none"
            prenda.style.transition = "none"
        })
        tirador.addEventListener("pointermove", (e) => {
            if (!arrastrando) return
            const dy = Math.min(MAX, Math.max(0, e.clientY - inicio))
            if (dy > 6) movido = true
            mover(dy)
        })
        const soltar = (e: PointerEvent) => {
            if (!arrastrando) return
            arrastrando = false
            const dy = Math.min(MAX, Math.max(0, e.clientY - inicio))
            if (movido && dy / MAX >= UMBRAL) {
                const talla = tallaElegida()
                if (!talla) return pedirTalla()
                tirador.style.transition = ""
                prenda.style.transition = ""
                completar(talla)
            } else {
                volver()
            }
        }
        tirador.addEventListener("pointerup", soltar)
        tirador.addEventListener("pointercancel", soltar)

        // Clic / Enter: misma acción sin arrastrar
        tirador.addEventListener("click", (e) => {
            e.preventDefault()
            if (movido) {
                movido = false
                return
            }
            intentar()
        })

        // Al elegir talla se limpia el aviso
        tallas?.addEventListener("change", () => {
            tallas.classList.remove("pedir")
            if (pista && disponible) pista.textContent = "Desliza hacia abajo para pedir"
        })
    }
}
