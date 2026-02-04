import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DailyService } from '../../services/daily.service';
import { CollaboratorService } from '../../services/collaborator.service';
import { CollaboratorDetailService } from '../../services/collaborator-detail.service';
import { forkJoin } from 'rxjs';

export const BRAZILIAN_DATE_FORMATS = {
  parse: {
    dateInput: ['DD/MM/YYYY']
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@Component({
  selector: 'app-consolidated-by-date-report',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: BRAZILIAN_DATE_FORMATS }
  ],
  templateUrl: './consolidated-by-date-report.html',
  styleUrl: './consolidated-by-date-report.scss'
})
export class ConsolidatedByDateReport implements OnInit, AfterViewInit {
  private dateAdapter = inject(DateAdapter);
  private snackBar = inject(MatSnackBar);
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private collaboratorDetailService = inject(CollaboratorDetailService);
  
  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  loading = false;
  showResults = false;

  displayedColumns: string[] = ['codigo', 'nome', 'valorTotal', 'adiantamento', 'valorDiaria', 'quantidade', 'pix'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.dateAdapter.setLocale('pt-BR');
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  filtrar() {
    // Validar se as datas foram preenchidas
    if (!this.dataInicio) {
      this.snackBar.open('Por favor, selecione a data de início', 'Fechar', { duration: 3000 });
      return;
    }

    if (!this.dataFim) {
      this.snackBar.open('Por favor, selecione a data fim', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar se data início é menor ou igual à data fim
    if (this.dataInicio > this.dataFim) {
      this.snackBar.open('A data de início não pode ser maior que a data fim', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar intervalo máximo (opcional - exemplo: 365 dias)
    const diffTime = Math.abs(this.dataFim.getTime() - this.dataInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      this.snackBar.open('O período não pode ser maior que 365 dias', 'Fechar', { duration: 3000 });
      return;
    }

    this.loading = true;

    // Formatar datas para o formato da API (yyyy-MM-dd)
    const dataInicioFormatada = this.formatDateForAPI(this.dataInicio);
    const dataFimFormatada = this.formatDateForAPI(this.dataFim);

    // Chamar API para buscar diárias do período e colaboradores
    forkJoin({
      diarias: this.dailyService.getByPeriod(dataInicioFormatada, dataFimFormatada),
      colaboradores: this.collaboratorService.getAll()
    }).subscribe({
      next: (result) => {
        // DEBUG: Verificar estrutura dos dados
        console.log('Diarias recebidas:', result.diarias);
        console.log('Colaboradores recebidos:', result.colaboradores);
        
        // Processar dados para consolidar por colaborador
        const consolidado = this.consolidarPorColaborador(result.diarias, result.colaboradores);
        console.log('Consolidado:', consolidado);
        
        this.dataSource.data = consolidado;
        this.loading = false;
        this.showResults = true;
        this.snackBar.open(`${consolidado.length} registro(s) encontrado(s)`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error('Erro ao buscar relatório:', err);
        this.loading = false;
        this.snackBar.open('Erro ao buscar relatório', 'Fechar', { duration: 3000 });
      }
    });
  }

  private consolidarPorColaborador(diarias: any[], colaboradores: any[]): any[] {
    const consolidadoMap = new Map<number, any>();

    // Agrupar diárias por colaborador
    diarias.forEach(diaria => {
      console.log('Processando diaria:', diaria);
      
      const idColaborador = diaria.idColaboradorDetalhe || diaria.idColaborador || diaria.colaboradorId;
      const colaborador = colaboradores.find(c => c.id === idColaborador);
      
      // Pular colaboradores sem nome
      if (!colaborador || !colaborador.nome || colaborador.nome.trim() === '') {
        console.log('Colaborador ignorado - sem nome:', idColaborador);
        return;
      }
      
      if (!consolidadoMap.has(idColaborador)) {
        consolidadoMap.set(idColaborador, {
          codigo: idColaborador,
          nome: colaborador.nome,
          valorTotal: 0,
          adiantamento: 0,
          valorDiaria: 0,
          quantidade: 0,
          pix: colaborador?.pix || '-'
        });
      }
      const item = consolidadoMap.get(idColaborador);
      item.quantidade++;
      
      const valorDiaria = diaria.valor || diaria.valorDiaria || diaria.valorTotal || 0;
      console.log('Valor da diaria:', valorDiaria);
      
      item.valorTotal += valorDiaria;
      item.valorDiaria = valorDiaria;
    });

    return Array.from(consolidadoMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }

  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
