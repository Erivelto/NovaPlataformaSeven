import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface CurriculumData {
  codigo: number;
  nome: string;
  idade: number;
  profissao: string;
  whatsapp: string;
  dataAtualizacao: Date;
}

const ELEMENT_DATA: CurriculumData[] = [
  { codigo: 501, nome: 'Marcos Oliveira', idade: 28, profissao: 'Vigilante', whatsapp: '(11) 98888-7777', dataAtualizacao: new Date() },
  { codigo: 502, nome: 'Juliana Paiva', idade: 32, profissao: 'Recepcionista', whatsapp: '(11) 97777-6666', dataAtualizacao: new Date() }
];

@Component({
  selector: 'app-curriculums-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './curriculums-list.html',
  styleUrl: './curriculums-list.scss'
})
export class CurriculumsList implements AfterViewInit {
  displayedColumns: string[] = ['codigo', 'nome', 'idade', 'profissao', 'whatsapp', 'dataAtualizacao', 'actions'];
  dataSource = new MatTableDataSource<CurriculumData>(ELEMENT_DATA);

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
