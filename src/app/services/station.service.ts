import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Station {
  id?: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class StationService {
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/Posto';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Station[]> {
    return this.http.get<Station[]>(this.apiUrl);
  }

  getById(id: number): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}`);
  }

  create(station: Station): Observable<Station> {
    return this.http.post<Station>(this.apiUrl, station);
  }

  update(id: number, station: Station): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, station);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
