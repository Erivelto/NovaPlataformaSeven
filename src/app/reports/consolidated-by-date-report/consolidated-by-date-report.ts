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
import { CollaboratorDetailService, CollaboratorDetail } from '../../services/collaborator-detail.service';
import { AdiantamentoService } from '../../services/adiantamento.service';
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
  private adiantamentoService = inject(AdiantamentoService);
  
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

    // Chamar API para buscar diárias do período, colaboradores, detalhes e adiantamentos
    forkJoin({
      diarias: this.dailyService.getByPeriod(dataInicioFormatada, dataFimFormatada),
      colaboradores: this.collaboratorService.getAll(),
      detalhes: this.collaboratorDetailService.getAll(),
      adiantamentos: this.adiantamentoService.getAll()
    }).subscribe({
      next: (result) => {
        // DEBUG: Verificar estrutura dos dados
        console.log('Diarias recebidas:', result.diarias);
        console.log('Colaboradores recebidos:', result.colaboradores);
        console.log('Detalhes recebidos:', result.detalhes);
        console.log('Adiantamentos recebidos:', result.adiantamentos);
        
        // Processar dados para consolidar por colaborador
        const consolidado = this.consolidarPorColaborador(result.diarias, result.colaboradores, result.detalhes, result.adiantamentos, dataInicioFormatada, dataFimFormatada);
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

  private consolidarPorColaborador(diarias: any[], colaboradores: any[], detalhes: CollaboratorDetail[], adiantamentos: any[], dataInicio: string, dataFim: string): any[] {
    const consolidadoMap = new Map<number, any>();

    // Agrupar diárias por colaborador
    diarias.forEach(diaria => {
      console.log('Processando diaria:', diaria);
      
      // Encontrar o detalhe pelo ID
      const detalhe = detalhes.find(d => d.id === diaria.idColaboradorDetalhe);
      if (!detalhe) {
        console.log('Detalhe não encontrado para idColaboradorDetalhe:', diaria.idColaboradorDetalhe);
        return;
      }
      
      // Encontrar o colaborador usando o ID do detalhe
      const colaborador = colaboradores.find(c => c.id === detalhe.idColaborador);
      
      // Pular colaboradores sem nome
      if (!colaborador || !colaborador.nome || colaborador.nome.trim() === '') {
        console.log('Colaborador ignorado - sem nome:', detalhe.idColaborador);
        return;
      }
      
      if (!consolidadoMap.has(detalhe.idColaborador)) {
        // Calcular adiantamento total para este colaborador no período
        const adiantamentoTotal = adiantamentos
          .filter(a => a.idColaborador === detalhe.idColaborador && a.data >= dataInicio && a.data <= dataFim)
          .reduce((sum, a) => sum + (a.valor || 0), 0);
        
        consolidadoMap.set(detalhe.idColaborador, {
          codigo: colaborador.codigo || colaborador.id,
          nome: colaborador.nome,
          valorTotal: 0,
          adiantamento: adiantamentoTotal,
          valorDiaria: detalhe.valorDiaria || 0,
          quantidade: 0,
          pix: detalhe?.pix || colaborador?.pix || '-'
        });
      }
      const item = consolidadoMap.get(detalhe.idColaborador);
      item.quantidade++;
      
      // Usar o valor da diária do detalhe (padrão do colaborador/posto)
      const valorDiaria = detalhe.valorDiaria || 0;
      console.log('Valor da diaria do detalhe:', valorDiaria);
      
      item.valorTotal += valorDiaria;
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
