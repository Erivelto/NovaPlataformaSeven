import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

export interface DailyDetailRow {
  data: string;
  quantidade: number;
}

export interface DailiesDetailDialogData {
  colaborador: string;
  posto: string;
  funcao: string;
  gc: string;
  totalDiarias: number;
  diasNoPeriodo: number;
  detalhes: DailyDetailRow[];
}

@Component({
  selector: 'app-dailies-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail-dialog">
      <div class="dialog-header">
        <mat-icon color="primary">info</mat-icon>
        <h2 mat-dialog-title>Resumo de Diárias</h2>
      </div>

      <mat-dialog-content>
        <div class="summary-cards">
          <div class="summary-item">
            <span class="label">Colaborador</span>
            <span class="value">{{ data.colaborador }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Posto</span>
            <span class="value">{{ data.posto }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Função</span>
            <span class="value">{{ data.funcao }}</span>
          </div>
          <div class="summary-item">
            <span class="label">GC</span>
            <span class="value">{{ data.gc }}</span>
          </div>
          <div class="summary-item highlight">
            <span class="label">Total de Diárias</span>
            <span class="value">{{ data.totalDiarias }}</span>
          </div>
          <div class="summary-item highlight">
            <span class="label">Dias no Período</span>
            <span class="value">{{ data.diasNoPeriodo }}</span>
          </div>
        </div>

        <h3>Detalhamento por Data</h3>
        <table class="detail-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            @for (row of data.detalhes; track row.data) {
              <tr>
                <td>{{ row.data | date:'dd/MM/yyyy' }}</td>
                <td>{{ row.quantidade }}</td>
              </tr>
            }
          </tbody>
        </table>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" (click)="fechar()">
          Fechar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .detail-dialog {
      min-width: 480px;

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
          color: #333;
        }
      }

      mat-dialog-content {
        padding: 16px 20px;
        max-height: 60vh;
      }

      .summary-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;

        .summary-item {
          display: flex;
          flex-direction: column;
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 4px;

          .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
          }

          .value {
            font-size: 14px;
            font-weight: 500;
            color: #333;
          }

          &.highlight {
            background: #e3f2fd;

            .value {
              font-size: 18px;
              font-weight: 600;
              color: #1976d2;
            }
          }
        }
      }

      h3 {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .detail-table {
        width: 100%;
        border-collapse: collapse;

        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
          font-size: 13px;
        }

        th {
          background: #f5f5f5;
          font-weight: 600;
          color: #333;
        }

        td {
          color: #555;
        }
      }

      mat-dialog-actions {
        padding: 12px 20px;
        border-top: 1px solid #e0e0e0;
        margin: 0;
      }

      ::ng-deep .mat-mdc-dialog-title {
        margin: 0;
        padding: 0 !important;
      }
    }
  `]
})
export class DailiesDetailDialog {
  constructor(
    private dialogRef: MatDialogRef<DailiesDetailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DailiesDetailDialogData
  ) {}

  fechar(): void {
    this.dialogRef.close();
  }
}
