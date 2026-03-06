import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

export interface Adiantamento {
  id?: number;
  idColaborador: number;
  data: string;
  userCadastro?: string;
  valor: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdiantamentoService {
  private readonly apiUrl = `${environment.apiBaseUrl}/DiariaDesconto`;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Adiantamento[]> {
    return this.http.get<Adiantamento[]>(this.apiUrl);
  }

  getById(id: number): Observable<Adiantamento> {
    return this.http.get<Adiantamento>(`${this.apiUrl}/${id}`);
  }

  getByColaborador(idColaborador: number): Observable<Adiantamento[]> {
    return this.http.get<Adiantamento[]>(`${this.apiUrl}/colaborador/${idColaborador}`);
  }

  getByPeriod(idColaborador: number, startDate: string, endDate: string): Observable<Adiantamento[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Adiantamento[]>(`${this.apiUrl}/colaborador/${idColaborador}/periodo`, { params });
  }

  create(adiantamento: Adiantamento): Observable<Adiantamento> {
    const user = this.authService.getUserData();
    const userName = user?.user || 'sistema';

    const payload = {
      ...adiantamento,
      userCadastro: userName
    };

    return this.http.post<Adiantamento>(this.apiUrl, payload);
  }

  update(id: number, adiantamento: Adiantamento): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, adiantamento);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
