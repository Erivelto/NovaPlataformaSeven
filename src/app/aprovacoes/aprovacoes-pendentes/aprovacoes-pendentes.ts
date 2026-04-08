import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { AprovacaoService, AprovacaoStage } from '../../services/aprovacao.service';
import { NotificationService } from '../../services/notification.service';
import { RejeitarDialogComponent } from '../rejeitar-dialog/rejeitar-dialog';

@Component({
  selector: 'app-aprovacoes-pendentes',
  standalone: true,
  imports: [
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
    MatChipsModule,
    MatDialogModule,
    DatePipe
  ],
  templateUrl: './aprovacoes-pendentes.html',
  styleUrl: './aprovacoes-pendentes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AprovacoesPendentesComponent implements OnInit, AfterViewInit {
  private aprovacaoService = inject(AprovacaoService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  displayedColumns: string[] = ['entidade', 'descricao', 'solicitante', 'dataSolicitacao', 'actions'];
  dataSource = new MatTableDataSource<AprovacaoStage>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadPendentes();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPendentes() {
    this.loading = true;
    this.aprovacaoService.pendentes().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao carregar solicitações pendentes');
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

  parsePayload(payloadJson: string): string {
    try {
      const obj = JSON.parse(payloadJson);
      return Object.values(obj).join(' — ');
    } catch {
      return payloadJson;
    }
  }

  aprovar(stage: AprovacaoStage) {
    this.aprovacaoService.aprovar(stage.id).subscribe({
      next: () => {
        this.notify.success('Solicitação aprovada com sucesso!');
        this.loadPendentes();
      },
      error: () => {
        this.notify.error('Erro ao aprovar solicitação');
      }
    });
  }

  rejeitar(stage: AprovacaoStage) {
    const dialogRef = this.dialog.open(RejeitarDialogComponent, {
      width: '450px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((motivo: string | undefined) => {
      if (motivo) {
        this.aprovacaoService.rejeitar(stage.id, motivo).subscribe({
          next: () => {
            this.notify.success('Solicitação rejeitada');
            this.loadPendentes();
          },
          error: () => {
            this.notify.error('Erro ao rejeitar solicitação');
          }
        });
      }
    });
  }
}
