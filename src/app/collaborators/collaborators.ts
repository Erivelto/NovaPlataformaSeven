import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CollaboratorService, Collaborator } from '../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../services/collaborator-detail.service';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-collaborators',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule
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
})
export class Collaborators implements OnInit, AfterViewInit {
  private collaboratorService = inject(CollaboratorService);
  private detailService = inject(CollaboratorDetailService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = ['codigo', 'nome', 'dataCadastro', 'userCadastro', 'dataAlteracao', 'userAlteracao', 'actions'];
  dataSource = new MatTableDataSource<Collaborator>([]);
  expandedElement: Collaborator | null = null;
  elementDetail: CollaboratorDetail | null = null;
  loadingDetail = false;

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
    this.collaboratorService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => {
        console.error('Erro ao carregar colaboradores:', err);
        this.snackBar.open('Erro ao carregar colaboradores da API', 'Fechar', { duration: 3000 });
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
  }

  fetchDetails(element: Collaborator) {
    if (!element.id) return;
    
    this.loadingDetail = true;
    this.elementDetail = null;

    this.detailService.getByCollaboratorId(element.id).subscribe({
      next: (detail) => {
        this.elementDetail = detail;
        this.loadingDetail = false;
      },
      error: (err) => {
        console.error('Erro ao buscar detalhes:', err);
        this.loadingDetail = false;
        // Se der erro (ex: não tem detalhe cadastrado ainda), mostra como vazio
        this.elementDetail = { idColaborador: element.id! };
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
    console.log('Editar', collaborator);
  }

  deleteCollaborator(collaborator: Collaborator) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir o colaborador ${collaborator.nome}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && collaborator.id) {
        this.collaboratorService.delete(collaborator.id).subscribe({
          next: () => {
            this.snackBar.open('Colaborador excluído com sucesso', 'OK', { duration: 2000 });
            this.loadCollaborators();
          },
          error: (err) => {
            console.error('Erro ao deletar:', err);
            this.snackBar.open('Erro ao excluir colaborador', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }
}
