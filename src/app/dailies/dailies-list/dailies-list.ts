import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, AfterViewInit, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DailyService, Daily } from '../../services/daily.service';
import { CollaboratorService } from '../../services/collaborator.service';
import { CollaboratorDetailService } from '../../services/collaborator-detail.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dailies-list',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './dailies-list.html',
  styleUrl: './dailies-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailiesList implements OnInit, AfterViewInit {
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private detailService = inject(CollaboratorDetailService);
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
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
    this.loading = true;
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
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Erro ao sincronizar dados da API');
        this.cdr.markForCheck();
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
    this.confirmService.confirmDelete('esta diária').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed && item.id) {
        this.dailyService.delete(item.id).subscribe({
          next: () => {
            this.notify.success('Diária excluída com sucesso');
            this.loadDailies();
          },
          error: () => {
            this.notify.error('Erro ao excluir diária');
          }
        });
      }
    });
  }
}
