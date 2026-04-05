import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsuarioPermissaoService, UsuarioPermissao } from '../../services/usuario-permissao.service';
import { NotificationService } from '../../services/notification.service';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';

interface DialogData {
  user: {
    idUsuario: number;
    nomeUsuario: string;
    tipo: string;
    permissoes: UsuarioPermissao[];
  };
}

@Component({
  selector: 'app-user-permissions-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDividerModule, MatSlideToggleModule, MatChipsModule, MatProgressBarModule, MatDialogModule],
  templateUrl: './user-permissions-dialog.html',
  styleUrls: ['./user-permissions-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPermissionsDialogComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(MatDialogRef<UserPermissionsDialogComponent>);
  private readonly data = inject(MAT_DIALOG_DATA) as DialogData;
  private readonly permissaoService = inject(UsuarioPermissaoService);
  private readonly notify = inject(NotificationService);

  readonly user = signal(this.data.user);
  readonly saving = signal(false);

  readonly filteredPermissions = computed(() => {
    const permissions = this.user().permissoes;
    const editedUserType = this.user().tipo;
    
    // Se o usuário sendo editado é Admin, mostra tudo
    if (editedUserType === 'A') {
      return permissions;
    }
    
    // Se não for Admin, filtra removendo "Cadastro Usuário" (9) e "Controle de Acesso" (10)
    return permissions.filter(p => {
      const codigoSubMenu = (p as any).codigoSubMenu;
      return codigoSubMenu !== 9 && codigoSubMenu !== 10;
    });
  });

  readonly activePermissionsCount = computed(() => this.filteredPermissions().filter(p => p.ativo).length);

  close(): void {
    this.dialogRef.close({ saved: false });
  }

  toggleAtivo(permission: UsuarioPermissao, ativo: boolean): void {
    permission.ativo = ativo;
    if (!ativo) permission.apenasLeitura = false;
    this.cdr.markForCheck();
  }

  toggleApenasLeitura(permission: UsuarioPermissao, apenasLeitura: boolean): void {
    if (!permission.ativo) return;
    permission.apenasLeitura = apenasLeitura;
    this.cdr.markForCheck();
  }

  applyPermissions(): void {
    const editedUser = this.user();
    if (!editedUser) return;

    const payload = editedUser.permissoes.map(permissao => ({
      idUsuario: editedUser.idUsuario,
      codigoSubMenu: (permissao as any).codigoSubMenu ?? 0,
      ativo: permissao.ativo
    }));

    this.saving.set(true);

    this.permissaoService.deleteByUserId(editedUser.idUsuario).pipe(
      catchError(() => of(void 0)),
      switchMap(() => payload.length === 0
        ? of([])
        : forkJoin(payload.map(item => this.permissaoService.create(item)))
      ),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.notify.success('Permissões atualizadas com sucesso.');
        this.dialogRef.close({ saved: true });
      },
      error: () => {
        this.notify.error('Não foi possível salvar as permissões.');
      }
    });
  }
}
