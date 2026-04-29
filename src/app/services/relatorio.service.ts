import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ConsolidadoApiResponse {
  idColaborador: number;
  nome: string;
  valorTotal: number;
  valorDiaria: string;
  quantidadeDiaria: number;
  pix: string;
  adiantamento: number;
}

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Relatorio`;

  constructor(private http: HttpClient) {}

  getConsolidado(): Observable<ConsolidadoApiResponse[]> {
    return this.http.get<ConsolidadoApiResponse[]>(`${this.apiUrl}/consolidado`);
  }

  getConsolidadoPorData(dataInicio: string, dataFim: string): Observable<ConsolidadoApiResponse[]> {
    const params = new HttpParams()
      .set('inicial', dataInicio)
      .set('final', dataFim);
    return this.http.get<ConsolidadoApiResponse[]>(`${this.apiUrl}/consolidadoPorData`, { params });
  }
}