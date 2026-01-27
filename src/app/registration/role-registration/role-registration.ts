import { Component, ViewChild, AfterViewInit } from '@angular/core';
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

export interface FuncaoData {
  codigo: number;
  nome: string;
}

const ELEMENT_DATA: FuncaoData[] = [
  { codigo: 1, nome: 'Vigilante' },
  { codigo: 2, nome: 'Supervisor de Área' },
  { codigo: 3, nome: 'Porteiro' }
];

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
    MatTooltipModule
  ],
  templateUrl: './role-registration.html',
  styleUrl: './role-registration.scss'
})
export class RoleRegistration implements AfterViewInit {
  novaFuncao: string = '';
  displayedColumns: string[] = ['codigo', 'nome', 'actions'];
  dataSource = new MatTableDataSource<FuncaoData>(ELEMENT_DATA);

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

  addRole() {
    if (this.novaFuncao.trim()) {
      const nextId = this.dataSource.data.length > 0 
        ? Math.max(...this.dataSource.data.map(f => f.codigo)) + 1 
        : 1;
      
      const newRole: FuncaoData = {
        codigo: nextId,
        nome: this.novaFuncao
      };
      
      this.dataSource.data = [...this.dataSource.data, newRole];
      this.novaFuncao = '';
    }
  }

  deleteRole(role: FuncaoData) {
    this.dataSource.data = this.dataSource.data.filter(f => f !== role);
  }
}
