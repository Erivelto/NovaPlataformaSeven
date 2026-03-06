import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CollaboratorService, Collaborator } from '../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../services/collaborator-detail.service';
import { NotificationService } from '../services/notification.service';
import { ConfirmService } from '../services/confirm.service';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localePt);

@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  templateUrl: './collaborators.html',
  styleUrl: './collaborators.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Collaborators implements OnInit, AfterViewInit {
  private collaboratorService = inject(CollaboratorService);
  private detailService = inject(CollaboratorDetailService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private confirmService = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  displayedColumns: string[] = ['codigo', 'nome', 'dataCadastro', 'userCad', 'dataAlteracao', 'userAlt', 'actions'];
  dataSource = new MatTableDataSource<Collaborator>([]);
  expandedElement: Collaborator | null = null;
  elementDetail: CollaboratorDetail | null = null;
  loadingDetail = false;
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadCollaborators();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCollaborators() {
    this.loading = true;
    this.collaboratorService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao carregar colaboradores da API');
      }
    });
  }

  toggleRow(element: Collaborator) {
    if (this.expandedElement === element) {
      this.expandedElement = null;
      this.elementDetail = null;
    } else {
      this.expandedElement = element;
      this.fetchDetails(element);
    }
    this.cdr.markForCheck();
  }

  fetchDetails(element: Collaborator) {
    if (!element.id) return;
    
    this.loadingDetail = true;
    this.elementDetail = null;

    this.detailService.getByCollaboratorId(element.id).subscribe({
      next: (details) => {
        this.elementDetail = details.length > 0 ? details[0] : { idColaborador: element.id! };
        this.loadingDetail = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingDetail = false;
        this.elementDetail = { idColaborador: element.id! };
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

  addCollaborator() {
    this.router.navigate(['/colaboradores/novo']);
  }

  editCollaborator(collaborator: Collaborator) {
    if (collaborator.id) {
      this.router.navigate(['/colaboradores', collaborator.id, 'editar']);
    }
  }

  deleteCollaborator(collaborator: Collaborator) {
    this.confirmService.confirmDelete(`o colaborador ${collaborator.nome}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed && collaborator.id) {
        this.collaboratorService.delete(collaborator.id).subscribe({
          next: () => {
            this.notify.success('Colaborador excluído com sucesso');
            this.loadCollaborators();
          },
          error: () => {
            this.notify.error('Erro ao excluir colaborador');
          }
        });
      }
    });
  }
}
