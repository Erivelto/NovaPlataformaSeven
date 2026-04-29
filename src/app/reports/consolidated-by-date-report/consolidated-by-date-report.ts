import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RelatorioService } from '../../services/relatorio.service';
import { NotificationService } from '../../services/notification.service';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localePt);

interface ConsolidatedRow {
  codigo: number;
  nome: string;
  valorTotal: number;
  adiantamento: number;
  valorDiaria: number;
  quantidade: number;
  pix: string;
}

@Component({
  selector: 'app-consolidated-by-date-report',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  templateUrl: './consolidated-by-date-report.html',
  styleUrl: './consolidated-by-date-report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsolidatedByDateReport implements OnInit, AfterViewInit {
  private dateAdapter = inject(DateAdapter);
  private notify = inject(NotificationService);
  private relatorioService = inject(RelatorioService);
  private cdr = inject(ChangeDetectorRef);

  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  loading = false;
  showResults = false;

  displayedColumns: string[] = ['codigo', 'nome', 'valorTotal', 'adiantamento', 'valorDiaria', 'quantidade', 'pix'];
  dataSource = new MatTableDataSource<ConsolidatedRow>([]);

  get totalColaboradores() { return this.dataSource.data.length; }
  get totalDiarias() { return this.dataSource.data.reduce((acc, curr) => acc + curr.quantidade, 0); }
  get valorGeral() { return this.dataSource.data.reduce((acc, curr) => acc + curr.valorTotal, 0); }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.dateAdapter.setLocale('pt-BR');
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filtrar() {
    if (!this.dataInicio) {
      this.notify.warn('Por favor, selecione a data de início');
      return;
    }
    if (!this.dataFim) {
      this.notify.warn('Por favor, selecione a data fim');
      return;
    }
    if (this.dataInicio > this.dataFim) {
      this.notify.warn('A data de início não pode ser maior que a data fim');
      return;
    }
    const diffTime = Math.abs(this.dataFim.getTime() - this.dataInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      this.notify.warn('O período não pode ser maior que 365 dias');
      return;
    }

    this.loading = true;
    const dataInicioFormatada = this.formatDateForAPI(this.dataInicio);
    const dataFimFormatada = this.formatDateForAPI(this.dataFim);

    this.relatorioService.getConsolidadoPorData(dataInicioFormatada, dataFimFormatada).subscribe({
      next: (result) => {
        this.dataSource.data = result.map(r => ({
          codigo: r.idColaborador,
          nome: r.nome,
          valorTotal: r.valorTotal,
          adiantamento: r.adiantamento,
          valorDiaria: parseFloat(r.valorDiaria) || 0,
          quantidade: r.quantidadeDiaria,
          pix: r.pix || '-'
        }));
        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
        this.loading = false;
        this.showResults = true;
        this.cdr.markForCheck();
        this.notify.info(`${this.dataSource.data.length} registro(s) encontrado(s)`);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao buscar relatório');
      }
    });
  }

  exportCsv() {
    const rows = this.dataSource.data;
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
    const filename = `consolidado-por-data-${new Date().toISOString().slice(0, 10)}.csv`;
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

  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }
}