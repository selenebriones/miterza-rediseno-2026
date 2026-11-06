// Ruta interna a la que se vuelve después de ingresar o crear cuenta (?desde=/checkout).
// Las acciones del servidor la vuelven a validar antes de redirigir.
export function readReturnPath(value: string | string[] | undefined) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/admin") && !path.startsWith("/cuenta/")
    ? path
    : "/cuenta";
}
