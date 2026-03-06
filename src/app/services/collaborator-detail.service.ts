import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface DetailOption {
  id: number;
  descricao: string;
}

export interface CollaboratorDetail {
  id?: number;
  idColaborador: number;
  valorDiaria?: number;
  idFuncao?: number;
  idSupervisor?: number;
  idPosto?: number;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  pix?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  observacao?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollaboratorDetailService {
  private readonly apiUrl = `${environment.apiBaseUrl}/ColaboradorDetalhe`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CollaboratorDetail[]> {
    return this.http.get<CollaboratorDetail[]>(this.apiUrl);
  }

  getById(id: number): Observable<CollaboratorDetail> {
    return this.http.get<CollaboratorDetail>(`${this.apiUrl}/${id}`);
  }

  getByCollaboratorId(idColaborador: number): Observable<CollaboratorDetail[]> {
    return this.http.get<CollaboratorDetail[]>(`${this.apiUrl}/colaborador/${idColaborador}`);
  }

  getSelectOptions(idColaborador: number): Observable<DetailOption[]> {
    return this.http.get<DetailOption[]>(`${this.apiUrl}/select/${idColaborador}`);
  }

  create(detail: Partial<CollaboratorDetail>): Observable<CollaboratorDetail> {
    return this.http.post<CollaboratorDetail>(this.apiUrl, detail);
  }

  update(id: number, detail: CollaboratorDetail): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, detail);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
