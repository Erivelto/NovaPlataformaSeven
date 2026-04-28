import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { map } from 'rxjs/operators';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';
import { PermissionService } from '../../services/permission.service';
import { MenuService } from '../../services/menu.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { SubMenu } from '../../models/menu.model';

/**
 * Mapa SubMenu.codigo → rota Angular.
 * Fallback para quando a API não retorna o campo `url` no SubMenu.
 */
const SUBMENU_ROUTE_MAP: Record<number, string> = {
  1:  '/colaboradores',
  2:  '/adicionar-diaria',
  3:  '/adicionar-unica-diaria',
  4:  '/lista-diarias',
  5:  '/diaria-disponivel',
  6:  '/cadastro-posto',
  7:  '/cadastro-supervisor',
  8:  '/cadastro-funcao',
  9:  '/cadastro-usuario',
  10: '/gestao-permissoes',
  11: '/relatorio-dashboard',
  12: '/relatorio-curriculos',
  13: '/relatorio-diarias',
  14: '/relatorio-consolidado',
  15: '/relatorio-consolidado-data',
};

/**
 * Sobrescreve o nome exibido no menu por código de submenu.
 * Use para renomear itens sem alterar o backend.
 */
const SUBMENU_LABEL_OVERRIDE: Record<number, string> = {
  5: 'Solicitações',
};

/**
 * Remapeia submenus para um grupo diferente do retornado pela API.
 * Chave: código do submenu | Valor: trecho da descrição do grupo de destino.
 */
const SUBMENU_GROUP_REMAP: Record<number, string> = {
  1: 'Cadastro', // Mover "Lista de Colaboradores" para o grupo Cadastro
};

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatExpansionModule,
    MatProgressBarModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    HasPermissionDirective
  ]
})
export class MainLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private authService = inject(AuthService);
  public loadingService = inject(LoadingService);
  readonly permissionService = inject(PermissionService);
  readonly menuService = inject(MenuService);

  private userData = signal(this.authService.getUserData());
  private userType = signal<string>(this.userData()?.tipo ?? '');
  readonly isAdmin = computed(() => this.userType() === 'A');
  readonly userName = computed(() => this.userData()?.user ?? 'Usuário');
  readonly userRole = computed(() => this.getTipoLabel(this.userType()) || 'Perfil');

  @ViewChild('drawer') drawer!: MatSidenav;

  isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(result => result.matches)),
    { initialValue: false }
  );

  isCollapsed = signal(false);

  /** Menus agrupados com submenus visíveis — alimenta o sidenav dinâmico */
  readonly menuGroups = computed(() => {
    const menus = this.menuService.menuSignal();
    const userTipo = this.userType();

    const groups = menus
      .filter(m => m.subMenus && m.subMenus.length > 0)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map(m => {
        const visibleSubMenus = (m.subMenus ?? [])
          .filter(sub => {
            const resolvedUrl = sub.url || SUBMENU_ROUTE_MAP[sub.codigo];
            if (!resolvedUrl) return false;
            return true;
          })
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
          .map(sub => ({
            ...sub,
            descricao: SUBMENU_LABEL_OVERRIDE[sub.codigo] ?? sub.descricao,
            url: sub.url || SUBMENU_ROUTE_MAP[sub.codigo] || ''
          }));

        return {
          codigo: m.codigo,
          descricao: m.descricao ?? '',
          icone: m.icone ?? 'folder',
          subMenuCodes: visibleSubMenus.map(s => s.codigo),
          subMenus: visibleSubMenus,
          virtual: false
        };
      })
      .filter(m => m.subMenus.length > 0);

    // Remapear submenus para grupos diferentes do retornado pela API
    for (const [subCodeStr, targetDesc] of Object.entries(SUBMENU_GROUP_REMAP)) {
      const subCode = Number(subCodeStr);
      let movedSub: SubMenu | undefined;
      for (const group of groups) {
        const idx = group.subMenus.findIndex(s => s.codigo === subCode);
        if (idx !== -1) {
          movedSub = group.subMenus.splice(idx, 1)[0];
          group.subMenuCodes = group.subMenuCodes.filter(c => c !== subCode);
          break;
        }
      }
      if (movedSub) {
        const target = groups.find(g =>
          g.descricao.toLowerCase().includes(targetDesc.toLowerCase())
        );
        if (target) {
          target.subMenus.push({ ...movedSub, url: movedSub.url ?? '' });
          target.subMenus.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
          target.subMenuCodes.push(movedSub.codigo);
        }
      }
    }

    // Grupo virtual "Liberação" — visível apenas para admins
    if (userTipo === 'A') {
      groups.push({
        codigo: -1,
        descricao: 'Liberação',
        icone: 'verified',
        subMenuCodes: [-1, -3],
        subMenus: [
          { codigo: -1, codigoMenu: -1, descricao: 'Pendentes de Liberação',  icone: 'pending_actions',    url: '/aprovacoes/pendentes',  ordem: 1, ativo: true },
          // { codigo: -2, codigoMenu: -1, descricao: 'Minhas Solicitações',      icone: 'history',            url: '/aprovacoes/minhas',     ordem: 2, ativo: true },
          { codigo: -3, codigoMenu: -1, descricao: 'Configurar Liberação',     icone: 'settings',           url: '/aprovacoes/configurar', ordem: 3, ativo: true },
        ],
        virtual: true
      });
    }

    return groups;
  });

  /** Verifica permissão de um submenu — delegado ao PermissionService */
  hasPerm(codigoSubMenu: number): boolean {
    return this.permissionService.hasPermission(codigoSubMenu);
  }

  hasAccess(roles: string[]): boolean {
    const tipo = this.userType();
    return roles.includes(tipo);
  }

  getTipoLabel(tipoValue: string): string {
    const tipoMap: { [key: string]: string } = {
      'A': 'Admin',
      'C': 'Comum'
    };
    return tipoMap[tipoValue] || tipoValue;
  }

  toggleCollapse() {
    this.isCollapsed.update(v => !v);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  constructor() {
    void this.permissionService.initializeForCurrentUser();
    void this.menuService.initialize();
  }
}
