# Investigação: Campos de Adiantamento em Cadastro de Diárias

## 📋 Sumário Executivo

Os campos **Valor do Adiantamento** e **Data do Adiantamento** existem no template HTML mas:
1. ✅ Estão visíveis no formulário
2. ✅ Têm variáveis no component
3. ❌ **NÃO estão sendo enviados ao backend**
4. ❌ **NÃO existem na interface `Daily` da API**
5. ❌ Sem integração com o serviço de gravação

---

## 🔍 Investigação em Detalhes

### 1. **Template HTML** ✅ Existe
**Arquivo**: `src/app/dailies/add-di/add-di.html` (linhas 95-118)

```html
<div class="footer-column">
  <mat-form-field appearance="outline">
    <mat-label>Valor do Adiantamento</mat-label>
    <input matInput type="text"
           [(ngModel)]="valorAdiantamentoStr"
           (blur)="formatarValorAdiantamento()"
           placeholder="0,00">
    <mat-icon matPrefix>payments</mat-icon>
  </mat-form-field>
</div>

<div class="footer-column">
  <mat-form-field appearance="outline">
    <mat-label>Data Adiantamento</mat-label>
    <input matInput [matDatepicker]="picker" [(ngModel)]="dataAdiantamento">
    <mat-hint>DD/MM/AAAA</mat-hint>
    <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
    <mat-datepicker #picker></mat-datepicker>
  </mat-form-field>
</div>
```

**Status**: ✅ Campos visíveis e funcionais no UI

---

### 2. **Component TypeScript** ⚠️ Parcialmente Declaradas
**Arquivo**: `src/app/dailies/add-di/add-di.ts` (linhas 71-77)

```typescript
// Campos de adiantamento
private _valorAdiantamento: number = 0;
dataAdiantamento: Date = new Date();
valorAdiantamentoStr: string = '';
isSaving: boolean = false;
isLoadingDailies: boolean = false;

formatarValorAdiantamento() {
  if (!this.valorAdiantamentoStr) {
    this._valorAdiantamento = 0;
    this.valorAdiantamentoStr = '0,00';
    return;
  }
  let cleaned = this.valorAdiantamentoStr.replace(/[^0-9,\.]/g, '');
  cleaned = cleaned.replace(/,/g, '.');
  const num = parseFloat(cleaned);
  this._valorAdiantamento = isNaN(num) ? 0 : num;
  this.valorAdiantamentoStr = this._valorAdiantamento.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
```

**Status**: ⚠️ Declaradas mas não usadas depois

---

### 3. **Método `saveDailies()`** ❌ NÃO Envia Adiantamentos
**Arquivo**: `src/app/dailies/add-di/add-di.ts` (linhas 243-308)

```typescript
saveDailies() {
  // ... validações ...
  
  // Expande: cada linha com valor=N gera N registros Daily
  const dailiesToSave: Daily[] = [];
  for (const row of selectedRows) {
    for (let i = 0; i < row.valor; i++) {
      dailiesToSave.push({
        idColaboradorDetalhe: row.idColaboradorDetalhe!,
        dataDiaria: row.dataDiaria
        // ❌ FALTAM: valorAdiantamento e dataAdiantamento
      });
    }
  }

  this.isSaving = true;
  this.dailyService.saveDailies(dailiesToSave).subscribe({
    // ...
  });
}
```

**Problema**: Os campos `this._valorAdiantamento` e `this.dataAdiantamento` estão declarados mas **NUNCA são inclusos** no payload

---

### 4. **Serviço Daily** ❌ Interface Incompleta
**Arquivo**: `src/app/services/daily.service.ts` (linhas 5-14)

```typescript
export interface Daily {
  id?: number;
  idColaboradorDetalhe: number;
  idPosto?: number;
  dataDiaria: string;
  valor?: number;
  dataCadastro?: string;
  userCadastro?: string;
  nomeColaborador?: string;
  // ❌ FALTAM:
  // valorAdiantamento?: number;
  // dataAdiantamento?: string;
}
```

**Problema**: Interface `Daily` não tem campos para adiantamento

---

### 5. **Método `saveDailies()`** ❌ Não Contém Lógica de Adiantamento
**Arquivo**: `src/app/services/daily.service.ts` (linhas 57-71)

```typescript
saveDailies(dailies: Daily[]): Observable<Daily[]> {
  const user = this.authService.getUserData();
  const userName = user?.user || 'sistema';

  const requests = dailies.map(d => {
    const payload = {
      idColaboradorDetalhe: d.idColaboradorDetalhe,
      dataDiaria: d.dataDiaria.split('T')[0],
      userCadastro: userName
      // ❌ FALTAM: valorAdiantamento, dataAdiantamento
    };
    return this.http.post<Daily>(this.apiUrl, payload);
  });
  return forkJoin(requests);
}
```

**Status**: ❌ Não envia dados de adiantamento

---

## 🤔 Análise de Onde Os Dados Deveriam Ir

### Opção 1: **Adiantamento por Colaborador (Recomendado)**
Se o adiantamento é para **TODO o colaborador** de uma vez:

- **Tabela Backend**: `Adiantamentos` (nova ou existente)
- **Estrutura**:
  ```json
  {
    "id": 123,
    "idColaborador": 45,
    "valor": 500.00,
    "data": "2026-03-04",
    "descricao": "Adiantamento para diárias"
  }
  ```

**Implementação no Frontend**:
```typescript
interface Adiantamento {
  idColaborador: number;
  valor: number;
  data: string;
  descricao?: string;
}

// No component saveDailies():
if (this._valorAdiantamento > 0 && this.dataAdiantamento) {
  const adiantamento: Adiantamento = {
    idColaborador: this.selectedCollaboratorId,
    valor: this._valorAdiantamento,
    data: this.dataAdiantamento.toISOString().split('T')[0]
  };
  this.adiantamentoService.create(adiantamento).subscribe({
    next: () => {
      // Depois salvar diárias
      this.dailyService.saveDailies(dailiesToSave).subscribe({...});
    }
  });
}
```

---

### Opção 2: **Adiantamento por Diária (Menos Provável)**
Se cada diária pode ter um adiantamento associado:

- **Tabela Backend**: Campo em `Diaria`
- **Estrutura**:
  ```typescript
  interface Daily {
    // ... outros campos
    valorAdiantamento?: number;
    dataAdiantamento?: string;
  }
  ```

**Implementação**:
```typescript
const dailiesToSave: Daily[] = [];
for (const row of selectedRows) {
  for (let i = 0; i < row.valor; i++) {
    dailiesToSave.push({
      idColaboradorDetalhe: row.idColaboradorDetalhe!,
      dataDiaria: row.dataDiaria,
      valorAdiantamento: i === 0 ? this._valorAdiantamento : 0, // Só primeira
      dataAdiantamento: i === 0 ? this.formatDate(this.dataAdiantamento) : null
    });
  }
}
```

---

### Opção 3: **Integrado em Colaborador Detalhe**
Se o adiantamento está relacionado ao detalhe do colaborador:

- **Tabela Backend**: Campos em `ColaboradorDetalhe`
- **Estrutura**:
  ```typescript
  interface CollaboratorDetail {
    // ... outros campos
    valorAdiantamento?: number;
    dataAdiantamento?: string;
    dataUltimoAdiantamento?: string;
  }
  ```

---

## 📊 Resumo das Descobertas

| Componente | Localização | Status | Ação Necessária |
|------------|------------|--------|-----------------|
| **Visual** | HTML template | ✅ Existe | Já implementado |
| **Variáveis** | Component TS | ✅ Existe | Já implementado |
| **Formatação** | `formatarValorAdiantamento()` | ✅ Existe | Funcional |
| **Interface Daily** | Service | ❌ **FALTA** | Adicionar campos |
| **Envio ao backend** | `saveDailies()` | ❌ **FALTA** | Incluir no payload |
| **Backend** | API | ❓ Desconhecido | Verificar se existe tabela |

---

## 🛠️ Recomendações de Correção

### ✅ Se deve ser ADIANTAMENTO SEPARADO (Opção 1):

**1. Criar serviço `adiantamento.service.ts`**:
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Adiantamento {
  id?: number;
  idColaborador: number;
  valor: number;
  data: string;
  descricao?: string;
}

@Injectable({ providedIn: 'root' })
export class AdiantamentoService {
  private apiUrl = 'https://plataformasevenapi.../api/Adiantamentos';

  constructor(private http: HttpClient) {}

  create(adiantamento: Adiantamento): Observable<Adiantamento> {
    return this.http.post<Adiantamento>(this.apiUrl, adiantamento);
  }

  getByColaborador(idColaborador: number): Observable<Adiantamento[]> {
    return this.http.get<Adiantamento[]>(`${this.apiUrl}/colaborador/${idColaborador}`);
  }
}
```

**2. Atualizar `add-di.ts`**:
```typescript
export class AddDi implements OnInit {
  private adiantamentoService = inject(AdiantamentoService);
  
  saveDailies() {
    // ... validações ...
    
    // Salvar adiantamento primeiro
    if (this._valorAdiantamento > 0) {
      const adiantamento: Adiantamento = {
        idColaborador: this.selectedCollaboratorId!,
        valor: this._valorAdiantamento,
        data: this.dataAdiantamento.toISOString().split('T')[0]
      };
      
      this.adiantamentoService.create(adiantamento).subscribe({
        next: () => {
          // Depois salvar diárias
          this.sendDailies(dailiesToSave);
        },
        error: (err) => {
          console.error('Erro ao salvar adiantamento:', err);
          this.snackBar.open('Erro ao salvar adiantamento', 'Fechar', { duration: 3000 });
        }
      });
    } else {
      this.sendDailies(dailiesToSave);
    }
  }
  
  private sendDailies(dailiesToSave: Daily[]) {
    this.isSaving = true;
    this.dailyService.saveDailies(dailiesToSave).subscribe({
      next: () => {
        const total = dailiesToSave.length;
        this.snackBar.open(`${total} diária(s) e adiantamento salvos!`, 'OK', { duration: 3000 });
        this.resetAfterSave();
      },
      error: (err) => {
        console.error('Erro ao salvar diárias:', err);
        this.snackBar.open('Erro ao salvar diárias', 'Fechar', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }
}
```

---

## ❓ Próximas Questões para Esclarecer

1. **Backend tem tabela `Adiantamentos`?** Verificar API
2. **Adiantamento é por colaborador ou por diária?**
3. **Multi-envio necessário?** (Adiantamento + Diárias separadas)
4. **Validações**: Valor mínimo de adiantamento?
5. **Data de adiantamento**: Anterior às diárias? Mesma data?

---

## Conclusão

❌ **Status Atual**: Campos visuais existem mas dados não são persistidos  
✅ **Próximo Passo**: Definir se adiantamento é entidade separada ou campo na Daily  
🎯 **Recomendação**: Opção 1 (Adiantamento Separado) é mais limpa e escalável

