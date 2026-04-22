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

  constructor() {}

  /**
   * Authenticates the support agent and stores tokens
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this._http.post<{ data: AuthResponse }>('/v1/login/support', credentials).pipe(
      map(res => res.data),
      tap((response) => this._setSession(response)),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Logs out the user, invalidates tokens on backend if possible, and clears local storage
   */
  logout(): void {
    const user = this.currentUser();
    if (user) {
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
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private _setSession(authResult: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authResult.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refresh_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
  }

  private _clearSession(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this._router.navigate(['/login']);
  }

  private _getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }
}
