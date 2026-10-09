/**
 * Endpoints de autenticación: no llevan el access token ni disparan una renovación ante un 401.
 * El logout NO está aquí a propósito: necesita el access token para que el servidor revoque la sesión.
 */
const AUTH_ENDPOINT = /\/v1\/(login(\/(admin|support))?|refresh|forgot-password)$/;

export function isAuthEndpoint(url: string): boolean {
  let path: string;
  try {
    path = new URL(url, 'http://localhost').pathname;
  } catch {
    path = url.split('?')[0];
  }
  return AUTH_ENDPOINT.test(path.replace(/\/+$/, ''));
}
