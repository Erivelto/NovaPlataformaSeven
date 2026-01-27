import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface UserData {
  codigo: number;
  usuario: string;
  tipo: string;
}

const TIPO_OPCOES = ['Administrador', 'Operacional', 'Financeiro', 'RH'];

const ELEMENT_DATA: UserData[] = [
  { codigo: 1, usuario: 'admin', tipo: 'Administrador' },
  { codigo: 2, usuario: 'edson.silva', tipo: 'Operacional' },
  { codigo: 3, usuario: 'ana.costa', tipo: 'Financeiro' }
];

@Component({
  selector: 'app-user-registration',
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
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './user-registration.html',
  styleUrl: './user-registration.scss'
})
export class UserRegistration implements AfterViewInit {
  // Modelo para o formulário
  novoUsuario: string = '';
  senhaUsuario: string = '';
  tipoSelecionado: string = '';
  tipos = TIPO_OPCOES;

  displayedColumns: string[] = ['codigo', 'usuario', 'tipo', 'actions'];
  dataSource = new MatTableDataSource<UserData>(ELEMENT_DATA);

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

  addUser() {
    if (this.novoUsuario.trim() && this.senhaUsuario.trim() && this.tipoSelecionado) {
      const nextId = this.dataSource.data.length > 0 
        ? Math.max(...this.dataSource.data.map(u => u.codigo)) + 1 
        : 1;
      
      const newUser: UserData = {
        codigo: nextId,
        usuario: this.novoUsuario,
        tipo: this.tipoSelecionado
      };
      
      this.dataSource.data = [...this.dataSource.data, newUser];
      
      // Reset campos
      this.novoUsuario = '';
      this.senhaUsuario = '';
      this.tipoSelecionado = '';
    }
  }

  deleteUser(user: UserData) {
    this.dataSource.data = this.dataSource.data.filter(u => u !== user);
  }
}
