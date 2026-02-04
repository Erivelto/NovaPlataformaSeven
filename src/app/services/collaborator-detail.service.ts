import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/ColaboradorDetalhe';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CollaboratorDetail[]> {
    return this.http.get<CollaboratorDetail[]>(this.apiUrl);
  }

  getById(id: number): Observable<CollaboratorDetail> {
    return this.http.get<CollaboratorDetail>(`${this.apiUrl}/${id}`);
  }

  getByCollaboratorId(idColaborador: number): Observable<CollaboratorDetail> {
    return this.http.get<CollaboratorDetail>(`${this.apiUrl}/colaborador/${idColaborador}`);
  }

  create(detail: CollaboratorDetail): Observable<CollaboratorDetail> {
    return this.http.post<CollaboratorDetail>(this.apiUrl, detail);
  }

  update(id: number, detail: CollaboratorDetail): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, detail);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
