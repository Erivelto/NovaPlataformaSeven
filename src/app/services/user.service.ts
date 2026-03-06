import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

export interface User {
  id?: number;
  user: string;
  password?: string;
  tipo: string;
  dataCadastro?: string;
  dataAtualizacao?: string;
  userCadatro?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Usuario`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/username/${username}`);
  }

  create(user: User): Observable<User> {
    const currentUser = this.authService.getUserData();
    const userName = currentUser?.user || 'sistema';
    
    const payload = {
      user: user.user,
      password: user.password,
      tipo: user.tipo,
      userCadatro: userName
    };
    
    return this.http.post<User>(this.apiUrl, payload);
  }

  update(id: number, user: User): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, user);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
