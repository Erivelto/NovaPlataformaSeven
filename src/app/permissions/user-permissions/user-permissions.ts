import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { User, UserService } from '../../services/user.service';
import { UsuarioPermissao, ControllerItem, UsuarioPermissaoService } from '../../services/usuario-permissao.service';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { SubMenu } from '../../models/menu.model';

/** Rank numérico: maior = mais privilegiado */
const TIPO_RANK: Record<string, number> = { A: 3, G: 2, O: 1, C: 1 };

export const TIPO_LABELS: Record<string, string> = {
  A: 'Admin',
  G: 'Gerencial',
  O: 'Operacional',
  C: 'Operacional'  // Tipo legado mapeado para Operacional
};

interface IUsuarioPermissao {
  id: number;
  idUsuario: number;
  controller: string;
  codigoSubMenu: number;
  apenasLeitura: boolean;
  ativo: boolean;
  dataCadastro: string;
  nomeAmigavelArea?: string;
}

interface UserPermissionSummary {
  idUsuario: number;
  nomeUsuario: string;
  tipo: string;
  permissoes: IUsuarioPermissao[];
}

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './user-permissions.html',
  styleUrl: './user-permissions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPermissionsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private readonly userService = inject(UserService);
  private readonly permissaoService = inject(UsuarioPermissaoService);
  private readonly menuService = inject(MenuService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  readonly displayedColumns: string[] = ['idUsuario', 'nomeUsuario', 'tipo', 'areasAtivas', 'actions'];

  readonly users = signal<UserPermissionSummary[]>([]);
  readonly controllers = signal<ControllerItem[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly selectedUser = signal<UserPermissionSummary | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  /** Tipo do usuário logado (ex: 'A', 'G', 'O') */
  readonly loggedInTipo = signal<string>(this.authService.getUserData()?.tipo ?? '');

  readonly tipoLabels = TIPO_LABELS;

  tipoLabel(tipo: string): string {
    return TIPO_LABELS[tipo] ?? tipo;
  }

  /**
   * Hierarquia de edição:
   * - Linha Admin (A) → sempre desabilitado
   * - Usuário logado só pode editar quem tem rank inferior
   */
  canEditUser(row: UserPermissionSummary): boolean {
    if (row.tipo === 'A') return false;
    const myRank = TIPO_RANK[this.loggedInTipo()] ?? 0;
    const rowRank = TIPO_RANK[row.tipo] ?? 0;
    return myRank > rowRank;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      usuarios: this.userService.getAll().pipe(
        catchError((err) => {
          const status = err?.status ?? 'desconhecido';
          this.loadError.set(`Não foi possível carregar os usuários (HTTP ${status}). Verifique a conexão e tente novamente.`);
          return of([] as User[]);
        })
      ),
      permissoes: this.permissaoService.getAll().pipe(catchError(() => of([] as UsuarioPermissao[]))),
      subMenus: this.menuService.getSubMenus()
    })
      .pipe(finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe(({ usuarios, permissoes, subMenus }) => {
        const controllers: ControllerItem[] = subMenus.map(s => ({ valor: s.codigo, nome: s.descricao }));
        this.controllers.set(controllers);
        this.users.set(this.buildUserSummary(usuarios, permissoes, controllers));
        this.cdr.markForCheck();
      });
  }

  readonly loginFilters = computed(() =>
    this.users().map(u => ({ id: String(u.idUsuario), nome: u.nomeUsuario }))
  );

  readonly controllerFilters = computed(() => {
    const all = this.users().flatMap(u => u.permissoes.map(p => p.controller));
    return [...new Set(all)].sort();
  });

  readonly filteredUsers = computed(() => this.users());

  readonly activePermissionsCount = computed(() => {
    const current = this.selectedUser();
    if (!current) {
      return 0;
    }

    return current.permissoes.filter(p => p.ativo).length;
  });

  async openPermissionDrawer(user: UserPermissionSummary): Promise<void> {
    const clone: UserPermissionSummary = {
      ...user,
      permissoes: user.permissoes.map(p => ({ ...p }))
    };

    const mod = await import('../user-permissions-dialog/user-permissions-dialog');
    const DialogCmp = mod.UserPermissionsDialogComponent;

    const dialogRef = this.dialog.open(DialogCmp, {
      data: { user: clone },
      width: '760px',
      maxWidth: '98vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.saved) {
        this.loadData();
      }
    });
  }

  closePermissionDrawer(): void {
    this.selectedUser.set(null);
  }


  toggleAtivo(permission: IUsuarioPermissao, ativo: boolean): void {
    permission.ativo = ativo;

    if (!ativo) {
      permission.apenasLeitura = false;
    }

    this.cdr.markForCheck();
  }

  toggleApenasLeitura(permission: IUsuarioPermissao, apenasLeitura: boolean): void {
    if (!permission.ativo) {
      return;
    }

    permission.apenasLeitura = apenasLeitura;
    this.cdr.markForCheck();
  }

  applyPermissions(): void {
    const editedUser = this.selectedUser();
    if (!editedUser) {
      return;
    }

    const payload = editedUser.permissoes.map(permissao => ({
      idUsuario: editedUser.idUsuario,
      codigoSubMenu: permissao.codigoSubMenu,
      ativo: permissao.ativo
    }));

    this.saving.set(true);

    this.permissaoService
      .deleteByUserId(editedUser.idUsuario)
      .pipe(
        catchError(() => of(void 0)),
        switchMap(() => {
          if (payload.length === 0) {
            return of([]);
          }

          return forkJoin(payload.map(item => this.permissaoService.create(item)));
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.notify.success('Permissoes atualizadas com sucesso.');
          this.closePermissionDrawer();
          this.loadData();
        },
        error: () => {
          this.notify.error('Nao foi possivel salvar as permissoes.');
        }
      });
  }

  getFriendlyAreaName(permission: IUsuarioPermissao): string {
    return permission.nomeAmigavelArea?.trim() || permission.controller;
  }

  getActiveAreasCount(user: UserPermissionSummary): number {
    return user.permissoes.filter(p => p.ativo).length;
  }

  getPermissionStatusLabel(permission: IUsuarioPermissao): string {
    if (!permission.ativo) {
      return 'Sem acesso';
    }

    return permission.apenasLeitura ? 'Somente leitura' : 'Edicao completa';
  }

  private buildUserSummary(users: User[], permissoes: UsuarioPermissao[], controllers: ControllerItem[]): UserPermissionSummary[] {
    return users.map(user => {
      const userPermissoes = permissoes.filter(p => p.idUsuario === user.id);
      const byCodigoSubMenu = new Map(userPermissoes.map(p => [p.codigoSubMenu, p]));

      const normalizedPermissoes = controllers.map(ct => {
        const current = byCodigoSubMenu.get(ct.valor);
        return {
          id: current?.id ?? 0,
          idUsuario: user.id ?? 0,
          controller: ct.nome,
          codigoSubMenu: ct.valor,
          apenasLeitura: current?.apenasLeitura ?? false,
          ativo: current?.ativo ?? false,
          dataCadastro: current?.dataCadastro ?? '',
          nomeAmigavelArea: ct.nome
        };
      });

      return {
        idUsuario: user.id ?? 0,
        nomeUsuario: user.user,
        tipo: user.tipo,
        permissoes: normalizedPermissoes
      };
    });
  }

}
