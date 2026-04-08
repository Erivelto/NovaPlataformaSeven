import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rejeitar-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rejeitar-dialog">
      <div class="dialog-header">
        <mat-icon color="warn">block</mat-icon>
        <h2 mat-dialog-title>Rejeitar Solicitação</h2>
      </div>
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo da rejeição</mat-label>
          <textarea matInput [(ngModel)]="motivo" rows="4" placeholder="Informe o motivo da rejeição..."></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="warn" [disabled]="!motivo.trim()" (click)="onConfirm()">Rejeitar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .rejeitar-dialog {
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 0 0 20px;
        border-bottom: 1px solid #e0e0e0;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
        }
      }

      mat-dialog-content {
        padding: 16px 20px;
      }

      .full-width {
        width: 100%;
      }
    }
  `]
})
export class RejeitarDialogComponent {
  private dialogRef = inject(MatDialogRef<RejeitarDialogComponent>);

  motivo = '';

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (this.motivo.trim()) {
      this.dialogRef.close(this.motivo.trim());
    }
  }
}
