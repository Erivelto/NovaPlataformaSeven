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
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DailyService, Daily } from '../../services/daily.service';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../../services/collaborator-detail.service';
import { AdiantamentoService, Adiantamento } from '../../services/adiantamento.service';
import { NotificationService } from '../../services/notification.service';
import { forkJoin, of, catchError } from 'rxjs';
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
    MatButtonModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: BRAZILIAN_DATE_FORMATS },
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  templateUrl: './consolidated-by-date-report.html',
  styleUrl: './consolidated-by-date-report.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsolidatedByDateReport implements OnInit, AfterViewInit {
  private dateAdapter = inject(DateAdapter);
  private notify = inject(NotificationService);
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private collaboratorDetailService = inject(CollaboratorDetailService);
  private adiantamentoService = inject(AdiantamentoService);
  private cdr = inject(ChangeDetectorRef);
  
  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  loading = false;
  showResults = false;

  displayedColumns: string[] = ['codigo', 'nome', 'valorTotal', 'adiantamento', 'valorDiaria', 'quantidade', 'pix'];
  dataSource = new MatTableDataSource<ConsolidatedRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.dateAdapter.setLocale('pt-BR');
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  formatDate(date: Date | string | null): string {
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
      this.notify.warn('Por favor, selecione a data de início');
      return;
    }

    if (!this.dataFim) {
      this.notify.warn('Por favor, selecione a data fim');
      return;
    }

    // Validar se data início é menor ou igual à data fim
    if (this.dataInicio > this.dataFim) {
      this.notify.warn('A data de início não pode ser maior que a data fim');
      return;
    }

    // Validar intervalo máximo (opcional - exemplo: 365 dias)
    const diffTime = Math.abs(this.dataFim.getTime() - this.dataInicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      this.notify.warn('O período não pode ser maior que 365 dias');
      return;
    }

    this.loading = true;

    // Formatar datas para o formato da API (yyyy-MM-dd)
    const dataInicioFormatada = this.formatDateForAPI(this.dataInicio);
    const dataFimFormatada = this.formatDateForAPI(this.dataFim);

    // Chamar API para buscar diárias do período, colaboradores, detalhes e adiantamentos
    forkJoin({
      diarias: this.dailyService.getByPeriod(dataInicioFormatada, dataFimFormatada).pipe(catchError(() => of([] as Daily[]))),
      colaboradores: this.collaboratorService.getAll().pipe(catchError(() => of([] as Collaborator[]))),
      detalhes: this.collaboratorDetailService.getAll().pipe(catchError(() => of([] as CollaboratorDetail[]))),
      adiantamentos: this.adiantamentoService.getAll().pipe(catchError(() => of([] as Adiantamento[])))
    }).subscribe({
      next: (result) => {
        const consolidado = this.consolidarPorColaborador(result.diarias, result.colaboradores, result.detalhes, result.adiantamentos, dataInicioFormatada, dataFimFormatada);
        
        this.dataSource.data = consolidado;
        this.loading = false;
        this.showResults = true;
        this.cdr.markForCheck();
        this.notify.info(`${consolidado.length} registro(s) encontrado(s)`);
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao buscar relatório');
      }
    });
  }

  private consolidarPorColaborador(diarias: Daily[], colaboradores: Collaborator[], detalhes: CollaboratorDetail[], adiantamentos: Adiantamento[], dataInicio: string, dataFim: string): ConsolidatedRow[] {
    const consolidadoMap = new Map<number, ConsolidatedRow>();

    // Agrupar diárias por colaborador
    diarias.forEach(diaria => {
      const detalhe = detalhes.find(d => d.id === diaria.idColaboradorDetalhe);
      if (!detalhe) return;
      
      const colaborador = colaboradores.find(c => c.id === detalhe.idColaborador);
      
      if (!colaborador || !colaborador.nome || colaborador.nome.trim() === '') return;
      
      if (!consolidadoMap.has(detalhe.idColaborador)) {
        // Calcular adiantamento total para este colaborador no período
        const adiantamentoTotal = adiantamentos
          .filter(a => a.idColaborador === detalhe.idColaborador && a.data >= dataInicio && a.data <= dataFim)
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
      if (!item) return;
      item.quantidade++;
      
      // Usar o valor da diária do detalhe (padrão do colaborador/posto)
      const valorDiaria = detalhe.valorDiaria || 0;
      
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
