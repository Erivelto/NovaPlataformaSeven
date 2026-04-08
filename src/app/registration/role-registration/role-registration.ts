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
import { RoleService, Role } from '../../services/role.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-role-registration',
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
  templateUrl: './role-registration.html',
  styleUrl: './role-registration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleRegistration implements OnInit, AfterViewInit {
  private roleService = inject(RoleService);
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private permissionService = inject(PermissionService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  readonly readOnly = this.permissionService.isReadOnlySignal(8);

  novaFuncao: string = '';
  loading = false;
  displayedColumns: string[] = ['codigo', 'nome', 'actions'];
  dataSource = new MatTableDataSource<Role>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadRoles();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadRoles() {
    this.loading = true;
    this.roleService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao carregar funções da API');
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

  addRole() {
    // Validar campo vazio
    if (!this.novaFuncao || this.novaFuncao.trim() === '') {
      this.notify.warn('O campo de função não pode estar vazio');
      return;
    }

    // Validar nome duplicado
    const nomeNormalizado = this.novaFuncao.trim().toLowerCase();
    const funcaoExistente = this.dataSource.data.find(
      role => role.nome.toLowerCase() === nomeNormalizado
    );

    if (funcaoExistente) {
      this.notify.warn('Já existe uma função cadastrada com este nome');
      return;
    }

    const newRole: Role = {
      nome: this.novaFuncao.trim()
    };
    
    this.roleService.create(newRole).subscribe({
      next: () => {
        this.notify.success('Função adicionada com sucesso!');
        this.novaFuncao = '';
        this.loadRoles();
      },
      error: () => {
        this.notify.error('Erro ao cadastrar função');
      }
    });
  }

  deleteRole(role: Role) {
    this.confirmService.confirmDelete(`a função ${role.nome}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed && role.id) {
        this.roleService.delete(role.id).subscribe({
          next: () => {
            this.notify.success('Função excluída com sucesso');
            this.loadRoles();
          },
          error: () => {
            this.notify.error('Erro ao excluir função');
          }
        });
      }
    });
  }
}
