import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../services/user.service';

export interface EditUserDialogData {
  user: User;
  tipoOpcoes: Array<{ label: string; value: string }>;
}

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Editar Usuário</h2>
    
    <mat-dialog-content>
      <div class="dialog-content">
        <p><strong>Usuário:</strong> {{ data.user.user }}</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="selectedTipo">
            @for (tipo of data.tipoOpcoes; track tipo.value) {
              <mat-option [value]="tipo.value">
                {{ tipo.label }}
              </mat-option>
            }
          </mat-select>
          <mat-icon matPrefix>admin_panel_settings</mat-icon>
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="selectedTipo === data.user.tipo">
        <mat-icon>check</mat-icon>
        Salvar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 350px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }
    
    .full-width {
      width: 100%;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditUserDialogComponent {
  private dialogRef = inject(MatDialogRef<EditUserDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as EditUserDialogData;
  
  selectedTipo = this.data.user.tipo;

  onSave(): void {
    this.dialogRef.close({ tipo: this.selectedTipo });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
