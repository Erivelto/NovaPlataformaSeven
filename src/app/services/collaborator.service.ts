import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Collaborator {
  id?: number;
  codigo?: number;
  nome: string;
  dataCadastro?: string;
  userCadastro?: string;
  dataAlteracao?: string;
  userAlteracao?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollaboratorService {
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/Colaborador';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(this.apiUrl);
  }

  getById(id: number): Observable<Collaborator> {
    return this.http.get<Collaborator>(`${this.apiUrl}/${id}`);
  }

  create(collaborator: Collaborator): Observable<Collaborator> {
    return this.http.post<Collaborator>(this.apiUrl, collaborator);
  }

  update(id: number, collaborator: Collaborator): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, collaborator);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
