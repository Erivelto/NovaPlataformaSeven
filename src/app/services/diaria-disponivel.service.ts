import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

export interface DiariaDisponivel {
  id?: number;
  quantidadeDiaria: number;
  dataReferencia: string;
  idFuncao?: number;
  idSupervisor?: number;
  idPosto?: number;
  usuarioCadAlt?: string;
  dataCadastro?: string;
  dataAlteracao?: string;
  excluido?: boolean;
  // Campos retornados pelo endpoint /lista
  funcao?: string;
  supervisor?: string;
  posto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiariaDisponivelService {
  private readonly apiUrl = `${environment.apiBaseUrl}/DiariaDisponivel`;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

  getAll(): Observable<DiariaDisponivel[]> {
    return this.http.get<DiariaDisponivel[]>(this.apiUrl);
  }

  getLista(): Observable<DiariaDisponivel[]> {
    return this.http.get<DiariaDisponivel[]>(`${this.apiUrl}/lista`);
  }

  getById(id: number): Observable<DiariaDisponivel> {
    return this.http.get<DiariaDisponivel>(`${this.apiUrl}/${id}`);
  }

  create(item: DiariaDisponivel): Observable<DiariaDisponivel> {
    const user = this.authService.getUserData();
    const payload = {
      ...item,
      usuarioCadAlt: user?.user || 'sistema'
    };
    return this.http.post<DiariaDisponivel>(this.apiUrl, payload);
  }

  update(id: number, item: DiariaDisponivel): Observable<void> {
    const user = this.authService.getUserData();
    const payload = {
      ...item,
      usuarioCadAlt: user?.user || 'sistema'
    };
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
