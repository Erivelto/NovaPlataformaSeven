import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  // Placeholder para dados do dashboard
  stats = [
    { label: 'Total de Colaboradores', value: 120, icon: 'people', color: '#850000' },
    { label: 'Diárias este Mês', value: 450, icon: 'today', color: '#850000' },
    { label: 'Postos Ativos', value: 15, icon: 'location_on', color: '#850000' }
  ];
}
