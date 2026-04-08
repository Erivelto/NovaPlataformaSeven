import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface AprovacaoSolicitacao {
  entidade: string;
  payloadJson: string;
}

export interface AprovacaoStage {
  id: number;
  entidade: string;
  payloadJson: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  nomeSolicitante?: string;
  idSolicitante?: number;
  idAprovador?: number;
  nomeAprovador?: string;
  observacao?: string;
  motivoRejeicao?: string; // alias legado
  dataSolicitacao: string;
  dataDecisao?: string;
}

export interface AprovacaoConfig {
  id?: number;
  entidade: string;
  idUsuarioAprovador: number;
  ativo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AprovacaoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Aprovacao`;
  private http = inject(HttpClient);

  solicitar(solicitacao: AprovacaoSolicitacao): Observable<AprovacaoStage> {
    return this.http.post<AprovacaoStage>(`${this.apiUrl}/solicitar`, solicitacao);
  }

  minhasSolicitacoes(): Observable<AprovacaoStage[]> {
    return this.http.get<AprovacaoStage[]>(`${this.apiUrl}/minhas-solicitacoes`);
  }

  pendentes(): Observable<AprovacaoStage[]> {
    return this.http.get<AprovacaoStage[]>(`${this.apiUrl}/pendentes`);
  }

  aprovar(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/aprovar`, {});
  }

  rejeitar(id: number, motivo: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/rejeitar`, { observacao: motivo });
  }

  getStages(entidade?: string, status?: string): Observable<AprovacaoStage[]> {
    let params = new HttpParams();
    if (entidade) params = params.set('entidade', entidade);
    if (status) params = params.set('status', status);
    return this.http.get<AprovacaoStage[]>(`${this.apiUrl}/stages`, { params });
  }

  getConfigs(): Observable<AprovacaoConfig[]> {
    return this.http.get<AprovacaoConfig[]>(`${this.apiUrl}/config`);
  }

  addConfig(config: { entidade: string; idUsuarioAprovador: number }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/config`, config);
  }

  removeConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/config/${id}`);
  }
}
