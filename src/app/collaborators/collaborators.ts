import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface CollaboratorData {
  codigo: number;
  nome: string;
  dataCadastro: Date;
  quemCadastrou: string;
  dataAlteracao: Date;
  quemAlterou: string;
}

const ELEMENT_DATA: CollaboratorData[] = Array.from({length: 20}, (_, k) => ({
  codigo: k + 1,
  nome: `Colaborador Exemplo ${k + 1}`,
  dataCadastro: new Date(2023, 0, 1 + k),
  quemCadastrou: 'Admin',
  dataAlteracao: new Date(2023, 5, 1 + k),
  quemAlterou: k % 2 === 0 ? 'Admin' : 'Gerente'
}));

@Component({
  selector: 'app-collaborators',
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './collaborators.html',
  styleUrl: './collaborators.scss',
})
export class Collaborators implements AfterViewInit {
  displayedColumns: string[] = ['codigo', 'nome', 'dataCadastro', 'quemCadastrou', 'dataAlteracao', 'quemAlterou', 'actions'];
  dataSource = new MatTableDataSource<CollaboratorData>(ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  addCollaborator() {
    console.log('Adicionar colaborador');
  }

  editCollaborator(collaborator: CollaboratorData) {
    console.log('Editar', collaborator);
  }

  deleteCollaborator(collaborator: CollaboratorData) {
    console.log('Deletar', collaborator);
  }
}
