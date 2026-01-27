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

export interface SupervisorData {
  codigo: number;
  nome: string;
}

const ELEMENT_DATA: SupervisorData[] = [
  { codigo: 1, nome: 'Supervisor Alfa' },
  { codigo: 2, nome: 'Supervisor Beta' },
  { codigo: 3, nome: 'Supervisor Gama' }
];

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
    MatTooltipModule
  ],
  templateUrl: './supervisor-registration.html',
  styleUrl: './supervisor-registration.scss'
})
export class SupervisorRegistration implements AfterViewInit {
  novoSupervisor: string = '';
  displayedColumns: string[] = ['codigo', 'nome', 'actions'];
  dataSource = new MatTableDataSource<SupervisorData>(ELEMENT_DATA);

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

  addSupervisor() {
    if (this.novoSupervisor.trim()) {
      const nextId = this.dataSource.data.length > 0 
        ? Math.max(...this.dataSource.data.map(s => s.codigo)) + 1 
        : 1;
      
      const newSupervisor: SupervisorData = {
        codigo: nextId,
        nome: this.novoSupervisor
      };
      
      this.dataSource.data = [...this.dataSource.data, newSupervisor];
      this.novoSupervisor = '';
    }
  }

  deleteSupervisor(supervisor: SupervisorData) {
    this.dataSource.data = this.dataSource.data.filter(s => s !== supervisor);
  }
}
