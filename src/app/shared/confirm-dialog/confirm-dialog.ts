import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header">
        <mat-icon color="warn">warning</mat-icon>
        <h2 mat-dialog-title>{{data.title}}</h2>
      </div>
      <mat-dialog-content>
        <p>{{data.message}}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{data.cancelText || 'Cancelar'}}
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()">
          {{data.confirmText || 'Confirmar'}}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      display: flex;
      flex-direction: column;
      gap: 0;

      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 16px;
        padding: 0 0 0 20px;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 0;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          min-width: 28px;
          flex-shrink: 0;
        }

        h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
          color: #333;
          flex: 1;
        }
      }

      mat-dialog-content {
        padding: 16px 20px;
        flex: 1;
        overflow-y: auto;

        p {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #555;
          word-wrap: break-word;
        }
      }

      mat-dialog-actions {
        padding: 16px 20px 17px 0;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin: 0;

        button {
          padding: 8px 20px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
      }

      ::ng-deep .mat-mdc-dialog-title {
        display: block;
        position: relative;
        flex-shrink: 0;
        box-sizing: border-box;
        margin: 0;
        padding: 0 !important;
      }
    }
  `]
})
export class ConfirmDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
