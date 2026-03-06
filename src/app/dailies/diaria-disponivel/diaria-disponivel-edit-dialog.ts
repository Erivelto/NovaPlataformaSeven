import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { forkJoin, Observable } from 'rxjs';
import { DiariaDisponivelService, DiariaDisponivel } from '../../services/diaria-disponivel.service';
import { RoleService, Role } from '../../services/role.service';
import { SupervisorService, Supervisor } from '../../services/supervisor.service';
import { StationService, Station } from '../../services/station.service';
import { NotificationService } from '../../services/notification.service';

export interface DiariaDisponivelEditData {
  item: DiariaDisponivel | null; // null = nova vaga
}

@Component({
  selector: 'app-diaria-disponivel-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatProgressBarModule
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="edit-dialog">
      <div class="dialog-header">
        <mat-icon>event_available</mat-icon>
        <h2 mat-dialog-title>{{ isNew ? 'Nova Vaga' : 'Editar Vaga' }}</h2>
      </div>

      @if (loadingOptions) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <mat-dialog-content>
        <form [formGroup]="form" class="form-grid">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Data Referência *</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="dataReferencia" [min]="today">
            <mat-hint>DD/MM/AAAA</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            @if (form.get('dataReferencia')?.hasError('required')) {
              <mat-error>Data Referência é obrigatória</mat-error>
            }
            @if (form.get('dataReferencia')?.hasError('matDatepickerMin')) {
              <mat-error>Data deve ser hoje ou futura</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Qtd. Vagas *</mat-label>
            <input matInput type="number" min="1" formControlName="quantidadeDiaria" placeholder="Ex. 10">
            <mat-icon matPrefix>confirmation_number</mat-icon>
            @if (form.get('quantidadeDiaria')?.hasError('required')) {
              <mat-error>Quantidade é obrigatória</mat-error>
            }
            @if (form.get('quantidadeDiaria')?.hasError('min')) {
              <mat-error>Mínimo 1 vaga</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Posto *</mat-label>
            <mat-select formControlName="idPosto">
              @for (p of postos; track p.id) {
                <mat-option [value]="p.id">{{ p.nome }}</mat-option>
              }
            </mat-select>
            <mat-icon matPrefix>location_on</mat-icon>
            @if (form.get('idPosto')?.hasError('required')) {
              <mat-error>Posto é obrigatório</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Função *</mat-label>
            <mat-select formControlName="idFuncao">
              @for (f of funcoes; track f.id) {
                <mat-option [value]="f.id">{{ f.nome }}</mat-option>
              }
            </mat-select>
            <mat-icon matPrefix>work_outline</mat-icon>
            @if (form.get('idFuncao')?.hasError('required')) {
              <mat-error>Função é obrigatória</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Supervisor *</mat-label>
            <mat-select formControlName="idSupervisor">
              @for (s of supervisores; track s.id) {
                <mat-option [value]="s.id">{{ s.nome }}</mat-option>
              }
            </mat-select>
            <mat-icon matPrefix>supervisor_account</mat-icon>
            @if (form.get('idSupervisor')?.hasError('required')) {
              <mat-error>Supervisor é obrigatório</mat-error>
            }
          </mat-form-field>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="saving">Cancelar</button>
        <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid || saving || loadingOptions">
          <mat-icon>{{ saving ? 'hourglass_empty' : 'save' }}</mat-icon>
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .edit-dialog {
      min-width: 420px;

      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px 0;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 0;

        mat-icon {
          color: #850000;
          font-size: 26px;
          width: 26px;
          height: 26px;
        }

        h2 {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 500;
          color: #333;
        }
      }

      mat-dialog-content {
        padding: 16px 24px;
      }

      .form-grid {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 8px;

        .full-width { width: 100%; }
      }

      mat-dialog-actions {
        padding: 8px 24px 16px;
        gap: 8px;
      }
    }

    @media (max-width: 600px) {
      .edit-dialog { min-width: unset; width: 90vw; }
    }
  `]
})
export class DiariaDisponivelEditDialog implements OnInit {
  private fb = inject(FormBuilder);
  private diariaDisponivelService = inject(DiariaDisponivelService);
  private roleService = inject(RoleService);
  private supervisorService = inject(SupervisorService);
  private stationService = inject(StationService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  funcoes: Role[] = [];
  supervisores: Supervisor[] = [];
  postos: Station[] = [];
  loadingOptions = true;
  saving = false;
  readonly today = new Date();

  get isNew(): boolean { return !this.data.item?.id; }

  constructor(
    private dialogRef: MatDialogRef<DiariaDisponivelEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DiariaDisponivelEditData
  ) {}

  ngOnInit() {
    this.buildForm();
    this.loadOptions();
  }

  buildForm() {
    const item = this.data.item;
    this.form = this.fb.group({
      dataReferencia: [item?.dataReferencia ? new Date(item.dataReferencia) : new Date(), Validators.required],
      quantidadeDiaria: [item?.quantidadeDiaria ?? null, [Validators.required, Validators.min(1)]],
      idPosto: [item?.idPosto ?? null, Validators.required],
      idFuncao: [item?.idFuncao ?? null, Validators.required],
      idSupervisor: [item?.idSupervisor ?? null, Validators.required]
    });
  }

  loadOptions() {
    this.loadingOptions = true;
    forkJoin({
      funcoes: this.roleService.getAll(),
      supervisores: this.supervisorService.getAll(),
      postos: this.stationService.getAll()
    }).subscribe({
      next: (res) => {
        this.funcoes = res.funcoes;
        this.supervisores = res.supervisores;
        this.postos = res.postos;
        this.loadingOptions = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingOptions = false;
        this.notify.error('Erro ao carregar opções');
        this.cdr.markForCheck();
      }
    });
  }

  onSave() {
    if (this.form.invalid) return;

    this.saving = true;
    const fv = this.form.value;

    const payload: DiariaDisponivel = {
      ...this.data.item,
      quantidadeDiaria: fv.quantidadeDiaria,
      dataReferencia: (fv.dataReferencia as Date).toISOString(),
      idFuncao: fv.idFuncao,
      idSupervisor: fv.idSupervisor,
      idPosto: fv.idPosto
    };

    const op$: Observable<unknown> = this.isNew
      ? this.diariaDisponivelService.create(payload)
      : this.diariaDisponivelService.update(payload.id!, payload);

    op$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.isNew ? 'Vaga criada com sucesso!' : 'Vaga atualizada com sucesso!');
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
        this.notify.error('Erro ao salvar vaga');
        this.cdr.markForCheck();
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
