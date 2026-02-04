import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  user: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/Autenticacao'; 

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

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  validateToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/validate`);
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

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-passwoard`, data);
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

  saveUserData(user: any): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  getUserData(): any {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }
}
