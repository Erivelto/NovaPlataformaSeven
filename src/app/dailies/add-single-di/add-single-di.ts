import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DailyService, Daily } from '../../services/daily.service';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, DetailOption } from '../../services/collaborator-detail.service';
import { NotificationService } from '../../services/notification.service';
import { CollaboratorSearchComponent } from '../../shared/collaborator-search/collaborator-search';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-add-single-di',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatTableModule,
    MatProgressBarModule,
    CollaboratorSearchComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './add-single-di.html',
  styleUrl: './add-single-di.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSingleDi implements OnInit {
  private fb = inject(FormBuilder);
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private collaboratorDetailService = inject(CollaboratorDetailService);
  private notify = inject(NotificationService);

  form!: FormGroup;
  collaborators: Collaborator[] = [];
  detailOptions: DetailOption[] = [];
  selectedCollaboratorId: number | null = null;
  existingCount: number = 0;
  loading = false;
  isLoadingDetails = false;

  // MatTable properties
  displayedColumns: string[] = ['data', 'dias', 'existentes', 'posto'];
  singleRowData = [{ id: 1 }]; // Single row data for the table

  ngOnInit() {
    this.initForm();
    this.loadCollaborators();
  }

  initForm() {
    this.form = this.fb.group({
      dataDiaria: [new Date(), Validators.required],
      colaboradorId: ['', Validators.required],
      idColaboradorDetalhe: ['', Validators.required],
      valor: [1, [Validators.required, Validators.min(1)]]
    });
  }

  loadCollaborators() {
    this.collaboratorService.getAll().subscribe({
      next: (data) => {
        this.collaborators = data;
      },
      error: () => {
        this.notify.error('Erro ao carregar colaboradores');
      }
    });
  }

  onCollaboratorChange(collaboratorId: number) {
    this.selectedCollaboratorId = collaboratorId;
    this.form.patchValue({
      colaboradorId: collaboratorId,
      idColaboradorDetalhe: ''
    });
    this.detailOptions = [];
    this.existingCount = 0;
    this.checkExistingAndLoadDetails();
  }

  checkExistingAndLoadDetails() {
    if (!this.selectedCollaboratorId) return;
    
    this.isLoadingDetails = true;
    
    // Busca opções do dropdown (endpoint /select)
    this.collaboratorDetailService.getSelectOptions(this.selectedCollaboratorId).subscribe({
      next: (options: DetailOption[]) => {
        this.detailOptions = options || [];
        this.isLoadingDetails = false;
        
        if (this.detailOptions.length === 0) {
          this.notify.warn('Nenhum detalhe cadastrado para este colaborador');
          return;
        }
        
        this.checkExistingDailies();
      },
      error: (err) => {
        this.isLoadingDetails = false;
        this.notify.error('Erro ao carregar detalhes do colaborador');
      }
    });
  }

  checkExistingDailies() {
    const currentDate = this.form.get('dataDiaria')?.value;
    if (!currentDate || this.detailOptions.length === 0) {
      this.existingCount = 0;
      return;
    }

    const dateStr = this.formatDateForApi(currentDate);
    
    // Para cada detalhe, busca diárias existentes para contar
    const requests = this.detailOptions.map(opt =>
      this.dailyService.getByCollaboratorDetailId(opt.id)
    );

    forkJoin(requests).subscribe({
      next: (allExisting: Daily[][]) => {
        const allDailies = allExisting.flat();
        this.existingCount = allDailies.filter(
          d => d.dataDiaria.split('T')[0] === dateStr
        ).length;
      },
      error: () => {
        this.existingCount = 0;
      }
    });
  }

  onDateChange() {
    if (this.selectedCollaboratorId && this.detailOptions.length > 0) {
      this.checkExistingDailies();
    }
  }

  onDetailChange() {
    // Atualizar contagem quando mudar detalhe específico se necessário
    this.checkExistingDailies();
  }

  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  save() {
    if (this.form.invalid) {
      this.notify.warn('Preencha todos os campos obrigatórios');
      return;
    }

    this.loading = true;
    const formValue = this.form.value;
    const valor = parseInt(formValue.valor) || 1;
    const dateStr = this.formatDateForApi(formValue.dataDiaria);

    // Criar array de diárias baseado na quantidade
    const dailies = [];
    for (let i = 0; i < valor; i++) {
      dailies.push({
        idColaboradorDetalhe: formValue.idColaboradorDetalhe,
        dataDiaria: dateStr
      });
    }

    // Usar o método saveDailies do service que já trata o forkJoin
    this.dailyService.saveDailies(dailies).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success(`${valor} diária(s) cadastrada(s) com sucesso!`);
        this.reset();
        this.checkExistingDailies(); // Atualizar contagem
      },
      error: () => {
        this.loading = false;
        this.notify.error('Erro ao cadastrar diárias');
      }
    });
  }

  reset() {
    this.form.reset({
      dataDiaria: new Date(),
      colaboradorId: '',
      idColaboradorDetalhe: '',
      valor: 1
    });
    this.selectedCollaboratorId = null;
    this.detailOptions = [];
    this.existingCount = 0;
  }
}
