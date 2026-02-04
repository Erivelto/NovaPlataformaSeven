import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, NavigationEnd } from '@angular/router';
import { CollaboratorService } from '../../services/collaborator.service';
import { DailyService } from '../../services/daily.service';
import { StationService } from '../../services/station.service';
import { forkJoin, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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
export class Dashboard implements OnInit, OnDestroy {
  private collaboratorService = inject(CollaboratorService);
  private dailyService = inject(DailyService);
  private stationService = inject(StationService);
  private router = inject(Router);
  private routerSubscription?: Subscription;

  stats = [
    { label: 'Total de Colaboradores', value: 0, icon: 'people', color: '#850000' },
    { label: 'Diárias este Mês', value: 0, icon: 'today', color: '#850000' },
    { label: 'Postos Ativos', value: 0, icon: 'location_on', color: '#850000' }
  ];

  ngOnInit() {
    this.loadDashboardStats();
    
    // Recarrega os dados quando a navegação terminar
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('relatorio-dashboard')) {
        this.loadDashboardStats();
      }
    });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  loadDashboardStats() {
    forkJoin({
      collaborators: this.collaboratorService.getAll(),
      dailies: this.dailyService.getAll(),
      stations: this.stationService.getAll()
    }).subscribe({
      next: (res) => {
        // Total de Colaboradores
        this.stats[0].value = res.collaborators.length;

        // Diárias deste mês
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const dailiesThisMonth = res.dailies.filter(daily => {
          const dailyDate = new Date(daily.dataDiaria);
          return dailyDate.getMonth() === currentMonth && dailyDate.getFullYear() === currentYear;
        });
        this.stats[1].value = dailiesThisMonth.length;

        // Postos Ativos
        this.stats[2].value = res.stations.length;
      },
      error: (err) => {
        console.error('Erro ao carregar estatísticas:', err);
      }
    });
  }
}
