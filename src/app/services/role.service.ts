import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Role {
  id?: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/funcao';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  create(role: Role): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role);
  }

  update(id: number, role: Role): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, role);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
