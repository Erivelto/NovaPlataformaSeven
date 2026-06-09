import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface CepAddress {
  cep: string;
  endereco: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface BrasilApiCepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
}

@Injectable({
  providedIn: 'root'
})
export class CepService {
  /** Remove caracteres não numéricos do CEP */
  normalize(cep: string): string {
    return (cep || '').replace(/\D/g, '');
  }

  /** Formata CEP para 12345-678 */
  format(cep: string): string {
    const digits = this.normalize(cep).slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  isValid(cep: string): boolean {
    return this.normalize(cep).length === 8;
  }

  /** Consulta endereço (ViaCEP com fallback BrasilAPI) */
  lookup(cep: string): Observable<CepAddress | null> {
    const digits = this.normalize(cep);
    if (digits.length !== 8) {
      return from(Promise.resolve(null));
    }

    return from(
      this.fetchViaCep(digits)
        .then(result => result ?? this.fetchBrasilApi(digits))
        .catch(() => this.fetchBrasilApi(digits))
    );
  }

  private async fetchViaCep(digits: string): Promise<CepAddress | null> {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) return null;

    const data = (await response.json()) as ViaCepResponse;
    if (!data || data.erro) return null;

    return this.toAddress(digits, {
      endereco: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || ''
    });
  }

  private async fetchBrasilApi(digits: string): Promise<CepAddress | null> {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) return null;

    const data = (await response.json()) as BrasilApiCepResponse;
    if (!data?.city) return null;

    return this.toAddress(digits, {
      endereco: data.street || '',
      complemento: '',
      bairro: data.neighborhood || '',
      cidade: data.city || '',
      uf: data.state || ''
    });
  }

  private toAddress(
    digits: string,
    fields: { endereco: string; complemento: string; bairro: string; cidade: string; uf: string }
  ): CepAddress {
    return {
      cep: this.format(digits),
      endereco: fields.endereco,
      complemento: fields.complemento,
      bairro: fields.bairro,
      cidade: fields.cidade,
      uf: fields.uf.toUpperCase()
    };
  }
}
