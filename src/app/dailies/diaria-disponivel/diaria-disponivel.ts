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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DiariaDisponivelService, DiariaDisponivel } from '../../services/diaria-disponivel.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { DiariaDisponivelEditDialog } from './diaria-disponivel-edit-dialog';

@Component({
  selector: 'app-diaria-disponivel',
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
    MatProgressBarModule,
    MatDialogModule
  ],
  templateUrl: './diaria-disponivel.html',
  styleUrl: './diaria-disponivel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiariaDisponivelComponent implements OnInit, AfterViewInit {
  private diariaDisponivelService = inject(DiariaDisponivelService);
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  displayedColumns: string[] = ['id', 'dataReferencia', 'quantidadeDiaria', 'posto', 'funcao', 'supervisor', 'actions'];
  dataSource = new MatTableDataSource<DiariaDisponivel>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadData() {
    this.loading = true;

    this.diariaDisponivelService.getLista().subscribe({
      next: (vagas) => {
        this.dataSource.data = vagas.filter(v => !v.excluido);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.notify.error('Erro ao carregar vagas disponíveis');
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

  openDialog(item: DiariaDisponivel | null) {
    const ref = this.dialog.open(DiariaDisponivelEditDialog, {
      width: '480px',
      maxWidth: '95vw',
      data: { item }
    });
    ref.afterClosed().subscribe(saved => {
      if (saved) this.loadData();
    });
  }

  novaVaga() {
    this.openDialog(null);
  }

  editVaga(item: DiariaDisponivel) {
    this.openDialog(item);
  }

  deleteVaga(item: DiariaDisponivel) {
    this.confirmService.confirmDelete('esta vaga').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed && item.id) {
        this.diariaDisponivelService.delete(item.id).subscribe({
          next: () => {
            this.notify.success('Vaga excluída com sucesso');
            this.loadData();
          },
          error: () => {
            this.notify.error('Erro ao excluir vaga');
          }
        });
      }
    });
  }
}
