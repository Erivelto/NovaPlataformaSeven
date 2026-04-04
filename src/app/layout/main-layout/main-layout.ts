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
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

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

  readonly menus = computed(() => this.permissionService.permissionsSignal());

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
    // initialize menus and permissions for current user
    void this.permissionService.initializeForCurrentUser();
  }
}
