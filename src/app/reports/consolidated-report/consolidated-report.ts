import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LOCALE_ID } from '@angular/core';
import { DailyService, Daily } from '../../services/daily.service';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../../services/collaborator-detail.service';
import { AdiantamentoService, Adiantamento } from '../../services/adiantamento.service';
import { NotificationService } from '../../services/notification.service';
import { forkJoin, of, catchError } from 'rxjs';

registerLocaleData(localePt);

export interface ConsolidatedData {
  codigo: number;
  nome: string;
  valorTotal: number;
  adiantamento: number;
  valorDiaria: number;
  quantidade: number;
  pix: string;
}

@Component({
  selector: 'app-consolidated-report',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    CurrencyPipe
  ],
  templateUrl: './consolidated-report.html',
  styleUrl: './consolidated-report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsolidatedReport implements OnInit, AfterViewInit {
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private collaboratorDetailService = inject(CollaboratorDetailService);
  private adiantamentoService = inject(AdiantamentoService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  
  displayedColumns: string[] = ['codigo', 'nome', 'valorTotal', 'adiantamento', 'valorDiaria', 'quantidade', 'pix'];
  loading = false;
  data: ConsolidatedData[] = [];
  dataSource = new MatTableDataSource<ConsolidatedData>(this.data);

  // Estatísticas para os boxes
  get totalColaboradores() { return this.data.length; }
  get totalDiarias() { return this.data.reduce((acc, curr) => acc + curr.quantidade, 0); }
  get valorGeral() { return this.data.reduce((acc, curr) => acc + curr.valorTotal, 0); }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.carregarDados();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  carregarDados() {
    this.loading = true;
    
    // Buscar todos os dados necessários em paralelo
    forkJoin({
      diarias: this.dailyService.getAll().pipe(catchError(() => of([] as Daily[]))),
      colaboradores: this.collaboratorService.getAll().pipe(catchError(() => of([] as Collaborator[]))),
      detalhes: this.collaboratorDetailService.getAll().pipe(catchError(() => of([] as CollaboratorDetail[]))),
      adiantamentos: this.adiantamentoService.getAll().pipe(catchError(() => of([] as Adiantamento[])))
    }).subscribe({
      next: (result) => {
        const consolidado = this.consolidarPorColaborador(
          result.diarias,
          result.colaboradores,
          result.detalhes,
          result.adiantamentos
        );
        
        this.data = consolidado;
        this.dataSource.data = consolidado;
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.info(`${consolidado.length} registro(s) carregado(s)`);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao carregar relatório');
      }
    });
  }

  private consolidarPorColaborador(diarias: Daily[], colaboradores: Collaborator[], detalhes: CollaboratorDetail[], adiantamentos: Adiantamento[]): ConsolidatedData[] {
    const consolidadoMap = new Map<number, ConsolidatedData>();

    // Agrupar diárias por colaborador
    diarias.forEach(diaria => {
      const detalhe = detalhes.find(d => d.id === diaria.idColaboradorDetalhe);
      if (!detalhe) return;

      const colaborador = colaboradores.find(c => c.id === detalhe.idColaborador);
      if (!colaborador || !colaborador.nome || colaborador.nome.trim() === '') return;

      if (!consolidadoMap.has(detalhe.idColaborador)) {
        // Calcular adiantamento total para este colaborador (todos os períodos)
        const adiantamentoTotal = adiantamentos
          .filter(a => a.idColaborador === detalhe.idColaborador)
          .reduce((sum, a) => sum + (a.valor || 0), 0);

        consolidadoMap.set(detalhe.idColaborador, {
          codigo: colaborador.codigo || colaborador.id || 0,
          nome: colaborador.nome,
          valorTotal: 0,
          adiantamento: adiantamentoTotal,
          valorDiaria: detalhe.valorDiaria || 0,
          quantidade: 0,
          pix: detalhe?.pix || colaborador?.pix || '-'
        });
      }

      const item = consolidadoMap.get(detalhe.idColaborador);
      if (item) {
        item.quantidade++;
        item.valorTotal += (detalhe.valorDiaria || 0);
      }
    });

    return Array.from(consolidadoMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  exportCsv() {
    // Export all registros carregados na tabela (todas as páginas), não apenas a página atual
    const rows = (this.dataSource && this.dataSource.data && this.dataSource.data.length) ? this.dataSource.data : this.data;
    if (!rows || rows.length === 0) {
      this.notify.info('Nenhum registro para exportar');
      return;
    }

    const headers = ['Código','Nome','Valor Total','Adiantamento','Valor Diária','Quantidade','PIX'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const line = [
        r.codigo,
        '"' + (String(r.nome).replace(/"/g, '""')) + '"',
        (r.valorTotal ?? 0).toFixed(2),
        (r.adiantamento ?? 0).toFixed(2),
        (r.valorDiaria ?? 0).toFixed(2),
        r.quantidade ?? 0,
        '"' + (String(r.pix || '-').replace(/"/g, '""')) + '"'
      ];
      csvLines.push(line.join(','));
    });

    // Linha de totais
    const totalValorTotal = rows.reduce((s, v) => s + (v.valorTotal ?? 0), 0);
    const totalAdiantamento = rows.reduce((s, v) => s + (v.adiantamento ?? 0), 0);
    const totalValorDiaria = rows.reduce((s, v) => s + (v.valorDiaria ?? 0), 0);
    const totalQuantidade = rows.reduce((s, v) => s + (v.quantidade ?? 0), 0);

    const totalsLine = [
      '',
      '"TOTAL"',
      totalValorTotal.toFixed(2),
      totalAdiantamento.toFixed(2),
      totalValorDiaria.toFixed(2),
      totalQuantidade,
      '""'
    ];
    csvLines.push(totalsLine.join(','));

    const csv = csvLines.join('\r\n');
    const filename = `consolidado-${new Date().toISOString().slice(0,10)}.csv`;
    this.downloadFile(csv, filename);
  }

  private downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportRow(row: ConsolidatedData) {
    if (!row) return;
    const headers = ['Código','Nome','Valor Total','Adiantamento','Valor Diária','Quantidade','PIX'];
    const line = [
      row.codigo,
      '"' + (String(row.nome).replace(/"/g, '""')) + '"',
      (row.valorTotal ?? 0).toFixed(2),
      (row.adiantamento ?? 0).toFixed(2),
      (row.valorDiaria ?? 0).toFixed(2),
      row.quantidade ?? 0,
      '"' + (String(row.pix || '-').replace(/"/g, '""')) + '"'
    ];
    const csv = [headers.join(','), line.join(',')].join('\r\n');
    const filename = `consolidado-row-${row.codigo || 'row'}.csv`;
    this.downloadFile(csv, filename);
  }

}