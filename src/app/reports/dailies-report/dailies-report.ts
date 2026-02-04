import { Component, ViewChild, AfterViewInit, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DailyService } from '../../services/daily.service';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { StationService, Station } from '../../services/station.service';
import { CollaboratorSearchComponent } from '../../shared/collaborator-search/collaborator-search';
import { Daily } from '../../services/daily.service';
import { NativeDateAdapter } from '@angular/material/core';
import { forkJoin } from 'rxjs';

export interface DailyReportData {
  codigo: number;
  data: Date;
  colaborador: string;
  valor: number;
  posto: string;
}

export class BrazilianDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  override parse(value: any): Date | null {
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
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSnackBarModule,
    CollaboratorSearchComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: DateAdapter, useClass: BrazilianDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: BRAZILIAN_DATE_FORMATS }
  ],
  templateUrl: './dailies-report.html',
  styleUrl: './dailies-report.scss'
})
export class DailiesReport implements OnInit, AfterViewInit {
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private stationService = inject(StationService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  // Filtros
  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  colaboradorSelecionado: number | null = null;
  postoSelecionado: number | null = null;

  // Listas para options
  colaboradores: Collaborator[] = [];
  postos: Station[] = [];
  allDailies: Daily[] = [];
  
  showResults = false;
  isLoading = false;

  // Paginação manual
  currentPage = 0;
  pageSize = 10;

  displayedColumns: string[] = ['codigo', 'data', 'colaborador', 'valor', 'posto'];
  dataSource = new MatTableDataSource<DailyReportData>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  compareById(a: any, b: any): boolean {
    return a === b;
  }

  onCollaboratorChange(collaboratorId: number | null) {
    this.colaboradorSelecionado = collaboratorId;
    this.applyFilters();
  }

  ngOnInit() {
    console.log('Iniciando carregamento de dados...');
    // Carregar colaboradores e postos em paralelo
    forkJoin({
      colaboradores: this.collaboratorService.getAll(),
      postos: this.stationService.getAll()
    }).subscribe({
      next: (result) => {
        this.colaboradores = result.colaboradores;
        this.postos = result.postos;
        console.log('✓ Colaboradores carregados:', this.colaboradores.length);
        console.log('✓ Postos carregados:', this.postos.length);
      },
      error: (err) => {
        console.error('Erro ao carregar dados iniciais:', err);
        this.snackBar.open('Erro ao carregar dados iniciais', 'Fechar', { duration: 3000 });
      }
    });
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
    this.postoSelecionado = null;

    // Validações
    if (!this.dataInicio || !this.dataFim) {
      this.snackBar.open('Por favor, selecione as datas inicial e final', 'Fechar', { duration: 3000 });
      return;
    }

    if (this.dataInicio > this.dataFim) {
      this.snackBar.open('A data inicial não pode ser maior que a data final', 'Fechar', { duration: 3000 });
      return;
    }

    const diffTime = Math.abs(this.dataFim.getTime() - this.dataInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      this.snackBar.open('O período não pode ser maior que 365 dias', 'Fechar', { duration: 3000 });
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
      },
      error: (err) => {
        this.snackBar.open('Erro ao carregar diárias', 'Fechar', { duration: 3000 });
        console.error('Erro ao carregar diárias:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    if (!this.showResults) {
      return;
    }
    
    let filteredData = [...this.allDailies];

    // Filtrar por colaborador - apenas se selecionado
    if (this.colaboradorSelecionado !== null && this.colaboradorSelecionado !== undefined) {
      filteredData = filteredData.filter(daily => 
        daily.idColaboradorDetalhe === this.colaboradorSelecionado
      );
    }

    // Filtrar por posto - apenas se selecionado
    if (this.postoSelecionado !== null && this.postoSelecionado !== undefined) {
      filteredData = filteredData.filter(daily => 
        daily.idPosto === this.postoSelecionado
      );
    }

    // Se filtros zeraram resultados, usa todos os dados
    if (filteredData.length === 0 && this.allDailies.length > 0) {
      filteredData = [...this.allDailies];
    }

    // Transformar para o formato da tabela
    const reportData: DailyReportData[] = [];
    
    for (let i = 0; i < filteredData.length; i++) {
      const daily = filteredData[i];
      const item: DailyReportData = {
        codigo: daily.id || 0,
        data: new Date(daily.dataDiaria),
        colaborador: `ID: ${daily.idColaboradorDetalhe}`,
        valor: daily.valor || 0,
        posto: daily.idPosto ? `ID: ${daily.idPosto}` : 'N/A'
      };
      reportData.push(item);
    }
    
    // Ordenar por data decrescente
    reportData.sort((a, b) => b.data.getTime() - a.data.getTime());
    
    // Criar DataSource com todos os dados
    this.dataSource = new MatTableDataSource<DailyReportData>(reportData);
    this.currentPage = 0; // Reset para primeira página
    
    this.cdr.markForCheck();
  }

  // Métodos para paginação manual
  getPaginatedData(): DailyReportData[] {
    if (!this.dataSource?.data) return [];
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.dataSource.data.slice(start, end);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}
