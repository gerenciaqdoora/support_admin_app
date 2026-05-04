import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { AuthResponse, LoginCredentials, User } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _http = inject(HttpClient);
  private _router = inject(Router);

  // Constants
  private readonly ACCESS_TOKEN_KEY = 'support_access_token';
  private readonly REFRESH_TOKEN_KEY = 'support_refresh_token';
  private readonly USER_KEY = 'support_user';

  // Signals for state management
  public currentUser = signal<User | null>(this._getUserFromStorage());
  public isAuthenticated = computed(() => this.currentUser() !== null);
  public isSupportRole = computed(() => this.currentUser()?.role === 'SUPPORT_ROLE');
  public isAdminRole = computed(() => this.currentUser()?.role === 'ADMIN_ROLE');
  public hasPortalAccess = computed(() => this.isSupportRole() || this.isAdminRole());

  constructor() {}

  /**
   * Authenticates the user and stores tokens
   * @param credentials Login credentials
   * @param type Login type ('support' | 'admin')
   */
  login(credentials: LoginCredentials, type: 'support' | 'admin' = 'support'): Observable<AuthResponse> {
    const endpoint = `/v1/login/${type}`;
    return this._http.post<{ data: AuthResponse }>(endpoint, credentials).pipe(
      map(res => res.data),
      tap((response) => this._setSession(response)),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Logs out the user, invalidates tokens on backend if possible, and clears local storage
   * @param force If true, clears session immediately without backend call
   */
  logout(force: boolean = false): void {
    const user = this.currentUser();
    if (user && !force) {
      // Intentar invalidar la sesión en el backend
      this._http.post(`/v1/logout/${user.id}`, {}).subscribe({
        next: () => this._clearSession(),
        error: () => this._clearSession()
      });
    } else {
      this._clearSession();
    }
  }

  /**
   * Refreshes the access token using the stored refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refresh_token = this.getRefreshToken();
    if (!refresh_token) {
      this._clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    // Usamos el token actual en los headers si es necesario, aunque en QdoorA el refresh se envía a /v1/refresh
    return this._http.post<{ data: AuthResponse }>('/v1/refresh', {}, {
      headers: {
        'Authorization': `Bearer ${refresh_token}`
      }
    }).pipe(
      map(res => res.data),
      tap((response) => this._setSession(response)),
      catchError((error) => {
        this._clearSession();
        return throwError(() => error);
      })
    );
  }

  // --- Utility Methods ---

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private _setSession(authResult: AuthResponse): void {
    // Extract role from JWT if it's missing in the user object (Security hardening QD-01)
    if (!authResult.user.role && authResult.access_token) {
      const decoded = this._decodeToken(authResult.access_token);
      if (decoded && decoded.role) {
        authResult.user.role = decoded.role;
      }
    }

    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, authResult.access_token);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refresh_token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
  }

  private _clearSession(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this._router.navigate(['/login']);
  }

  /**
   * Fetches the navigation structure for the current user
   */
  getNavigation(): Observable<any[]> {
    return this._http.get<{ data: { navigation: any[] } }>('/v1/navigation').pipe(
      map(res => res.data.navigation),
      catchError(error => throwError(() => error))
    );
  }

  private _getUserFromStorage(): User | null {
    const userStr = sessionStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  private _decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}
