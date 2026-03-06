import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Supervisor {
  id?: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupervisorService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Supervisor`;

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

  update(id: number, supervisor: Supervisor): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, supervisor);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
