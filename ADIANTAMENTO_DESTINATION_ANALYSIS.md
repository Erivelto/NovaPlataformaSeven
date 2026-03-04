# Investigação: Destino dos Dados de Adiantamento - Análise Técnica

## 📊 Status Atual do Sistema

### ✅ O que Existe:
1. **Frontend** - Campos visuais em `add-di.component`
   - `valorAdiantamentoStr` - Formatado com separador decimal
   - `dataAdiantamento` - Data picker
   - Função `formatarValorAdiantamento()` - Funcional

2. **Relatórios** - Campo `adiantamento` exibido
   - `consolidated-report.ts` - Mostra valor em mock data
   - `consolidated-by-date-report.ts` - Inicializa com 0, nunca preenchido

### ❌ O que NÃO Existe:
1. **Serviço de Adiantamentos** - Não há `adiantamento.service.ts`
2. **Interface Diaria** - Sem campos `valorAdiantamento`, `dataAdiantamento`
3. **Interface CollaboratorDetail** - Sem campos de adiantamento
4. **Endpoint Confirmado** - Desconhecido se `/api/Adiantamento` existe
5. **Lógica de Envio** - `saveDailies()` não envia adiantamentos

---

## 🔍 Análise de Opções

### **OPÇÃO 1: Adiantamento como Entidade Separada** ⭐ RECOMENDADA
**Cenário**: Adiantamentos independentes de diárias, rastreáveis separa damente

**Estrutura Backend Esperada**:
```json
POST /api/Adiantamento
{
  "idColaborador": 45,
  "valor": 500.00,
  "data": "2026-03-04",
  "descricao": "Adiantamento para diárias - Semana 10"
}
```

**Vantagens**:
- ✅ Histórico completo de adiantamentos
- ✅ Correlação com outras movimentações
- ✅ Sem duplicar dados em cada Diária
- ✅ Facilita relatórios por período

**Desvantagens**:
- ❌ Requer transação dupla (Adiantamento + Diárias)

**Arquivos a Criar/Modificar**:
```
✅ Criar: adiantamento.service.ts
✅ Modificar: add-di.component.ts (saveDailies method)
✅ Modificar: consolidated-by-date-report.ts (buscar adiantamentos)
```

---

### **OPÇÃO 2: Adiantamento em Diaria (Primeiro Registro)**
**Cenário**: Adiantamento associado apenas à primeira diária do período

**Estrutura Backend Esperada**:
```json
POST /api/Diaria
{
  "idColaboradorDetalhe": 123,
  "dataDiaria": "2026-03-04",
  "valorAdiantamento": 500.00,
  "dataAdiantamento": "2026-03-04"
}
```

**Vantagens**:
- ✅ Uma transação apenas
- ✅ Simples de implementar
- ✅ Menos endpoints

**Desvantagens**:
- ❌ Dados duplicados em cada diária
- ❌ Difícil rastrear quando adiantamento foi realmente criado
- ❌ Consolidação de relatórios complexa

**Arquivos a Modificar**:
```
✅ Modificar: daily.service.ts (interface Daily)
✅ Modificar: add-di.component.ts (preparar payload)
✅ Modificar: consolidated-by-date-report.ts (buscar em Daily)
```

---

### **OPÇÃO 3: Adiantamento em CollaboratorDetail**
**Cenário**: Adiantamento é informação permanente do colaborador

**Estrutura Backend Esperada**:
```json
PUT /api/ColaboradorDetalhe/123
{
  "idColaborador": 45,
  "valorDiaria": 150.00,
  "valorAdiantamento": 500.00,      // ← NOVO
  "dataAdiantamento": "2026-03-04"  // ← NOVO
}
```

**Vantagens**:
- ✅ Centralizado no cadastro
- ✅ Uma transação
- ✅ Fácil de expor em relatórios

**Desvantagens**:
- ❌ Perde histórico de mudanças
- ❌ Novo adiantamento sobrescreve anterior
- ❌ Não diferencia por semana/período

**Arquivos a Modificar**:
```
✅ Modificar: collaborator-detail.service.ts (interface)
✅ Modificar: add-di.component.ts (atualizar detalhe)
✅ Modificar: consolidated-by-date-report.ts (buscar em detalhe)
```

---

## 🎯 Recomendação Final

### **ESCOLHA: OPÇÃO 1 (Adiantamento Separado)**

**Motivos**:
1. **Rastreabilidade**: Cada adiantamento fica registrado com data específica
2. **Escalabilidade**: Permite múltiplos adiantamentos por colaborador/período
3. **Relatórios**: Facilita consolidações futuras por período de adiantamentos
4. **Normalização**: Segue padrão backend (entidades independentes)
5. **Auditoria**: Histórico completo sem sobrescrita

### **Estrutura Esperada da API**:

```typescript
// Backend esperado
POST /api/Adiantamento
GET  /api/Adiantamento
GET  /api/Adiantamento/:id
GET  /api/Adiantamento/colaborador/:idColaborador
PUT  /api/Adiantamento/:id
DELETE /api/Adiantamento/:id

// Interface
interface Adiantamento {
  id?: number;
  idColaborador: number;
  valor: number;
  data: string;        // YYYY-MM-DD
  descricao?: string;
  dataCriacao?: string;
  userCriacao?: string;
  dataAlteracao?: string;
  userAlteracao?: string;
}
```

---

## 📋 Plano de Implementação

### **Fase 1: Criar Serviço**
**Arquivo**: `src/app/services/adiantamento.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Adiantamento {
  id?: number;
  idColaborador: number;
  valor: number;
  data: string;
  descricao?: string;
  dataCriacao?: string;
  userCriacao?: string;
}

@Injectable({ providedIn: 'root' })
export class AdiantamentoService {
  private readonly apiUrl = 'https://plataformasevenapi-czf4d3ccdea4hvg4.eastus-01.azurewebsites.net/api/Adiantamento';

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
      .set('idColaborador', idColaborador)
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Adiantamento[]>(`${this.apiUrl}/periodo`, { params });
  }

  create(adiantamento: Adiantamento): Observable<Adiantamento> {
    return this.http.post<Adiantamento>(this.apiUrl, adiantamento);
  }

  update(id: number, adiantamento: Adiantamento): Observable<Adiantamento> {
    return this.http.put<Adiantamento>(`${this.apiUrl}/${id}`, adiantamento);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
```

### **Fase 2: Modificar Component**
**Arquivo**: `src/app/dailies/add-di/add-di.ts` - Método `saveDailies()`

```typescript
saveDailies() {
  if (!this.selectedCollaboratorId) {
    this.snackBar.open('Selecione um colaborador primeiro', 'Fechar', { duration: 3000 });
    return;
  }

  const selectedRows = this.selection.selected;
  if (selectedRows.length === 0) {
    this.snackBar.open('Selecione ao menos uma diária para enviar', 'Fechar', { duration: 3000 });
    return;
  }

  // Preparar diárias
  const dailiesToSave: Daily[] = [];
  for (const row of selectedRows) {
    for (let i = 0; i < row.valor; i++) {
      dailiesToSave.push({
        idColaboradorDetalhe: row.idColaboradorDetalhe!,
        dataDiaria: row.dataDiaria
      });
    }
  }

  // Se tem adiantamento, criar primeiro
  if (this._valorAdiantamento > 0 && this.dataAdiantamento) {
    this.adiantamentoService.create({
      idColaborador: this.selectedCollaboratorId,
      valor: this._valorAdiantamento,
      data: this.dataAdiantamento.toISOString().split('T')[0],
      descricao: 'Adiantamento para diárias'
    }).subscribe({
      next: () => {
        // Depois salvar diárias
        this.enviarDiarias(dailiesToSave);
      },
      error: (err) => {
        console.error('Erro ao salvar adiantamento:', err);
        this.snackBar.open('Erro ao salvar adiantamento', 'Fechar', { duration: 3000 });
        this.isSaving = false;
      }
    });
  } else {
    // Sem adiantamento, só salva diárias
    this.enviarDiarias(dailiesToSave);
  }
}

private enviarDiarias(dailiesToSave: Daily[]) {
  this.isSaving = true;
  this.dailyService.saveDailies(dailiesToSave).subscribe({
    next: () => {
      const totalMsg = this._valorAdiantamento > 0 
        ? `Adiantamento + ${dailiesToSave.length} diária(s) salva(s)!`
        : `${dailiesToSave.length} diária(s) salva(s)!`;
      
      this.snackBar.open(totalMsg, 'OK', { duration: 3000 });
      this.resetAfterSave();
    },
    error: (err) => {
      console.error('Erro ao salvar diárias:', err);
      this.snackBar.open('Erro ao salvar diárias', 'Fechar', { duration: 3000 });
      this.isSaving = false;
    }
  });
}
```

### **Fase 3: Atualizar Relatórios**
**Arquivo**: `src/app/reports/consolidated-by-date-report/consolidated-by-date-report.ts`

```typescript
filtrar() {
  // ... validações ...
  
  this.loading = true;
  const dataInicioFormatada = this.formatDateForAPI(this.dataInicio);
  const dataFimFormatada = this.formatDateForAPI(this.dataFim);

  // Buscar dados incluindo adiantamentos
  forkJoin({
    diarias: this.dailyService.getByPeriod(dataInicioFormatada, dataFimFormatada),
    colaboradores: this.collaboratorService.getAll(),
    detalhes: this.collaboratorDetailService.getAll(),
    adiantamentos: this.adiantamentoService.getByPeriod(null, dataInicioFormatada, dataFimFormatada) // Em utils
  }).subscribe({
    next: (result) => {
      const consolidado = this.consolidarPorColaborador(
        result.diarias,
        result.colaboradores,
        result.detalhes,
        result.adiantamentos  // ← NOVO
      );
      this.dataSource.data = consolidado;
      // ...
    }
  });
}

private consolidarPorColaborador(
  diarias: any[],
  colaboradores: any[],
  detalhes: CollaboratorDetail[],
  adiantamentos?: Adiantamento[]  // ← NOVO
): any[] {
  // Criar mapa de adiantamentos por colaborador
  const adiantamentosMap = new Map<number, number>();
  adiantamentos?.forEach(a => {
    const total = (adiantamentosMap.get(a.idColaborador) || 0) + a.valor;
    adiantamentosMap.set(a.idColaborador, total);
  });

  const consolidadoMap = new Map<number, any>();
  
  diarias.forEach(diaria => {
    const detalhe = detalhes.find(d => d.id === diaria.idColaboradorDetalhe);
    if (!detalhe) return;
    
    const colaborador = colaboradores.find(c => c.id === detalhe.idColaborador);
    if (!colaborador?.nome) return;
    
    if (!consolidadoMap.has(detalhe.idColaborador)) {
      consolidadoMap.set(detalhe.idColaborador, {
        codigo: colaborador.codigo || colaborador.id,
        nome: colaborador.nome,
        valorTotal: 0,
        adiantamento: adiantamentosMap.get(detalhe.idColaborador) || 0, // ← AGORA PREENCHIDO
        valorDiaria: detalhe.valorDiaria || 0,
        quantidade: 0,
        pix: detalhe?.pix || colaborador?.pix || '-'
      });
    }
    
    const item = consolidadoMap.get(detalhe.idColaborador);
    item.quantidade++;
    item.valorTotal += (detalhe.valorDiaria || 0);
  });

  return Array.from(consolidadoMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
}
```

---

## ✅ Verificação de Compatibilidade

- ✅ Padrão de API consistente: `/api/Adiantamento` → `/api/Diaria`, `/api/Colaborador`, etc.
- ✅ Estrutura de interface: Segue padrão do projeto
- ✅ Método HTTP: POST, GET, PUT, DELETE - Padrão REST
- ✅ Transações: Adiantamento → Diárias (ordem lógica)
- ✅ Relatórios: Facilita agregação por período

---

## 🎓 Conclusão

**📌 Recomendação Final**:
1. **Primeiro passo**: Confirmar com backend se `/api/Adiantamento` existe
2. **Se existir**: Implementar Opção 1 (Entidade Separada)
3. Se NÃO existir: Solicitar criação do endpoint ou usar Opção 2 (campo em Daily)

**Prazo Estimado**: 
- Opção 1: 2-3 horas (criar serviço + modificar component + relatório)
- Opção 2: 1-2 horas (modificar apenas interfaces y controllers)
