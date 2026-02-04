import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RoleService, Role } from '../../services/role.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-role-registration',
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
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './role-registration.html',
  styleUrl: './role-registration.scss'
})
export class RoleRegistration implements OnInit, AfterViewInit {
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  novaFuncao: string = '';
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
    this.roleService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => {
        console.error('Erro ao carregar funções:', err);
        this.snackBar.open('Erro ao carregar funções da API', 'Fechar', { duration: 3000 });
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
      this.snackBar.open('O campo de função não pode estar vazio', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar nome duplicado
    const nomeNormalizado = this.novaFuncao.trim().toLowerCase();
    const funcaoExistente = this.dataSource.data.find(
      role => role.nome.toLowerCase() === nomeNormalizado
    );

    if (funcaoExistente) {
      this.snackBar.open('Já existe uma função cadastrada com este nome', 'Fechar', { duration: 3000 });
      return;
    }

    const newRole: Role = {
      nome: this.novaFuncao.trim()
    };
    
    this.roleService.create(newRole).subscribe({
      next: () => {
        this.snackBar.open('Função adicionada com sucesso!', 'OK', { duration: 2000 });
        this.novaFuncao = '';
        this.loadRoles();
      },
      error: (err) => {
        console.error('Erro ao adicionar função:', err);
        this.snackBar.open('Erro ao cadastrar função', 'Fechar', { duration: 3000 });
      }
    });
  }

  deleteRole(role: Role) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir a função ${role.nome}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && role.id) {
        this.roleService.delete(role.id).subscribe({
          next: () => {
            this.snackBar.open('Função excluída com sucesso', 'OK', { duration: 2000 });
            this.loadRoles();
          },
          error: (err) => {
            console.error('Erro ao deletar:', err);
            this.snackBar.open('Erro ao excluir função', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }
}
