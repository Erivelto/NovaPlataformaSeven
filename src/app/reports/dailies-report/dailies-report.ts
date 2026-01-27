import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

export interface DailyReportData {
  codigo: number;
  data: Date;
  colaborador: string;
  valor: number;
  posto: string;
}

const ELEMENT_DATA: DailyReportData[] = [
  { codigo: 1001, data: new Date(), colaborador: 'Ricardo Martins', valor: 150.00, posto: 'Posto Central' },
  { codigo: 1002, data: new Date(), colaborador: 'Sandra Ferreira', valor: 180.00, posto: 'Posto Norte' }
];

@Component({
  selector: 'app-dailies-report',
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
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './dailies-report.html',
  styleUrl: './dailies-report.scss'
})
export class DailiesReport implements AfterViewInit {
  // Filtros
  dataInicio = new Date();
  dataFim = new Date();
  colaboradorSelecionado: string = '';
  postoSelecionado: string = '';

  // Listas para options
  colaboradores = ['Ricardo Martins', 'Sandra Ferreira', 'Carlos Souza', 'Ana Paula'];
  postos = ['Posto Central', 'Posto Norte', 'Posto Sul', 'Posto Leste', 'Posto Oeste'];

  displayedColumns: string[] = ['codigo', 'data', 'colaborador', 'valor', 'posto', 'actions'];
  dataSource = new MatTableDataSource<DailyReportData>(ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  consultar() {
    console.log('Consultando com filtros:', {
      inicio: this.dataInicio,
      fim: this.dataFim,
      colaborador: this.colaboradorSelecionado,
      posto: this.postoSelecionado
    });
  }
}
