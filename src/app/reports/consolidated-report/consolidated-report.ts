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
import { RelatorioService } from '../../services/relatorio.service';
import { NotificationService } from '../../services/notification.service';

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
  private relatorioService = inject(RelatorioService);
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
    this.relatorioService.getConsolidado().subscribe({
      next: (result) => {
        this.data = result.map(r => ({
          codigo: r.idColaborador,
          nome: r.nome,
          valorTotal: r.valorTotal,
          adiantamento: r.adiantamento,
          valorDiaria: parseFloat(r.valorDiaria) || 0,
          quantidade: r.quantidadeDiaria,
          pix: r.pix || '-'
        }));
        this.dataSource.data = this.data;
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.info(`${this.data.length} registro(s) carregado(s)`);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao carregar relatório');
      }
    });
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  exportCsv() {
    const rows = (this.dataSource && this.dataSource.data && this.dataSource.data.length) ? this.dataSource.data : this.data;
    if (!rows || rows.length === 0) {
      this.notify.info('Nenhum registro para exportar');
      return;
    }
    const sep = ';';
    const formatBRL = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
    const escapeCell = (val: string) => '"' + val.replace(/"/g, '""') + '"';

    const headers = ['Código', 'Nome', 'Valor Total', 'Adiantamento', 'Valor Diária', 'Quantidade', 'Chave PIX'];
    const csvLines = [headers.join(sep)];
    rows.forEach(r => {
      csvLines.push([
        r.codigo,
        escapeCell(String(r.nome ?? '')),
        escapeCell(formatBRL(r.valorTotal)),
        escapeCell(formatBRL(r.adiantamento)),
        escapeCell(formatBRL(r.valorDiaria)),
        r.quantidade ?? 0,
        escapeCell(String(r.pix || '-'))
      ].join(sep));
    });
    const totalValorTotal = rows.reduce((s, v) => s + (v.valorTotal ?? 0), 0);
    const totalAdiantamento = rows.reduce((s, v) => s + (v.adiantamento ?? 0), 0);
    const totalValorDiaria = rows.reduce((s, v) => s + (v.valorDiaria ?? 0), 0);
    const totalQuantidade = rows.reduce((s, v) => s + (v.quantidade ?? 0), 0);
    csvLines.push([
      escapeCell('TOTAL'),
      escapeCell(''),
      escapeCell(formatBRL(totalValorTotal)),
      escapeCell(formatBRL(totalAdiantamento)),
      escapeCell(formatBRL(totalValorDiaria)),
      totalQuantidade,
      escapeCell('')
    ].join(sep));
    const filename = `consolidado-${new Date().toISOString().slice(0, 10)}.csv`;
    this.downloadFile('\ufeff' + csvLines.join('\r\n'), filename);
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
}