import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog';

/**
 * Serviço wrapper para o ConfirmDialog.
 * Elimina a repetição de abrir o dialog + configurar data em cada componente.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private dialog = inject(MatDialog);

  /**
   * Abre um diálogo de confirmação e retorna Observable<boolean>.
   * @param data Título, mensagem, e textos dos botões
   */
  confirm(data: Partial<ConfirmDialogData> & { title: string; message: string }): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      maxWidth: '90vw',
      data: {
        title: data.title,
        message: data.message,
        confirmText: data.confirmText || 'Confirmar',
        cancelText: data.cancelText || 'Cancelar'
      }
    });
    return dialogRef.afterClosed();
  }

  /** Atalho para confirmação de exclusão */
  confirmDelete(entityName: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente excluir ${entityName}? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
  }
}
