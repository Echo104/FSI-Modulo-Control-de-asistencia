/** Clases comunes para inputs, selects y textareas. */
export function claseControl(conError = false): string {
  return [
    'block w-full rounded-md border bg-white px-3 text-base text-tinta shadow-sm sm:text-sm',
    'placeholder:text-tinta-tenue disabled:bg-niebla disabled:text-tinta-suave',
    'focus:outline-none focus:ring-2',
    conError
      ? 'border-rojo-600 focus:border-rojo-600 focus:ring-rojo-600/25'
      : 'border-borde-fuerte focus:border-petroleo-500 focus:ring-petroleo-500/25',
  ].join(' ')
}
