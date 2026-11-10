export { cn } from "cn"

// Enlaces de menú a otro sitio (p. ej. "Nosotros" → terza.com): se abren en otra pestaña para no
// sacar al cliente de la tienda.
export function externalLinkProps(href: string) {
  return /^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {}
}
