import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
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
    RouterLinkActive
  ]
})
export class MainLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private authService = inject(AuthService);
  public loadingService = inject(LoadingService);

  private userType = signal<string>(this.authService.getUserData()?.tipo ?? '');
  readonly isAdmin = computed(() => this.userType() === 'A');

  @ViewChild('drawer') drawer!: MatSidenav;

  isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(result => result.matches)),
    { initialValue: false }
  );

  isCollapsed = false;

  get userName() {
    const user = this.authService.getUserData();
    // Prioriza o campo 'user' conforme sugerido pelo contrato da API
    return user ? user.user : 'Usuário';
  }

  get userRole() {
    const user = this.authService.getUserData();
    const tipoValue = user ? user.tipo : '';
    return this.getTipoLabel(tipoValue) || 'Perfil';
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
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
