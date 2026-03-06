import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface LoginRequest {
  user: string;
  password: string;
}

export interface UserData {
  id?: number;
  user: string;
  tipo: string;
  dataCadastro?: string;
  dataAtualizacao?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user?: UserData;
}

export interface RegisterRequest {
  user: string;
  password: string;
  tipo: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Autenticacao`; 

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken);
          }
          if (response.user) {
            this.saveUserData(response.user);
          }
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<UserData> {
    return this.http.post<UserData>(`${this.apiUrl}/register`, data);
  }

  getMe(): Observable<UserData> {
    return this.http.get<UserData>(`${this.apiUrl}/me`);
  }

  validateToken(): Observable<{ valid: boolean }> {
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/validate`);
  }

  refreshToken(): Observable<LoginResponse> {
    const token = localStorage.getItem('refresh_token');
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh-token`, { refreshToken: token }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
      })
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-passwoard`, data);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  saveUserData(user: UserData): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  getUserData(): UserData | null {
    const data = localStorage.getItem('user_data');
    if (!data) return null;
    try {
      return JSON.parse(data) as UserData;
    } catch {
      localStorage.removeItem('user_data');
      return null;
    }
  }
}
