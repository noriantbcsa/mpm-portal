/**
 * Placeholder ligero para imágenes que llegan por URL desde la base de datos.
 * Next puede desenfocarlo y reemplazarlo de forma nativa cuando termina de
 * descargar la imagen real, sin JavaScript ni una segunda petición. Se mantiene
 * mínimo (sin texto: el desenfoque lo haría ilegible) porque se repite en cada
 * imagen de la página y viaja dos veces en el HTML.
 */
export const IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 32%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%22%231f2524%22/%3E%3Cstop offset=%22.5%22 stop-color=%22%2357605b%22/%3E%3Cstop offset=%221%22 stop-color=%22%23b59c85%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%2224%22 height=%2232%22 fill=%22url(%23g)%22/%3E%3Ccircle cx=%224%22 cy=%227%22 r=%228%22 fill=%22%23d9c7b7%22 fill-opacity=%22.6%22/%3E%3Ccircle cx=%2221%22 cy=%2225%22 r=%229%22 fill=%22%231b352d%22 fill-opacity=%22.6%22/%3E%3C/svg%3E";
