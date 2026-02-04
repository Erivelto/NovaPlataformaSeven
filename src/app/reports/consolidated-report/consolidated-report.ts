import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localePt);

export interface ConsolidatedData {
  codigo: number;
  nome: string;
  valorTotal: number;
  adiantamento: number;
  valorDiaria: number;
  quantidade: number;
  pix: string;
}

@Component({
  selector: 'app-consolidated-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    CurrencyPipe,
    DecimalPipe
  ],
  templateUrl: './consolidated-report.html',
  styleUrl: './consolidated-report.scss'
})
export class ConsolidatedReport implements AfterViewInit {
  displayedColumns: string[] = ['codigo', 'nome', 'valorTotal', 'adiantamento', 'valorDiaria', 'quantidade', 'pix', 'actions'];
  
  data: ConsolidatedData[] = [
    { codigo: 1, nome: 'Ricardo Martins', valorTotal: 2250.00, adiantamento: 500.00, valorDiaria: 150.00, quantidade: 15, pix: 'ricardo@email.com' },
    { codigo: 2, nome: 'Sandra Ferreira', valorTotal: 2160.00, adiantamento: 300.00, valorDiaria: 180.00, quantidade: 12, pix: '11999998888' },
    { codigo: 3, nome: 'Carlos Souza', valorTotal: 1200.00, adiantamento: 200.00, valorDiaria: 150.00, quantidade: 8, pix: '000.111.222-33' },
    { codigo: 4, nome: 'Ana Paula', valorTotal: 3000.00, adiantamento: 600.00, valorDiaria: 150.00, quantidade: 20, pix: 'ana@pix.com.br' }
  ];

  dataSource = new MatTableDataSource<ConsolidatedData>(this.data);

  // Estatísticas para os boxes
  get totalColaboradores() { return this.data.length; }
  get totalDiarias() { return this.data.reduce((acc, curr) => acc + curr.quantidade, 0); }
  get valorGeral() { return this.data.reduce((acc, curr) => acc + curr.valorTotal, 0); }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
