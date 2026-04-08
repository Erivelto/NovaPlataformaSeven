import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { AprovacaoConfig, AprovacaoService } from '../../services/aprovacao.service';
import { NotificationService } from '../../services/notification.service';
import { User, UserService } from '../../services/user.service';

/** Entidades que suportam fluxo de aprovação */
const ENTIDADES = ['Posto', 'Supervisor', 'Funcao', 'Colaborador'];

@Component({
  selector: 'app-configurar-liberacao',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './configurar-liberacao.html',
  styleUrl: './configurar-liberacao.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurarLiberacaoComponent implements OnInit {
  private readonly aprovacaoService = inject(AprovacaoService);
  private readonly userService = inject(UserService);
  private readonly notify = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(false);
  readonly saving = signal(false);

  configs = signal<AprovacaoConfig[]>([]);
  admins = signal<User[]>([]);

  readonly displayedColumns = ['entidade', 'aprovador', 'actions'];
  readonly entidades = ENTIDADES;

  novaEntidade = '';
  novoAprovadorId: number | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      configs: this.aprovacaoService.getConfigs(),
      users: this.userService.getAll(),
    }).subscribe({
      next: ({ configs, users }) => {
        this.configs.set(configs);
        this.admins.set(users.filter(u => u.tipo === 'A'));
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Erro ao carregar configurações.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  nomeAprovador(idUsuarioAprovador: number): string {
    return this.admins().find(u => u.id === idUsuarioAprovador)?.user ?? `ID ${idUsuarioAprovador}`;
  }

  adicionar(): void {
    if (!this.novaEntidade || !this.novoAprovadorId) {
      this.notify.warn('Selecione a entidade e o aprovador.');
      return;
    }
    this.saving.set(true);
    this.aprovacaoService.addConfig({ entidade: this.novaEntidade, idUsuarioAprovador: this.novoAprovadorId }).subscribe({
      next: () => {
        this.notify.success(`Configuração para "${this.novaEntidade}" criada.`);
        this.novaEntidade = '';
        this.novoAprovadorId = null;
        this.saving.set(false);
        this.loadData();
      },
      error: () => {
        this.notify.error('Erro ao criar configuração.');
        this.saving.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  remover(config: AprovacaoConfig): void {
    if (!config.id) return;
    this.aprovacaoService.removeConfig(config.id).subscribe({
      next: () => {
        this.notify.success(`Configuração para "${config.entidade}" removida.`);
        this.loadData();
      },
      error: () => this.notify.error('Erro ao remover configuração.'),
    });
  }
}
