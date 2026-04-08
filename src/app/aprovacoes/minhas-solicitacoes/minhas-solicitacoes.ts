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
import { DatePipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import { AprovacaoService, AprovacaoStage } from '../../services/aprovacao.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-minhas-solicitacoes',
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
    DatePipe
  ],
  templateUrl: './minhas-solicitacoes.html',
  styleUrl: './minhas-solicitacoes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinhasSolicitacoesComponent implements OnInit, AfterViewInit {
  private aprovacaoService = inject(AprovacaoService);
  private notify = inject(NotificationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  displayedColumns: string[] = ['entidade', 'descricao', 'dataSolicitacao', 'status', 'motivo'];
  dataSource = new MatTableDataSource<AprovacaoStage>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadSolicitacoes();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSolicitacoes() {
    this.loading = true;
    const currentUser = this.authService.getUserData();

    // getStages() retorna todos os status; filtramos pelo solicitante atual.
    // Se o endpoint retornar 403 (acesso negado), cai no fallback de minhasSolicitacoes().
    this.aprovacaoService.getStages().pipe(
      catchError(() => this.aprovacaoService.minhasSolicitacoes())
    ).subscribe({
      next: (data) => {
        const minhas = currentUser?.id
          ? data.filter(s => s.idSolicitante === currentUser.id)
          : data;
        this.dataSource.data = minhas;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao carregar solicitações');
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

  statusColor(status: string): string {
    switch (status) {
      case 'Aprovado': return 'accent';
      case 'Rejeitado': return 'warn';
      default: return 'primary';
    }
  }
}
