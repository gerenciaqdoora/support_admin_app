import { isAuthEndpoint } from './auth-endpoints';

describe('isAuthEndpoint', () => {
  it('reconoce login, refresh y forgot-password', () => {
    expect(isAuthEndpoint('http://localhost/api/v1/login')).toBe(true);
    expect(isAuthEndpoint('http://localhost/api/v1/login/support')).toBe(true);
    expect(isAuthEndpoint('http://localhost/api/v1/refresh')).toBe(true);
    expect(isAuthEndpoint('/api/v1/forgot-password')).toBe(true);
  });

  it('no confunde rutas de negocio que contienen esas palabras', () => {
    expect(isAuthEndpoint('http://localhost/api/v1/nomina/liquidaciones/5/refresh')).toBe(false);
    expect(isAuthEndpoint('http://localhost/api/v1/user-details')).toBe(false);
    expect(isAuthEndpoint('http://localhost/api/v1/login-history')).toBe(false);
    expect(isAuthEndpoint('http://localhost/api/v1/logout/15')).toBe(false);
  });

  it('funciona con la URL ya prefijada por apiUrlInterceptor', () => {
    expect(isAuthEndpoint('https://api.qdoora.cl/api/v1/refresh')).toBe(true);
  });
});
