import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Supervisor {
  id?: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupervisorService {
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/Supervisor';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Supervisor[]> {
    return this.http.get<Supervisor[]>(this.apiUrl);
  }

  getById(id: number): Observable<Supervisor> {
    return this.http.get<Supervisor>(`${this.apiUrl}/${id}`);
  }

  create(supervisor: Supervisor): Observable<Supervisor> {
    return this.http.post<Supervisor>(this.apiUrl, supervisor);
  }

  update(id: number, supervisor: Supervisor): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, supervisor);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
