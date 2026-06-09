import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../environments/environment';

export interface DetailOption {
  id: number;
  descricao: string;
}

export interface CollaboratorDetail {
  id?: number;
  idColaborador: number;
  valorDiaria?: number;
  idFuncao?: number;
  idSupervisor?: number;
  idPosto?: number;
  periodo?: string | null;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  pix?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  observacao?: string;
  excluido?: boolean;
  dataCadastro?: string;
  dataAlteracao?: string;
  userCad?: string;
  userAlt?: string;
}

/** Campos aceitos pelo POST da API */
export interface CollaboratorDetailWrite {
  id?: number;
  idColaborador: number;
  valorDiaria: number;
  idFuncao: number;
  idSupervisor: number;
  idPosto: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollaboratorDetailService {
  private readonly apiUrl = `${environment.apiBaseUrl}/ColaboradorDetalhe`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CollaboratorDetail[]> {
    return this.http.get<CollaboratorDetail[]>(this.apiUrl);
  }

  getById(id: number): Observable<CollaboratorDetail> {
    return this.http.get<CollaboratorDetail>(`${this.apiUrl}/${id}`);
  }

  getByCollaboratorId(idColaborador: number): Observable<CollaboratorDetail[]> {
    return this.http.get<CollaboratorDetail[]>(`${this.apiUrl}/colaborador/${idColaborador}`);
  }

  getSelectOptions(idColaborador: number): Observable<DetailOption[]> {
    return this.http.get<DetailOption[]>(`${this.apiUrl}/select/${idColaborador}`);
  }

  create(detail: Partial<CollaboratorDetail>): Observable<CollaboratorDetail> {
    return this.http.post<CollaboratorDetail>(
      this.apiUrl,
      this.toCreatePayload({ id: 0, ...detail })
    );
  }

  /**
   * PUT: busca o registro atual, aplica alterações e reenvia o objeto completo
   * (sem propriedades null), padrão esperado por APIs .NET.
   */
  update(id: number, changes: Partial<CollaboratorDetail>): Observable<void> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const payload = this.toUpdatePayload({ ...existing, ...changes, id });
        return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Payload mínimo para POST (cadastro) */
  toCreatePayload(detail: Partial<CollaboratorDetail>): CollaboratorDetailWrite {
    const payload: CollaboratorDetailWrite = {
      idColaborador: Number(detail.idColaborador),
      valorDiaria: Number(detail.valorDiaria),
      idFuncao: Number(detail.idFuncao),
      idSupervisor: Number(detail.idSupervisor),
      idPosto: Number(detail.idPosto),
    };

    if (detail.id !== undefined && detail.id !== null) {
      payload.id = Number(detail.id);
    }

    return payload;
  }

  /** Payload para PUT: mescla com GET e remove null/undefined */
  private toUpdatePayload(detail: CollaboratorDetail): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(detail)) {
      if (value !== null && value !== undefined) {
        payload[key] = value;
      }
    }

    return payload;
  }
}
