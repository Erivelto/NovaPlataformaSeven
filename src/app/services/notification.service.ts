import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Centraliza exibição de mensagens de feedback ao usuário.
 * Evita repetição de `snackBar.open(...)` com configurações manuais em cada componente.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  /** Mensagem de sucesso (verde, 2s) */
  success(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 2000, panelClass: 'snack-success' });
  }

  /** Mensagem de erro (vermelha, 4s) */
  error(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 4000, panelClass: 'snack-error' });
  }

  /** Mensagem informativa (3s) */
  info(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }

  /** Mensagem de aviso (amarela, 4s) */
  warn(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 4000, panelClass: 'snack-warn' });
  }
}
