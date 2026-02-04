import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
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
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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

  readonly mockKpis = [
    { label: 'Diárias aprovadas', value: 128, change: '+12% vs mês anterior', icon: 'check_circle', color: '#2e7d32' },
    { label: 'Diárias pendentes', value: 18, change: '-4% vs mês anterior', icon: 'hourglass_top', color: '#ed6c02' },
    { label: 'Rejeições', value: 6, change: '+2% vs mês anterior', icon: 'cancel', color: '#d32f2f' }
  ];

  readonly progressItems = [
    { label: 'Aprovação mensal', value: '86%', percent: '86%', caption: 'Meta: 90%', color: '#2e7d32' },
    { label: 'Cobertura dos postos', value: '92%', percent: '92%', caption: 'Meta: 95%', color: '#0288d1' },
    { label: 'SLA de resposta', value: '78%', percent: '78%', caption: 'Meta: 85%', color: '#ed6c02' }
  ];

  readonly monthlyTrend = [
    { month: 'Set', value: 82, percent: '48%' },
    { month: 'Out', value: 96, percent: '56%' },
    { month: 'Nov', value: 108, percent: '64%' },
    { month: 'Dez', value: 121, percent: '72%' },
    { month: 'Jan', value: 114, percent: '68%' },
    { month: 'Fev', value: 132, percent: '78%' }
  ];

  readonly mockAlerts = [
    { title: '5 diárias aguardando validação', description: 'Equipe Norte - prazos até amanhã', icon: 'warning', color: '#ed6c02' },
    { title: '2 postos com cobertura parcial', description: 'Revisar escala das próximas 24h', icon: 'error_outline', color: '#d32f2f' },
    { title: 'Meta de produtividade atingida', description: 'Parabéns, equipe Sul!', icon: 'verified', color: '#2e7d32' }
  ];

  readonly topCollaborators = [
    { name: 'Camila Souza', role: 'Supervisora', total: '34 diárias' },
    { name: 'Pedro Lima', role: 'Operador', total: '29 diárias' },
    { name: 'Letícia Ramos', role: 'Operadora', total: '26 diárias' },
    { name: 'Marcos Pereira', role: 'Líder de posto', total: '24 diárias' }
  ];

  readonly recentDailies = [
    { id: 1, collaborator: 'Bruno Martins', station: 'Posto Central', date: '03/02 • 08:30', status: 'Aprovada', statusColor: '#2e7d32', statusBackground: 'rgba(46, 125, 50, 0.12)' },
    { id: 2, collaborator: 'Aline Costa', station: 'Posto Leste', date: '03/02 • 09:10', status: 'Pendente', statusColor: '#ed6c02', statusBackground: 'rgba(237, 108, 2, 0.12)' },
    { id: 3, collaborator: 'João Silva', station: 'Posto Sul', date: '02/02 • 17:40', status: 'Aprovada', statusColor: '#2e7d32', statusBackground: 'rgba(46, 125, 50, 0.12)' },
    { id: 4, collaborator: 'Ana Paula', station: 'Posto Norte', date: '02/02 • 15:05', status: 'Revisão', statusColor: '#0288d1', statusBackground: 'rgba(2, 136, 209, 0.12)' }
  ];

  readonly stationStatus = [
    { label: 'Ativos', value: 14, caption: 'Com equipe completa', color: '#2e7d32' },
    { label: 'Parciais', value: 3, caption: 'Cobertura reduzida', color: '#ed6c02' },
    { label: 'Críticos', value: 1, caption: 'Sem cobertura', color: '#d32f2f' }
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
