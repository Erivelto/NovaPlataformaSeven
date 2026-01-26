import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';

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

@Component({
  selector: 'app-add-single-di',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './add-single-di.html',
  styleUrl: './add-single-di.scss'
})
export class AddSingleDi {
  // Modelo de dados simplificado
  data = new Date();
  nomePesquisa: string = '';

  save() {
    const daily = {
      data: this.data,
      nome: this.nomePesquisa
    };
    console.log('Adicionando Diária Única:', daily);
  }

  reset() {
    this.data = new Date();
    this.nomePesquisa = '';
  }
}
