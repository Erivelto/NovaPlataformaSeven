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
import { SupervisorService, Supervisor } from '../../services/supervisor.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-supervisor-registration',
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
  templateUrl: './supervisor-registration.html',
  styleUrl: './supervisor-registration.scss'
})
export class SupervisorRegistration implements OnInit, AfterViewInit {
  private supervisorService = inject(SupervisorService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  novoSupervisor: string = '';
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
    this.supervisorService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => {
        console.error('Erro ao carregar supervisores:', err);
        this.snackBar.open('Erro ao carregar supervisores da API', 'Fechar', { duration: 3000 });
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
      this.snackBar.open('O campo de supervisor não pode estar vazio', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar nome duplicado
    const nomeNormalizado = this.novoSupervisor.trim().toLowerCase();
    const supervisorExistente = this.dataSource.data.find(
      supervisor => supervisor.nome.toLowerCase() === nomeNormalizado
    );

    if (supervisorExistente) {
      this.snackBar.open('Já existe um supervisor cadastrado com este nome', 'Fechar', { duration: 3000 });
      return;
    }

    const newSupervisor: Supervisor = {
      nome: this.novoSupervisor.trim()
    };
    
    this.supervisorService.create(newSupervisor).subscribe({
      next: () => {
        this.snackBar.open('Supervisor adicionado com sucesso!', 'OK', { duration: 2000 });
        this.novoSupervisor = '';
        this.loadSupervisors();
      },
      error: (err) => {
        console.error('Erro ao adicionar supervisor:', err);
        this.snackBar.open('Erro ao cadastrar supervisor', 'Fechar', { duration: 3000 });
      }
    });
  }

  deleteSupervisor(supervisor: Supervisor) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir o supervisor ${supervisor.nome}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && supervisor.id) {
        this.supervisorService.delete(supervisor.id).subscribe({
          next: () => {
            this.snackBar.open('Supervisor excluído com sucesso', 'OK', { duration: 2000 });
            this.loadSupervisors();
          },
          error: (err) => {
            console.error('Erro ao deletar:', err);
            this.snackBar.open('Erro ao excluir supervisor', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }
}
