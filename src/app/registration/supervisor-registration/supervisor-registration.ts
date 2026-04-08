import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
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
import { SupervisorService, Supervisor } from '../../services/supervisor.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-supervisor-registration',
  standalone: true,
  imports: [
    FormsModule,
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
  templateUrl: './supervisor-registration.html',
  styleUrl: './supervisor-registration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupervisorRegistration implements OnInit, AfterViewInit {
  private supervisorService = inject(SupervisorService);
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private permissionService = inject(PermissionService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  readonly readOnly = this.permissionService.isReadOnlySignal(7);

  novoSupervisor: string = '';
  loading = false;
  displayedColumns: string[] = ['codigo', 'nome', 'actions'];
  dataSource = new MatTableDataSource<Supervisor>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadSupervisors();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSupervisors() {
    this.loading = true;
    this.supervisorService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao carregar supervisores da API');
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

  addSupervisor() {
    // Validar campo vazio
    if (!this.novoSupervisor || this.novoSupervisor.trim() === '') {
      this.notify.warn('O campo de supervisor não pode estar vazio');
      return;
    }

    // Validar nome duplicado
    const nomeNormalizado = this.novoSupervisor.trim().toLowerCase();
    const supervisorExistente = this.dataSource.data.find(
      supervisor => supervisor.nome.toLowerCase() === nomeNormalizado
    );

    if (supervisorExistente) {
      this.notify.warn('Já existe um supervisor cadastrado com este nome');
      return;
    }

    const newSupervisor: Supervisor = {
      nome: this.novoSupervisor.trim()
    };
    
    this.supervisorService.create(newSupervisor).subscribe({
      next: () => {
        this.notify.success('Supervisor adicionado com sucesso!');
        this.novoSupervisor = '';
        this.loadSupervisors();
      },
      error: () => {
        this.notify.error('Erro ao cadastrar supervisor');
      }
    });
  }

  deleteSupervisor(supervisor: Supervisor) {
    this.confirmService.confirmDelete(`o supervisor ${supervisor.nome}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed && supervisor.id) {
        this.supervisorService.delete(supervisor.id).subscribe({
          next: () => {
            this.notify.success('Supervisor excluído com sucesso');
            this.loadSupervisors();
          },
          error: () => {
            this.notify.error('Erro ao excluir supervisor');
          }
        });
      }
    });
  }
}
