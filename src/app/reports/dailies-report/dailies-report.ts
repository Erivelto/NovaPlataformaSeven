import { ChangeDetectionStrategy, Component, ViewChild, AfterViewInit, OnInit, inject, ChangeDetectorRef, Injectable } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DailyService, ListaDiariaRelatorio, DiariaDetalheItem } from '../../services/daily.service';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService } from '../../services/collaborator-detail.service';
import { StationService, Station } from '../../services/station.service';
import { RoleService } from '../../services/role.service';
import { SupervisorService } from '../../services/supervisor.service';
import { CollaboratorSearchComponent } from '../../shared/collaborator-search/collaborator-search';
import { NotificationService } from '../../services/notification.service';
import { NativeDateAdapter } from '@angular/material/core';
import { forkJoin } from 'rxjs';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localePt);

@Injectable()
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
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-detalhe-diaria-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, DatePipe],
  template: `
    <h2 mat-dialog-title>Detalhe - {{ data.colaborador }}</h2>
    <mat-dialog-content>
      <div class="table-responsive">
        <table class="detalhe-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Posto</th>
            </tr>
          </thead>
          <tbody>
            @for (item of detalheItems; track $index) {
              <tr>
                <td>{{ item.dataDiaria | date:'dd/MM/yyyy' }}</td>
                <td>{{ item.nomePosto }}</td>
              </tr>
            }
            @if (detalheItems.length === 0) {
              <tr><td colspan="2" style="text-align:center;padding:16px;">Nenhum detalhe disponível.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .detalhe-table { width: 100%; border-collapse: collapse; }
    .detalhe-table th, .detalhe-table td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: left; }
    .detalhe-table th { background: #f5f5f5; font-weight: 600; }
    .detalhe-table tr:last-child td { border-bottom: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalheDiariaDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { colaborador: string; detalhe: DiariaDetalheItem[] | string };

  get detalheItems(): DiariaDetalheItem[] {
    if (!this.data.detalhe) return [];
    if (typeof this.data.detalhe === 'string') {
      try { return JSON.parse(this.data.detalhe); } catch { return []; }
    }
    return this.data.detalhe;
  }
}

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
    MatTooltipModule,
    CollaboratorSearchComponent,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: DateAdapter, useClass: BrazilianDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: BRAZILIAN_DATE_FORMATS },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
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

  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  colaboradorSelecionado: number | null = null;

  colaboradores: Collaborator[] = [];
  postos: Station[] = [];

  showResults = false;
  isLoading = false;

  currentPage = 0;
  pageSize = 10;

  displayedColumns: string[] = ['codigo', 'quantidade', 'colaborador', 'periodo', 'funcao', 'supervisor', 'posto', 'acoes'];
  dataSource = new MatTableDataSource<ListaDiariaRelatorio>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  onCollaboratorChange(collaboratorId: number | null): void {
    this.colaboradorSelecionado = collaboratorId;
  }

  ngOnInit() {
    forkJoin({
      colaboradores: this.collaboratorService.getAll(),
      postos: this.stationService.getAll(),
    }).subscribe({
      next: (result) => {
        this.colaboradores = result.colaboradores;
        this.postos = result.postos;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Erro ao carregar dados iniciais');
        this.cdr.markForCheck();
      },
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.cdr.markForCheck();
  }

  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  consultar() {
    if (!this.dataInicio || !this.dataFim) {
      this.notify.warn('Por favor, selecione as datas inicial e final');
      return;
    }

    if (this.dataInicio > this.dataFim) {
      this.notify.warn('A data inicial não pode ser maior que a data final');
      return;
    }

    const startDateStr = this.formatDateForApi(this.dataInicio);
    const endDateStr = this.formatDateForApi(this.dataFim);
    const colaborador = this.colaboradorSelecionado ?? undefined;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.dailyService.getListaDiariaRelatorio(startDateStr, endDateStr, colaborador).subscribe({
      next: (data) => {
        this.dataSource = new MatTableDataSource<ListaDiariaRelatorio>(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.currentPage = 0;
        this.showResults = true;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Erro ao carregar relatório de diárias');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  exportToCsv(): void {
    const data = this.dataSource.data;
    if (!data.length) return;

    const headers = ['Código', 'Quantidade', 'Colaborador', 'Dias no Período', 'Função', 'GC', 'Posto'];
    const rows = data.map(row => [
      row.idColaboradorDetalhe,
      row.quantidade,
      row.colaborador,
      row.periodo,
      row.funcao,
      row.supervisor,
      row.posto,
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-diarias-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  verDetalhe(row: ListaDiariaRelatorio): void {
    this.dialog.open(DetalheDiariaDialogComponent, {
      width: '500px',
      data: { colaborador: row.colaborador, detalhe: row.detalhe },
    });
  }

  getPaginatedData(): ListaDiariaRelatorio[] {
    if (!this.dataSource?.data) return [];
    const start = this.currentPage * this.pageSize;
    return this.dataSource.data.slice(start, start + this.pageSize);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}
