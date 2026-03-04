import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Adiantamento {
  id?: number;
  idColaborador: number;
  valor: number;
  data: string;
  dataCadastro?: string;
  userCadastro?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdiantamentoService {
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/Adiantamento';
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

  update(id: number, adiantamento: Adiantamento): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, adiantamento);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
