import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface DailyListItem {
  codigo: number;
  nome: string;
  dataCadastro: Date;
  quemCadastrou: string;
}

const ELEMENT_DATA: DailyListItem[] = Array.from({length: 15}, (_, k) => ({
  codigo: 100 + k + 1,
  nome: `Diária Colaborador ${k + 1}`,
  dataCadastro: new Date(2024, 0, 1 + k),
  quemCadastrou: 'Admin Sistema'
}));

@Component({
  selector: 'app-dailies-list',
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
    MatTooltipModule
  ],
  templateUrl: './dailies-list.html',
  styleUrl: './dailies-list.scss'
})
export class DailiesList implements AfterViewInit {
  displayedColumns: string[] = ['codigo', 'nome', 'dataCadastro', 'quemCadastrou', 'actions'];
  dataSource = new MatTableDataSource<DailyListItem>(ELEMENT_DATA);

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

  deleteDaily(item: DailyListItem) {
    console.log('Deletar Diária:', item);
    this.dataSource.data = this.dataSource.data.filter(d => d !== item);
  }
}
