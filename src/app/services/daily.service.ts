import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

export interface Daily {
  id: number;
  quantidade: number;
  nomeColaborador: string;
  diasNoPeriodo: number;
  funcao: string;
  gc: string;
  posto: string;
  idColaboradorDetalhe: number;
  idPosto: number;
  dataDiaria: string;
  valor: number;
}

export interface PostoFuncaoSuper {
  id: number;
  name: string;
}

export interface DiariaDetalheItem {
  dataDiaria: string;
  nomePosto: string;
}

export interface ListaDiariaRelatorio {
  idColaboradorDetalhe: number;
  quantidade: number;
  colaborador: string;
  periodo: string;
  funcao: string;
  supervisor: string;
  posto: string;
  detalhe: DiariaDetalheItem[] | string;
}

@Injectable({
  providedIn: 'root'
})
export class DailyService {
  private readonly apiUrl = `${environment.apiBaseUrl}/Diaria`;
  private authService = inject(AuthService);

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

  update(id: number, daily: Daily): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, daily);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPostoFuncaoSuper(detalheId: number): Observable<PostoFuncaoSuper[]> {
    return this.http.get<PostoFuncaoSuper[]>(`${environment.apiBaseUrl}/GetPostoFuncaoSuper?detalhe=${detalheId}`);
  }

  getDatasPeriodos(detalheId: number): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiBaseUrl}/DatasPeriodos?detalhe=${detalheId}`);
  }

  getListaDiariaRelatorio(dtInicial: string, dtFinal: string, colaborador?: number | null, posto?: number | null): Observable<ListaDiariaRelatorio[]> {
    let params = new HttpParams()
      .set('inicial', dtInicial)
      .set('final', dtFinal);
    if (colaborador) params = params.set('colaborador', colaborador.toString());
    if (posto) params = params.set('posto', posto.toString());
    return this.http.get<ListaDiariaRelatorio[]>(`${environment.apiBaseUrl}/Relatorio/lista-diaria-relatorio`, { params });
  }

  saveDailies(dailies: Daily[]): Observable<Daily[]> {
    const user = this.authService.getUserData();
    const userName = user?.user || 'sistema';

    const requests = dailies.map(d => {
      const payload = {
        idColaboradorDetalhe: d.idColaboradorDetalhe,
        dataDiaria: d.dataDiaria.split('T')[0],
        userCadastro: userName
      };
      return this.http.post<Daily>(this.apiUrl, payload);
    });
    return forkJoin(requests);
  }
}
