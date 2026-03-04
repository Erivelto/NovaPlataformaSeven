import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LOCALE_ID } from '@angular/core';
import { DailyService } from '../../services/daily.service';
import { CollaboratorService } from '../../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../../services/collaborator-detail.service';
import { AdiantamentoService } from '../../services/adiantamento.service';
import { forkJoin } from 'rxjs';

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
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    CurrencyPipe,
    DecimalPipe
  ],
  templateUrl: './consolidated-report.html',
  styleUrl: './consolidated-report.scss'
})
export class ConsolidatedReport implements OnInit, AfterViewInit {
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private collaboratorDetailService = inject(CollaboratorDetailService);
  private adiantamentoService = inject(AdiantamentoService);
  private snackBar = inject(MatSnackBar);
  
  displayedColumns: string[] = ['codigo', 'nome', 'valorTotal', 'adiantamento', 'valorDiaria', 'quantidade', 'pix', 'actions'];
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
      diarias: this.dailyService.getAll(),
      colaboradores: this.collaboratorService.getAll(),
      detalhes: this.collaboratorDetailService.getAll(),
      adiantamentos: this.adiantamentoService.getAll()
    }).subscribe({
      next: (result) => {
        console.log('Dados recebidos para consolidated-report:', result);
        
        // Consolidar por colaborador
        const consolidado = this.consolidarPorColaborador(
          result.diarias,
          result.colaboradores,
          result.detalhes,
          result.adiantamentos
        );
        
        this.data = consolidado;
        this.dataSource.data = consolidado;
        this.loading = false;
        this.snackBar.open(`${consolidado.length} registro(s) carregado(s)`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.loading = false;
        this.snackBar.open('Erro ao carregar relatório', 'Fechar', { duration: 3000 });
      }
    });
  }

  private consolidarPorColaborador(diarias: any[], colaboradores: any[], detalhes: CollaboratorDetail[], adiantamentos: any[]): ConsolidatedData[] {
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
}