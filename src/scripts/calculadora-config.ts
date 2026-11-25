// Calculadora de importación.
// Todos los valores marcados como EJEMPLO deben reemplazarse por los reales.
export const CONFIG = {
    precioPorKg: 12, // USD por kg cobrado (EJEMPLO)
    taxesDefault: 8, // % de taxes de la marca (el usuario puede cambiarlo) (EJEMPLO)
    impuesto: 5, // % de impuesto adicional, se aplica sobre producto + taxes + envío + servicio
    servicio: { tipo: "porcentaje" as "porcentaje" | "fijo", valor: 10 }, // comisión de la importadora (EJEMPLO)
    tipoCambioBs: 6.96, // Bs por USD (EJEMPLO)
    anticipo: 0.5, // 50% solo para pedidos por encargo
    whatsapp: "59173532233",
}
