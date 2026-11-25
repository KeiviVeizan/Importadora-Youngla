import { CONFIG } from "./calculadora-config"

export interface Entrada {
    precio: number
    cantidad: number
    taxesPct: number
    pesoUnidad: number
}

export function calcular({ precio, cantidad, taxesPct, pesoUnidad }: Entrada) {
    const limpio = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)
    precio = limpio(precio)
    cantidad = Math.max(1, Math.floor(limpio(cantidad)))
    taxesPct = limpio(taxesPct)
    pesoUnidad = limpio(pesoUnidad)

    const subtotal = precio * cantidad
    const taxes = subtotal * (taxesPct / 100)
    const pesoReal = pesoUnidad * cantidad
    // Redondeo hacia arriba: 1.4 kg -> 2 kg, 4 kg exactos -> 4 kg. El epsilon evita errores de coma flotante.
    const kgCobrados = pesoReal > 0 ? Math.max(1, Math.ceil(pesoReal - 1e-9)) : 0
    const envio = kgCobrados * CONFIG.precioPorKg
    const servicio =
        subtotal > 0
            ? CONFIG.servicio.tipo === "porcentaje"
                ? subtotal * (CONFIG.servicio.valor / 100)
                : CONFIG.servicio.valor
            : 0
    const impuesto = (subtotal + taxes + envio + servicio) * (CONFIG.impuesto / 100)
    const total = Math.round((subtotal + taxes + envio + servicio + impuesto) * 100) / 100

    return {
        cantidad,
        subtotal,
        taxes,
        pesoReal,
        kgCobrados,
        envio,
        servicio,
        impuesto,
        total,
        totalBs: total * CONFIG.tipoCambioBs,
        anticipo: total * CONFIG.anticipo,
        saldo: total - total * CONFIG.anticipo,
    }
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const bs = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" })
const kg = (n: number) => `${n.toLocaleString("es-BO", { maximumFractionDigits: 2 })} kg`

function iniciar(form: HTMLFormElement) {
    const raiz = form.closest<HTMLElement>("[data-calculadora]")!
    const campo = (name: string) => form.elements.namedItem(name) as HTMLInputElement
    const salida = (k: string) => raiz.querySelector<HTMLElement>(`[data-out="${k}"]`)!
    const cta = raiz.querySelector<HTMLAnchorElement>("[data-cta]")!
    const num = (v: string) => parseFloat(v.replace(",", "."))

    const actualizar = () => {
        const r = calcular({
            precio: num(campo("precio").value),
            cantidad: num(campo("cantidad").value),
            taxesPct: num(campo("taxes").value),
            pesoUnidad: num(campo("peso").value),
        })
        salida("subtotal").textContent = usd.format(r.subtotal)
        salida("taxes").textContent = usd.format(r.taxes)
        salida("peso").textContent = r.kgCobrados
            ? `${kg(r.pesoReal)} → ${r.kgCobrados} kg × ${usd.format(CONFIG.precioPorKg)}`
            : "—"
        salida("envio").textContent = usd.format(r.envio)
        salida("servicio").textContent = usd.format(r.servicio)
        salida("impuesto").textContent = usd.format(r.impuesto)
        salida("total").textContent = usd.format(r.total)
        salida("totalBs").textContent = `≈ ${bs.format(r.totalBs)}`
        salida("anticipo").textContent = usd.format(r.anticipo)
        salida("saldo").textContent = usd.format(r.saldo)

        const mensaje = [
            "Hola, hice una estimación en la calculadora:",
            `Producto: ${usd.format(r.subtotal)} (x${r.cantidad})`,
            `Taxes: ${usd.format(r.taxes)}`,
            `Envío (${r.kgCobrados} kg): ${usd.format(r.envio)}`,
            `Servicio: ${usd.format(r.servicio)}`,
            `Impuesto: ${usd.format(r.impuesto)}`,
            `Total estimado: ${usd.format(r.total)}`,
            "¿Me confirman el precio final?",
        ].join("\n")
        cta.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`
        raiz.toggleAttribute("data-vacio", r.total === 0)
    }

    form.addEventListener("input", actualizar)
    form.addEventListener("submit", (e) => e.preventDefault())
    form.addEventListener("reset", () => setTimeout(actualizar))

    // Chips de pesos típicos
    raiz.querySelectorAll<HTMLButtonElement>("[data-peso]").forEach((chip) =>
        chip.addEventListener("click", () => {
            campo("peso").value = chip.dataset.peso!
            actualizar()
        }),
    )
    actualizar()
}

document.querySelectorAll<HTMLFormElement>("[data-calculadora] form").forEach(iniciar)
