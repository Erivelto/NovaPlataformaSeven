import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService, User } from '../../services/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

const TIPO_OPCOES = [
  { label: 'Admin', value: 'A' },
  { label: 'Comum', value: 'C' }
];

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [
    CommonModule,
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
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './user-registration.html',
  styleUrl: './user-registration.scss'
})
export class UserRegistration implements OnInit, AfterViewInit {
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Modelo para o formulário
  novoUsuario: string = '';
  senhaUsuario: string = '';
  tipoSelecionado: string = '';
  tipos = TIPO_OPCOES;

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
    this.userService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
        this.snackBar.open('Erro ao carregar usuários da API', 'Fechar', { duration: 3000 });
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
      this.snackBar.open('O campo de usuário não pode estar vazio', 'Fechar', { duration: 3000 });
      return;
    }

    if (!this.senhaUsuario || this.senhaUsuario.trim() === '') {
      this.snackBar.open('O campo de senha não pode estar vazio', 'Fechar', { duration: 3000 });
      return;
    }

    if (!this.tipoSelecionado) {
      this.snackBar.open('Selecione o tipo de usuário', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar usuário duplicado
    const usuarioNormalizado = this.novoUsuario.trim().toLowerCase();
    const usuarioExistente = this.dataSource.data.find(
      user => user.user.toLowerCase() === usuarioNormalizado
    );

    if (usuarioExistente) {
      this.snackBar.open('Já existe um usuário cadastrado com este nome', 'Fechar', { duration: 3000 });
      return;
    }

    const newUser: User = {
      user: this.novoUsuario.trim(),
      password: this.senhaUsuario.trim(),
      tipo: this.tipoSelecionado
    };
    
    this.userService.create(newUser).subscribe({
      next: () => {
        this.snackBar.open('Usuário adicionado com sucesso!', 'OK', { duration: 2000 });
        this.novoUsuario = '';
        this.senhaUsuario = '';
        this.tipoSelecionado = '';
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erro ao adicionar usuário:', err);
        this.snackBar.open('Erro ao cadastrar usuário', 'Fechar', { duration: 3000 });
      }
    });
  }

  deleteUser(user: User) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir o usuário ${user.user}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && user.id) {
        this.userService.delete(user.id).subscribe({
          next: () => {
            this.snackBar.open('Usuário excluído com sucesso', 'OK', { duration: 2000 });
            this.loadUsers();
          },
          error: (err) => {
            console.error('Erro ao deletar:', err);
            this.snackBar.open('Erro ao excluir usuário', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }

  getTipoLabel(tipoValue: string): string {
    const tipo = TIPO_OPCOES.find(t => t.value === tipoValue);
    return tipo ? tipo.label : tipoValue;
  }
}
