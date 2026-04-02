import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService, User } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';

const TIPO_OPCOES = [
  { label: 'Admin',       value: 'A' },
  { label: 'Gerencial',   value: 'G' },
  { label: 'Operacional', value: 'O' }
];

const TIPO_LABELS: Record<string, string> = {
  'A': 'Admin',
  'G': 'Gerencial',
  'O': 'Operacional',
  'C': 'Operacional'  // Tipo legado mapeado para Operacional
};

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule
  ],
  templateUrl: './user-registration.html',
  styleUrl: './user-registration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRegistration implements OnInit, AfterViewInit {
  private userService = inject(UserService);
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  // Modelo para o formulário
  novoUsuario: string = '';
  senhaUsuario: string = '';
  tipoSelecionado: string = '';
  tipos = TIPO_OPCOES;
  hidePassword: boolean = true;
  loading = false;

  displayedColumns: string[] = ['codigo', 'usuario', 'tipo', 'actions'];
  dataSource = new MatTableDataSource<User>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.notify.error('Erro ao carregar usuários da API');
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

  addUser() {
    // Validar campos vazios
    if (!this.novoUsuario || this.novoUsuario.trim() === '') {
      this.notify.warn('O campo de usuário não pode estar vazio');
      return;
    }

    if (!this.senhaUsuario || this.senhaUsuario.trim() === '') {
      this.notify.warn('O campo de senha não pode estar vazio');
      return;
    }

    if (!this.tipoSelecionado) {
      this.notify.warn('Selecione o tipo de usuário');
      return;
    }

    // Validar usuário duplicado
    const usuarioNormalizado = this.novoUsuario.trim().toLowerCase();
    const usuarioExistente = this.dataSource.data.find(
      user => user.user.toLowerCase() === usuarioNormalizado
    );

    if (usuarioExistente) {
      this.notify.warn('Já existe um usuário cadastrado com este nome');
      return;
    }

    const newUser: User = {
      user: this.novoUsuario.trim(),
      password: this.senhaUsuario.trim(),
      tipo: this.tipoSelecionado
    };
    
    this.userService.create(newUser).subscribe({
      next: () => {
        this.notify.success('Usuário adicionado com sucesso!');
        this.novoUsuario = '';
        this.senhaUsuario = '';
        this.tipoSelecionado = '';
        this.loadUsers();
      },
      error: () => {
        this.notify.error('Erro ao cadastrar usuário');
      }
    });
  }

  deleteUser(user: User) {
    this.confirmService.confirmDelete(`o usuário ${user.user}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed && user.id) {
        this.userService.delete(user.id).subscribe({
          next: () => {
            this.notify.success('Usuário excluído com sucesso');
            this.loadUsers();
          },
          error: () => {
            this.notify.error('Erro ao excluir usuário');
          }
        });
      }
    });
  }

  async editUser(user: User) {
    const mod = await import('./edit-user-dialog/edit-user-dialog');
    const DialogCmp = mod.EditUserDialogComponent;

    const dialogRef = this.dialog.open(DialogCmp, {
      data: { user, tipoOpcoes: TIPO_OPCOES },
      width: '400px',
      maxWidth: '96vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.tipo && result.tipo !== user.tipo) {
        const updatedUser = { ...user, tipo: result.tipo };
        this.userService.update(user.id!, updatedUser).subscribe({
          next: () => {
            this.notify.success('Tipo de usuário atualizado com sucesso');
            this.loadUsers();
          },
          error: () => {
            this.notify.error('Erro ao atualizar tipo de usuário');
          }
        });
      }
    });
  }

  getTipoLabel(tipoValue: string): string {
    return TIPO_LABELS[tipoValue] ?? tipoValue;
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
