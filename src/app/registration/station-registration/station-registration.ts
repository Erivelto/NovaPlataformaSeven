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

export interface PostoData {
  codigo: number;
  nome: string;
}

const ELEMENT_DATA: PostoData[] = [
  { codigo: 1, nome: 'Posto Central' },
  { codigo: 2, nome: 'Posto Norte' },
  { codigo: 3, nome: 'Posto Sul' },
  { codigo: 4, nome: 'Posto Leste' },
  { codigo: 5, nome: 'Posto Oeste' }
];

@Component({
  selector: 'app-station-registration',
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
  templateUrl: './station-registration.html',
  styleUrl: './station-registration.scss'
})
export class StationRegistration implements AfterViewInit {
  novoPosto: string = '';
  displayedColumns: string[] = ['codigo', 'nome', 'actions'];
  dataSource = new MatTableDataSource<PostoData>(ELEMENT_DATA);

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

  addStation() {
    if (this.novoPosto.trim()) {
      const nextId = this.dataSource.data.length > 0 
        ? Math.max(...this.dataSource.data.map(p => p.codigo)) + 1 
        : 1;
      
      const newStation: PostoData = {
        codigo: nextId,
        nome: this.novoPosto
      };
      
      this.dataSource.data = [...this.dataSource.data, newStation];
      this.novoPosto = '';
    }
  }

  viewStation(station: PostoData) {
    console.log('Visualizar Posto:', station);
  }
}
