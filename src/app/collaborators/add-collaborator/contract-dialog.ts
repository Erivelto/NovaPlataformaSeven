import { ChangeDetectionStrategy, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { Observable, of, debounceTime, startWith, map } from 'rxjs';
import { Role } from '../../services/role.service';
import { Supervisor } from '../../services/supervisor.service';
import { Station } from '../../services/station.service';
import { CollaboratorDetail } from '../../services/collaborator-detail.service';
import { formatNumberToCurrency } from '../../shared/utils/currency.utils';

export interface ContractDialogData {
  contract?: CollaboratorDetail;
  roles: Role[];
  supervisors: Supervisor[];
  stations: Station[];
  collaboratorId: number;
}

@Component({
  selector: 'app-contract-dialog',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contract-dialog">
      <div class="dialog-header">
        <mat-icon color="primary">{{ data.contract ? 'edit' : 'add_circle' }}</mat-icon>
        <h2 mat-dialog-title>{{ data.contract ? 'Editar Contratação' : 'Nova Contratação' }}</h2>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="dialog-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Valor da Diária *</mat-label>
            <span matPrefix>R$&nbsp;</span>
            <input matInput
                   type="text"
                   formControlName="valorDiaria"
                   (blur)="$event.target.value = formatarValor($event.target.value)"
                   placeholder="0,00">
            @if (form.get('valorDiaria')?.hasError('required')) {
              <mat-error>Valor é obrigatório</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Função *</mat-label>
            <input matInput formControlName="funcao" [matAutocomplete]="funcaoAuto" placeholder="Buscar função...">
            <mat-icon matPrefix>work_outline</mat-icon>
            @if (form.get('funcao')?.hasError('required')) {
              <mat-error>Função é obrigatória</mat-error>
            }
            <mat-autocomplete #funcaoAuto="matAutocomplete" [displayWith]="displayRoleName">
              @for (role of filteredRoles$ | async; track role.id) {
                <mat-option [value]="role.id">
                  {{ role.nome }}
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Supervisor *</mat-label>
            <input matInput formControlName="supervisor" [matAutocomplete]="supervisorAuto" placeholder="Buscar supervisor...">
            <mat-icon matPrefix>supervisor_account</mat-icon>
            @if (form.get('supervisor')?.hasError('required')) {
              <mat-error>Supervisor é obrigatório</mat-error>
            }
            <mat-autocomplete #supervisorAuto="matAutocomplete" [displayWith]="displaySupervisorName">
              @for (supervisor of filteredSupervisors$ | async; track supervisor.id) {
                <mat-option [value]="supervisor.id">
                  {{ supervisor.nome }}
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Posto *</mat-label>
            <input matInput formControlName="posto" [matAutocomplete]="postoAuto" placeholder="Buscar posto...">
            <mat-icon matPrefix>location_on</mat-icon>
            @if (form.get('posto')?.hasError('required')) {
              <mat-error>Posto é obrigatório</mat-error>
            }
            <mat-autocomplete #postoAuto="matAutocomplete" [displayWith]="displayStationName">
              @for (station of filteredStations$ | async; track station.id) {
                <mat-option [value]="station.id">
                  {{ station.nome }}
                </mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid">
          <mat-icon>save</mat-icon>
          {{ data.contract ? 'Salvar' : 'Adicionar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .contract-dialog {
      min-width: 450px;

      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
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

      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 16px;

        .full-width {
          width: 100%;
        }
      }

      mat-dialog-actions {
        padding: 12px 20px 16px 0;
        border-top: 1px solid #e0e0e0;
        gap: 12px;

        button mat-icon {
          margin-right: 4px;
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }
  `]
})
export class ContractDialog implements OnInit {
  private fb = inject(FormBuilder);
  form!: FormGroup;

  filteredRoles$: Observable<Role[]> = of([]);
  filteredSupervisors$: Observable<Supervisor[]> = of([]);
  filteredStations$: Observable<Station[]> = of([]);

  constructor(
    public dialogRef: MatDialogRef<ContractDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ContractDialogData
  ) {}

  ngOnInit() {
    const c = this.data.contract;
    this.form = this.fb.group({
      valorDiaria: [c?.valorDiaria ?? '', Validators.required],
      funcao: [c?.idFuncao ?? '', Validators.required],
      supervisor: [c?.idSupervisor ?? '', Validators.required],
      posto: [c?.idPosto ?? '', Validators.required],
    });

    this.filteredRoles$ = this.form.get('funcao')!.valueChanges.pipe(
      debounceTime(200),
      startWith(c?.idFuncao ?? ''),
      map(val => this._filterRoles(val))
    );

    this.filteredStations$ = this.form.get('posto')!.valueChanges.pipe(
      debounceTime(200),
      startWith(c?.idPosto ?? ''),
      map(val => this._filterStations(val))
    );

    this.filteredSupervisors$ = this.form.get('supervisor')!.valueChanges.pipe(
      debounceTime(200),
      startWith(c?.idSupervisor ?? ''),
      map(val => this._filterSupervisors(val))
    );
  }

  private _filterRoles(value: any): Role[] {
    const filter = typeof value === 'string' ? value.toLowerCase() : '';
    return filter
      ? this.data.roles.filter(r => r.nome.toLowerCase().includes(filter))
      : this.data.roles;
  }

  private _filterStations(value: any): Station[] {
    const filter = typeof value === 'string' ? value.toLowerCase() : '';
    return filter
      ? this.data.stations.filter(s => s.nome.toLowerCase().includes(filter))
      : this.data.stations;
  }

  private _filterSupervisors(value: any): Supervisor[] {
    const filter = typeof value === 'string' ? value.toLowerCase() : '';
    return filter
      ? this.data.supervisors.filter(s => s.nome.toLowerCase().includes(filter))
      : this.data.supervisors;
  }

  displayRoleName = (id: any): string => {
    if (typeof id === 'number') {
      return this.data.roles.find(r => r.id === id)?.nome || '';
    }
    return '';
  };

  displayStationName = (id: any): string => {
    if (typeof id === 'number') {
      return this.data.stations.find(s => s.id === id)?.nome || '';
    }
    return '';
  };

  displaySupervisorName = (id: any): string => {
    if (typeof id === 'number') {
      return this.data.supervisors.find(s => s.id === id)?.nome || '';
    }
    return '';
  };

  formatarValor(valor: string): string {
    return formatNumberToCurrency(valor);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.invalid) return;
    const v = this.form.value;

    const result: Partial<CollaboratorDetail> = {
      idColaborador: this.data.collaboratorId,
      valorDiaria: parseFloat(String(v.valorDiaria).replace(',', '.')),
      idFuncao: v.funcao,
      idSupervisor: v.supervisor,
      idPosto: v.posto,
    };

    if (this.data.contract?.id) {
      result.id = this.data.contract.id;
    }

    this.dialogRef.close(result);
  }
}
