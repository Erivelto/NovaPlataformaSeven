import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Daily {
  id?: number;
  idColaboradorDetalhe: number;
  idPosto?: number;
  dataDiaria: string;
  valor?: number;
  dataCadastro?: string;
  userCadastro?: string;
  // Campos auxiliares para exibição (Join no frontend)
  nomeColaborador?: string;
}

export interface PostoFuncaoSuper {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class DailyService {
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/Diaria';
  private readonly apiBaseUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Daily[]> {
    return this.http.get<Daily[]>(this.apiUrl);
  }

  getById(id: number): Observable<Daily> {
    return this.http.get<Daily>(`${this.apiUrl}/${id}`);
  }

  getByCollaboratorDetailId(idColaboradorDetalhe: number): Observable<Daily[]> {
    return this.http.get<Daily[]>(`${this.apiUrl}/colaborador-detalhe/${idColaboradorDetalhe}`);
  }

  getByPeriod(startDate: string, endDate: string): Observable<Daily[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Daily[]>(`${this.apiUrl}/periodo`, { params });
  }

  create(daily: Daily): Observable<Daily> {
    return this.http.post<Daily>(this.apiUrl, daily);
  }

  update(id: number, daily: Daily): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, daily);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getPostoFuncaoSuper(detalheId: number): Observable<PostoFuncaoSuper[]> {
    return this.http.get<PostoFuncaoSuper[]>(`${this.apiBaseUrl}/GetPostoFuncaoSuper?detalhe=${detalheId}`);
  }

  getDatasPeriodos(detalheId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiBaseUrl}/DatasPeriodos?detalhe=${detalheId}`);
  }
}
