import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, NavigationEnd } from '@angular/router';
import { CollaboratorService } from '../../services/collaborator.service';
import { DailyService } from '../../services/daily.service';
import { StationService } from '../../services/station.service';
import { CollaboratorDetailService } from '../../services/collaborator-detail.service';
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
  private collaboratorDetailService = inject(CollaboratorDetailService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private routerSubscription?: Subscription;

  stats = [
    { label: 'Total de Colaboradores', value: 0, icon: 'people', color: '#850000' },
    { label: 'Diárias este Mês', value: 0, icon: 'today', color: '#850000' },
    { label: 'Postos Ativos', value: 0, icon: 'location_on', color: '#850000' }
  ];

  kpis = [
    { label: 'Diárias aprovadas', value: 0, change: '+0% vs mês anterior', icon: 'check_circle', color: '#2e7d32' },
    { label: 'Diárias pendentes', value: 0, change: '+0% vs mês anterior', icon: 'hourglass_top', color: '#ed6c02' },
    { label: 'Total este mês', value: 0, change: '+0% vs mês anterior', icon: 'list_alt', color: '#d32f2f' }
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

  readonly lineChart = {
    line: 'M20 130 L100 110 L200 90 L300 70 L400 80 L500 55',
    area: 'M20 130 L100 110 L200 90 L300 70 L400 80 L500 55 L500 160 L20 160 Z'
  };

  readonly lineChartPoints = [
    { label: 'Set', value: 82, x: 20, y: 130 },
    { label: 'Out', value: 96, x: 100, y: 110 },
    { label: 'Nov', value: 108, x: 200, y: 90 },
    { label: 'Dez', value: 121, x: 300, y: 70 },
    { label: 'Jan', value: 114, x: 400, y: 80 },
    { label: 'Fev', value: 132, x: 500, y: 55 }
  ];

  alerts = [
    { title: 'Carregando...', description: 'Verificando dados recentes', icon: 'info', color: '#0288d1' },
    { title: 'Carregando...', description: 'Verificando dados recentes', icon: 'info', color: '#0288d1' },
    { title: 'Carregando...', description: 'Verificando dados recentes', icon: 'info', color: '#0288d1' }
  ];

  topCollaborators = [
    { name: 'Carregando...', role: 'Aguarde', total: '0 diárias' },
    { name: 'Carregando...', role: 'Aguarde', total: '0 diárias' },
    { name: 'Carregando...', role: 'Aguarde', total: '0 diárias' },
    { name: 'Carregando...', role: 'Aguarde', total: '0 diárias' }
  ];

  recentDailies = [
    { id: 0, collaborator: 'Carregando...', station: 'Aguarde', date: '--/-- • --:--', status: 'Pendente', statusColor: '#ed6c02', statusBackground: 'rgba(237, 108, 2, 0.12)' },
    { id: 1, collaborator: 'Carregando...', station: 'Aguarde', date: '--/-- • --:--', status: 'Pendente', statusColor: '#ed6c02', statusBackground: 'rgba(237, 108, 2, 0.12)' },
    { id: 2, collaborator: 'Carregando...', station: 'Aguarde', date: '--/-- • --:--', status: 'Pendente', statusColor: '#ed6c02', statusBackground: 'rgba(237, 108, 2, 0.12)' },
    { id: 3, collaborator: 'Carregando...', station: 'Aguarde', date: '--/-- • --:--', status: 'Pendente', statusColor: '#ed6c02', statusBackground: 'rgba(237, 108, 2, 0.12)' }
  ];

  readonly stationStatus = [
    { label: 'Ativos', value: 0, caption: 'Com equipe completa', color: '#2e7d32' },
    { label: 'Parciais', value: 0, caption: 'Cobertura reduzida', color: '#ed6c02' },
    { label: 'Críticos', value: 0, caption: 'Sem cobertura', color: '#d32f2f' }
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
      stations: this.stationService.getAll(),
      details: this.collaboratorDetailService.getAll()
    }).subscribe({
      next: (res) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Total de Colaboradores
        this.stats[0].value = res.collaborators.length;

        // Diárias deste mês
        const dailiesThisMonth = res.dailies.filter(daily => {
          const dailyDate = new Date(daily.dataDiaria);
          return dailyDate.getMonth() === currentMonth && dailyDate.getFullYear() === currentYear;
        });
        this.stats[1].value = dailiesThisMonth.length;

        // Postos Ativos
        this.stats[2].value = res.stations.length;

        // Calcular KPIs
        const dailiesLastMonth = res.dailies.filter(daily => {
          const dailyDate = new Date(daily.dataDiaria);
          return dailyDate.getMonth() === previousMonth && dailyDate.getFullYear() === previousYear;
        });

        this.kpis[2].value = dailiesThisMonth.length;
        const percentChange = dailiesLastMonth.length > 0 
          ? Math.round(((dailiesThisMonth.length - dailiesLastMonth.length) / dailiesLastMonth.length) * 100)
          : 0;
        this.kpis[2].change = `${percentChange > 0 ? '+' : ''}${percentChange}% vs mês anterior`;

        // Top 4 Colaboradores com mais diárias
        const dailiesByCollab = new Map<number, { count: number; details: any }>();
        dailiesThisMonth.forEach(daily => {
          const detail = res.details.find(d => d.id === daily.idColaboradorDetalhe);
          if (detail) {
            const existing = dailiesByCollab.get(detail.idColaborador) || { count: 0, details: detail };
            existing.count++;
            dailiesByCollab.set(detail.idColaborador, existing);
          }
        });

        const topCollabs = Array.from(dailiesByCollab.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
          .map(item => {
            const collab = res.collaborators.find(c => c.id === item.details.idColaborador);
            return {
              name: collab?.nome || 'Desconhecido',
              role: item.details?.role || 'Operador',
              total: `${item.count} diária(s)`
            };
          });

        this.topCollaborators = topCollabs.length > 0 ? topCollabs : this.topCollaborators;

        // Diárias mais recentes
        const recentDailies = dailiesThisMonth
          .sort((a, b) => new Date(b.dataDiaria).getTime() - new Date(a.dataDiaria).getTime())
          .slice(0, 4)
          .map((daily, idx) => {
            const detail = res.details.find(d => d.id === daily.idColaboradorDetalhe);
            const station = res.stations.find(s => s.id === detail?.idPosto);
            const collab = res.collaborators.find(c => c.id === detail?.idColaborador);
            const dateObj = new Date(daily.dataDiaria);
            const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            
            return {
              id: idx,
              collaborator: collab?.nome || 'Desconhecido',
              station: station?.nome || 'Posto Desconhecido',
              date: `${dateStr} • 09:00`,
              status: 'Registrada',
              statusColor: '#2e7d32',
              statusBackground: 'rgba(46, 125, 50, 0.12)'
            };
          });

        this.recentDailies = recentDailies.length > 0 ? recentDailies : this.recentDailies;

        // Status dos Postos
        const stationDailies: Map<number, number> = new Map();
        res.stations.forEach(s => {
          if (s.id) stationDailies.set(s.id, 0);
        });
        dailiesThisMonth.forEach(daily => {
          const detail = res.details.find(d => d.id === daily.idColaboradorDetalhe);
          if (detail?.idPosto) {
            const current = (stationDailies.get(detail.idPosto) ?? 0) as number;
            stationDailies.set(detail.idPosto, current + 1);
          }
        });

        // Calcular status dos postos
        const ativos = res.stations.reduce((acc, s) => {
          if (!s.id) return acc;
          return acc + ((stationDailies.get(s.id) ?? 0) as number > 0 ? 1 : 0);
        }, 0);
        const parciais = res.stations.reduce((acc, s) => {
          if (!s.id) return acc;
          const count = (stationDailies.get(s.id) ?? 0) as number;
          return acc + (count > 0 && count < 5 ? 1 : 0);
        }, 0);
        const criticos = res.stations.reduce((acc, s) => {
          if (!s.id) return acc;
          return acc + ((stationDailies.get(s.id) ?? 0) as number === 0 ? 1 : 0);
        }, 0);

        (this.stationStatus as any)[0].value = ativos;
        (this.stationStatus as any)[1].value = parciais;
        (this.stationStatus as any)[2].value = criticos;

        // Gerar Alerts baseado em dados reais
        const alerts = [];
        if (dailiesThisMonth.length < dailiesLastMonth.length * 0.8) {
          alerts.push({
            title: 'Produtividade em queda',
            description: `${Math.round(((dailiesThisMonth.length - dailiesLastMonth.length) / dailiesLastMonth.length) * 100)}% menos diárias que mês anterior`,
            icon: 'warning',
            color: '#ed6c02'
          });
        }
        if (criticos > 0) {
          alerts.push({
            title: `${criticos} posto(s) sem cobertura`,
            description: 'Revisar escala das próximas 24h',
            icon: 'error_outline',
            color: '#d32f2f'
          });
        }
        if (dailiesThisMonth.length > 0) {
          alerts.push({
            title: `${dailiesThisMonth.length} diária(s) registrada(s) este mês`,
            description: 'Ótima produtividade!',
            icon: 'check_circle',
            color: '#2e7d32'
          });
        }
        this.alerts = alerts.length > 0 ? alerts : this.alerts;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar estatísticas:', err);
      }
    });
  }
}
