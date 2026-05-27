import { ChangeDetectionStrategy, Component, ViewChild, AfterViewInit, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DailyService } from '../../services/daily.service';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../../services/collaborator-detail.service';
import { StationService, Station } from '../../services/station.service';
import { RoleService, Role } from '../../services/role.service';
import { SupervisorService, Supervisor } from '../../services/supervisor.service';
import { CollaboratorSearchComponent } from '../../shared/collaborator-search/collaborator-search';

import { NotificationService } from '../../services/notification.service';
import { Daily } from '../../services/daily.service';
import { DailiesDetailDialog, DailiesDetailDialogData, DailyDetailRow } from './dailies-detail-dialog';
import { NativeDateAdapter } from '@angular/material/core';
import { forkJoin } from 'rxjs';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localePt);

export interface DailyReportData {
  codigo: number;
  quantidade: number;
  colaborador: string;
  diasNoPeriodo: number;
  funcao: string;
  gc: string;
  posto: string;
  data: Date;
  valor: number;
}

export class BrazilianDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  override parse(value: string | null): Date | null {
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return null;
  }
}

export const BRAZILIAN_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-dailies-report',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDialogModule,
    CollaboratorSearchComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: DateAdapter, useClass: BrazilianDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: BRAZILIAN_DATE_FORMATS },
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  templateUrl: './dailies-report.html',
  styleUrl: './dailies-report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailiesReport implements OnInit, AfterViewInit {
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private collaboratorDetailService = inject(CollaboratorDetailService);
  private stationService = inject(StationService);
  private roleService = inject(RoleService);
  private supervisorService = inject(SupervisorService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  // Filtros
  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  colaboradorSelecionado: number | null = null;

  // Listas para options
  colaboradores: Collaborator[] = [];
  postos: Station[] = [];
  roles: Role[] = [];
  supervisors: Supervisor[] = [];
  allDailies: Daily[] = [];
  allDetails: CollaboratorDetail[] = [];

  // Mapas de lookup cruzados via ColaboradorDetalhe
  private detailMap = new Map<number, CollaboratorDetail>();       // idDetalhe → detalhe
  private collaboratorNameMap = new Map<number, string>();         // idColaborador → nome
  private stationNameMap = new Map<number, string>();              // idPosto → nome
  private roleNameMap = new Map<number, string>();                 // idFuncao → nome
  private supervisorNameMap = new Map<number, string>();           // idSupervisor → nome
  
  showResults = false;
  isLoading = false;

  // Paginação manual
  currentPage = 0;
  pageSize = 10;

  displayedColumns: string[] = ['codigo', 'data', 'colaborador', 'valor', 'posto'];
  dataSource = new MatTableDataSource<DailyReportData>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  onCollaboratorChange(collaboratorId: number | null): void {
    this.colaboradorSelecionado = collaboratorId; // null agora é tratado como 'Todos'
    this.applyFilters();
  }

  ngOnInit() {
    forkJoin({
      colaboradores: this.collaboratorService.getAll(),
      postos: this.stationService.getAll(),
      detalhes: this.collaboratorDetailService.getAll(),
      funcoes: this.roleService.getAll(),
      supervisores: this.supervisorService.getAll()
    }).subscribe({
      next: (result) => {
        this.colaboradores = result.colaboradores;
        this.postos = result.postos;
        this.allDetails = result.detalhes;
        this.roles = result.funcoes;
        this.supervisors = result.supervisores;
        this.buildLookupMaps();
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Erro ao carregar dados iniciais');
        this.cdr.markForCheck();
      }
    });
  }

  /** Constrói mapas de lookup cruzando todas as APIs */
  private buildLookupMaps() {
    // Colaborador: id → nome
    for (const c of this.colaboradores) {
      if (c.id) this.collaboratorNameMap.set(c.id, c.nome);
    }
    // Posto: id → nome
    for (const p of this.postos) {
      if (p.id) this.stationNameMap.set(p.id, p.nome);
    }
    // Função: id → nome
    for (const r of this.roles) {
      if (r.id) this.roleNameMap.set(r.id, r.nome);
    }
    // Supervisor/GC: id → nome
    for (const s of this.supervisors) {
      if (s.id) this.supervisorNameMap.set(s.id, s.nome);
    }
    // ColaboradorDetalhe: id → detalhe completo
    for (const d of this.allDetails) {
      if (d.id) this.detailMap.set(d.id, d);
    }
  }

  /** Resolve dados cruzados de um registro de diária via ColaboradorDetalhe */
  private resolveDetail(idColaboradorDetalhe: number) {
    const detail = this.detailMap.get(idColaboradorDetalhe);
    return {
      colaborador: detail ? (this.collaboratorNameMap.get(detail.idColaborador) || 'N/A') : 'N/A',
      posto: detail?.idPosto ? (this.stationNameMap.get(detail.idPosto) || 'N/A') : 'N/A',
      funcao: detail?.idFuncao ? (this.roleNameMap.get(detail.idFuncao) || 'N/A') : 'N/A',
      gc: detail?.idSupervisor ? (this.supervisorNameMap.get(detail.idSupervisor) || 'N/A') : 'N/A',
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.cdr.markForCheck();
  }

  // Métodos removidos - não mais necessários com forkJoin

  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  consultar() {
    // Reset filters to null for fresh data
    this.colaboradorSelecionado = null;

    // Validações
    if (!this.dataInicio || !this.dataFim) {
      this.notify.warn('Por favor, selecione as datas inicial e final');
      return;
    }

    if (this.dataInicio > this.dataFim) {
      this.notify.warn('A data inicial não pode ser maior que a data final');
      return;
    }

    const diffTime = Math.abs(this.dataFim.getTime() - this.dataInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      this.notify.warn('O período não pode ser maior que 365 dias');
      return;
    }

    const startDateStr = this.formatDateForApi(this.dataInicio);
    const endDateStr = this.formatDateForApi(this.dataFim);
    
    this.isLoading = true;

    this.dailyService.getByPeriod(startDateStr, endDateStr).subscribe({
      next: (data) => {
        this.allDailies = data;
        this.showResults = true;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notify.error('Erro ao carregar diárias');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFilters() {
    if (!this.showResults) {
      return;
    }

    let filteredData = [...this.allDailies];

    if (this.colaboradorSelecionado !== null) {
      filteredData = filteredData.filter(daily => daily.idColaboradorDetalhe === this.colaboradorSelecionado);
    }

    // Agrupar diárias por idColaboradorDetalhe para calcular quantidade e dias distintos
    const grouped = new Map<number, { dailies: Daily[], dates: Set<string> }>();
    for (const daily of filteredData) {
      const key = daily.idColaboradorDetalhe;
      if (!grouped.has(key)) {
        grouped.set(key, { dailies: [], dates: new Set() });
      }
      const group = grouped.get(key)!;
      group.dailies.push(daily);
      group.dates.add(daily.dataDiaria.split('T')[0]);
    }

    // Montar linhas do relatório — uma por colaboradorDetalhe
    const reportData: DailyReportData[] = [];
    grouped.forEach((group, idDetalhe) => {
      const resolved = this.resolveDetail(idDetalhe);
      reportData.push({
        codigo: idDetalhe,
        quantidade: group.dailies.length,
        colaborador: resolved.colaborador,
        diasNoPeriodo: group.dates.size,
        funcao: resolved.funcao,
        gc: resolved.gc,
        posto: resolved.posto,
        data: new Date(group.dailies[0].dataDiaria),
        valor: group.dailies.reduce((sum, d) => sum + (d.valor || 0), 0),
      });
    });

    // Ordenar por colaborador
    reportData.sort((a, b) => a.colaborador.localeCompare(b.colaborador));

    this.dataSource = new MatTableDataSource<DailyReportData>(reportData);
    this.currentPage = 0;
    this.cdr.markForCheck();
  }

  // Métodos para paginação manual
  getPaginatedData(): DailyReportData[] {
    if (!this.dataSource?.data) return [];
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.dataSource.data.slice(start, end);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  openDetail(row: DailyReportData) {
    // Filtrar diárias do colaboradorDetalhe selecionado
    const dailiesForDetail = this.allDailies.filter(d => d.idColaboradorDetalhe === row.codigo);

    // Agrupar por data para mostrar quantidade por dia
    const dateMap = new Map<string, number>();
    for (const daily of dailiesForDetail) {
      const dateKey = daily.dataDiaria.split('T')[0];
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    }

    const detalhes: DailyDetailRow[] = Array.from(dateMap.entries())
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => a.data.localeCompare(b.data));

    const dialogData: DailiesDetailDialogData = {
      colaborador: row.colaborador,
      posto: row.posto,
      funcao: row.funcao,
      gc: row.gc,
      totalDiarias: row.quantidade,
      diasNoPeriodo: row.diasNoPeriodo,
      detalhes
    };

    this.dialog.open(DailiesDetailDialog, {
      data: dialogData,
      width: '560px'
    });
  }

  exportExcel() {
    const rows = this.dataSource.data;
    if (!rows || rows.length === 0) {
      this.notify.info('Nenhum registro para exportar');
      return;
    }

    const sep = ';';
    const escapeCell = (val: string) => '"' + val.replace(/"/g, '""') + '"';

    const headers = ['Código', 'Quantidade', 'Colaborador', 'Dias no Período', 'Função', 'GC', 'Posto'];
    const csvLines = [headers.join(sep)];

    for (const r of rows) {
      csvLines.push([
        r.codigo,
        r.quantidade,
        escapeCell(String(r.colaborador ?? '')),
        r.diasNoPeriodo,
        escapeCell(String(r.funcao ?? '')),
        escapeCell(String(r.gc ?? '')),
        escapeCell(String(r.posto ?? ''))
      ].join(sep));
    }

    // Linha de total
    const totalQtd = rows.reduce((s, r) => s + (r.quantidade ?? 0), 0);
    const totalDias = rows.reduce((s, r) => s + (r.diasNoPeriodo ?? 0), 0);
    csvLines.push([
      escapeCell('TOTAL'),
      totalQtd,
      escapeCell(''),
      totalDias,
      escapeCell(''),
      escapeCell(''),
      escapeCell('')
    ].join(sep));

    const filename = `relatorio-diarias-${new Date().toISOString().slice(0, 10)}.csv`;
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
