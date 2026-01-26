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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { SelectionModel } from '@angular/cdk/collections';

export interface DailyData {
  codigo: number;
  data: string;
  diaria: number;
  postoId: number;
}

export interface Posto {
  id: number;
  nome: string;
}

const POSTOS: Posto[] = [
  { id: 1, nome: 'Posto Central' },
  { id: 2, nome: 'Posto Norte' },
  { id: 3, nome: 'Posto Sul' },
  { id: 4, nome: 'Posto Leste' },
  { id: 5, nome: 'Posto Oeste' }
];

const ELEMENT_DATA: DailyData[] = Array.from({length: 10}, (_, k) => ({
  codigo: k + 1,
  data: '2024-01-25',
  diaria: 150.00,
  postoId: (k % 5) + 1
}));

@Component({
  selector: 'app-add-di',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './add-di.html',
  styleUrl: './add-di.scss'
})
export class AddDi implements AfterViewInit {
  displayedColumns: string[] = ['select', 'data', 'diaria', 'posto', 'actions'];
  dataSource = new MatTableDataSource<DailyData>(ELEMENT_DATA);
  selection = new SelectionModel<DailyData>(true, []);
  postos = POSTOS;

  // Novos campos de adiantamento
  valorAdiantamento: number = 0;
  dataAdiantamento: Date = new Date();

  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row: DailyData): string {
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.codigo + 1}`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addEmptyRow() {
    const newRow: DailyData = {
      codigo: this.dataSource.data.length > 0 ? Math.max(...this.dataSource.data.map(d => d.codigo)) + 1 : 1,
      data: new Date().toISOString().split('T')[0],
      diaria: 0,
      postoId: this.postos[0]?.id || 0
    };
    this.dataSource.data = [...this.dataSource.data, newRow];
  }

  deleteDaily(daily: DailyData) {
    this.dataSource.data = this.dataSource.data.filter(d => d !== daily);
    this.selection.deselect(daily);
  }
}
