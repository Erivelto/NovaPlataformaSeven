import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DailyService, Daily } from '../../services/daily.service';
import { CollaboratorService } from '../../services/collaborator.service';
import { CollaboratorDetailService } from '../../services/collaborator-detail.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dailies-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './dailies-list.html',
  styleUrl: './dailies-list.scss'
})
export class DailiesList implements OnInit, AfterViewInit {
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private detailService = inject(CollaboratorDetailService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['codigo', 'colaborador', 'dataDiaria', 'userCadastro', 'actions'];
  dataSource = new MatTableDataSource<Daily>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadDailies();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadDailies() {
    // Busca Diárias e Colaboradores em paralelo para fazer o "Join" de nomes
    forkJoin({
      dailies: this.dailyService.getAll(),
      collaborators: this.collaboratorService.getAll(),
      details: this.detailService.getAll()
    }).subscribe({
      next: (res) => {
        const processedDailies = res.dailies.map(daily => {
          // Encontra o detalhe para chegar ao Colaborador e ao Nome
          const detail = res.details.find(d => d.id === daily.idColaboradorDetalhe);
          const collaborator = detail ? res.collaborators.find(c => c.id === detail.idColaborador) : null;
          
          return {
            ...daily,
            nomeColaborador: collaborator ? collaborator.nome : 'Sem Nome'
          };
        });

        this.dataSource.data = processedDailies;
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.snackBar.open('Erro ao sincronizar dados da API', 'Fechar', { duration: 3000 });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  deleteDaily(item: Daily) {
    if (confirm(`Deseja realmente excluir esta diária?`)) {
      if (item.id) {
        this.dailyService.delete(item.id).subscribe({
          next: () => {
            this.snackBar.open('Diária excluída com sucesso', 'OK', { duration: 2000 });
            this.loadDailies();
          },
          error: (err) => {
            console.error('Erro ao deletar:', err);
            this.snackBar.open('Erro ao excluir diária', 'Fechar', { duration: 3000 });
          }
        });
      }
    }
  }
}
