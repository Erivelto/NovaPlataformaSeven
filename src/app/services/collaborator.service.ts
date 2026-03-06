import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

export interface Collaborator {
  id?: number;
  codigo?: number;
  nome: string;
  pix?: string;
  referencia?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  dataCadastro?: string;
  dataAlteracao?: string;
  userCad?: string;
  userAlt?: string;
  excluido?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CollaboratorService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Colaborador`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(this.apiUrl);
  }

  getById(id: number): Observable<Collaborator> {
    return this.http.get<Collaborator>(`${this.apiUrl}/${id}`);
  }

  create(collaborator: Partial<Collaborator>): Observable<number> {
    return this.http.post<number>(this.apiUrl, collaborator, { observe: 'body' });
  }

  update(id: number, collaborator: Partial<Collaborator>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, collaborator);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
