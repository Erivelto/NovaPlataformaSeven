import { Component, OnInit, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../../services/collaborator-detail.service';
import { RoleService, Role } from '../../services/role.service';
import { SupervisorService, Supervisor } from '../../services/supervisor.service';
import { StationService, Station } from '../../services/station.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-add-collaborator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatChipsModule,
    MatMenuModule,
    MatAutocompleteModule
  ],
  templateUrl: './add-collaborator.html',
  styleUrl: './add-collaborator.scss'
})
export class AddCollaborator implements OnInit {
  @Input() collaboratorId: number | null = null;
  @Input() isEditMode = false;
  @Output() collaboratorAdded = new EventEmitter<void>();
  @Output() collaboratorUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private collaboratorService = inject(CollaboratorService);
  private detailService = inject(CollaboratorDetailService);
  private roleService = inject(RoleService);
  private supervisorService = inject(SupervisorService);
  private stationService = inject(StationService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  roles: Role[] = [];
  supervisors: Supervisor[] = [];
  stations: Station[] = [];
  loading = false;

  ngOnInit() {
    this.initForm();
    this.loadSelectData();
    if (this.isEditMode && this.collaboratorId) {
      this.loadCollaboratorData();
    }
  }

  initForm() {
    this.form = this.fb.group({
      // Dados Pessoais
      nome: ['', [Validators.required, Validators.minLength(3)]],
      pix: ['', Validators.required],
      referencia: [''],

      // Endereço (OPCIONAL)
      cep: ['', [Validators.pattern(/^\d{5}-?\d{3}$/)]],
      logradouro: [''],
      numero: ['', [Validators.pattern(/^\d+$/)]],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      estado: ['', [Validators.pattern(/^[A-Z]{2}$/)]],

      // Contratação
      valorDiaria: ['', Validators.required],
      funcao: ['', Validators.required],
      supervisor: ['', Validators.required],
      postos: [[], Validators.required]
    });
  }

  loadSelectData() {
    forkJoin({
      roles: this.roleService.getAll(),
      supervisors: this.supervisorService.getAll(),
      stations: this.stationService.getAll()
    }).subscribe({
      next: (res) => {
        this.roles = res.roles;
        this.supervisors = res.supervisors;
        this.stations = res.stations;
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.snackBar.open('Erro ao carregar opções do formulário', 'Fechar', { duration: 3000 });
      }
    });
  }

  loadCollaboratorData() {
    if (!this.collaboratorId) return;
    
    forkJoin({
      collaborator: this.collaboratorService.getById(this.collaboratorId),
      details: this.detailService.getByCollaboratorId(this.collaboratorId)
    }).subscribe({
      next: (res) => {
        const collaborator = res.collaborator;
        const detail = res.details.length > 0 ? res.details[0] : null;
        
        this.form.patchValue({
          nome: collaborator.nome,
          pix: detail?.pix || '',
          referencia: detail?.endereco || '',
          cep: detail?.cep || '',
          logradouro: detail?.endereco || '',
          numero: '', // Campo não disponível no detalhe
          complemento: '', // Campo não disponível no detalhe
          bairro: detail?.bairro || '',
          cidade: detail?.cidade || '',
          estado: detail?.uf || '',
          valorDiaria: detail?.valorDiaria || '',
          funcao: detail?.idFuncao || '',
          supervisor: detail?.idSupervisor || '',
          postos: detail?.idPosto ? [detail.idPosto] : []
        });
      },
      error: (err) => {
        console.error('Erro ao carregar dados do colaborador:', err);
        this.snackBar.open('Erro ao carregar dados do colaborador', 'Fechar', { duration: 3000 });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.snackBar.open('Formulário inválido. Verifique os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    // Função para limpar máscaras visuais dos valores
    const cleanValue = (value: string): string => {
      if (!value) return '';
      // Remove asteriscos e reduz espaços múltiplos
      return value.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    };

    // Preparar dados apenas com campos preenchidos (obrigatórios + opcionais preenchidos)
    const collaboratorData: any = {
      nome: cleanValue(formValue.nome),
      pix: cleanValue(formValue.pix),
      valorDiaria: parseFloat(String(formValue.valorDiaria).replace(',', '.')),
      funcaoId: formValue.funcao,
      supervisorId: formValue.supervisor,
      postoId: formValue.postos && formValue.postos.length > 0 ? formValue.postos[0] : null,
      postoIds: formValue.postos
    };

    // Adicionar campos opcionais apenas se preenchidos
    if (cleanValue(formValue.referencia)) {
      collaboratorData.referencia = cleanValue(formValue.referencia);
    }
    if (cleanValue(formValue.cep)) {
      collaboratorData.cep = cleanValue(formValue.cep).replace(/\D/g, '');
    }
    if (cleanValue(formValue.logradouro)) {
      collaboratorData.logradouro = cleanValue(formValue.logradouro);
    }
    if (formValue.numero) {
      collaboratorData.numero = formValue.numero;
    }
    if (cleanValue(formValue.complemento)) {
      collaboratorData.complemento = cleanValue(formValue.complemento);
    }
    if (cleanValue(formValue.bairro)) {
      collaboratorData.bairro = cleanValue(formValue.bairro);
    }
    if (cleanValue(formValue.cidade)) {
      collaboratorData.cidade = cleanValue(formValue.cidade);
    }
    if (cleanValue(formValue.estado)) {
      collaboratorData.estado = cleanValue(formValue.estado).toUpperCase();
    }

    if (this.isEditMode && this.collaboratorId) {
      this.collaboratorService.update(this.collaboratorId, collaboratorData as any).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Colaborador atualizado com sucesso!', 'OK', { duration: 2000 });
          this.collaboratorUpdated.emit();
        },
        error: (err) => {
          this.loading = false;
          console.error('Erro ao atualizar colaborador:', err);
          this.snackBar.open('Erro ao atualizar colaborador', 'Fechar', { duration: 3000 });
        }
      });
    } else {
      this.collaboratorService.create(collaboratorData as any).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Colaborador cadastrado com sucesso!', 'OK', { duration: 2000 });
          this.form.reset();
          this.collaboratorAdded.emit();
        },
        error: (err) => {
          this.loading = false;
          console.error('Erro ao criar colaborador:', err);
          this.snackBar.open('Erro ao cadastrar colaborador', 'Fechar', { duration: 3000 });
        }
      });
    }
  }

  reset() {
    this.form.reset();
  }

  formatarValor(valor: string): string {
    if (!valor) return '';
    const num = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getSelectedStationNames(): string[] {
    const postoIds = this.form.get('postos')?.value || [];
    return this.stations
      .filter(s => postoIds.includes(s.id))
      .map(s => s.nome);
  }

  togglePosto(stationId: number) {
    const control = this.form.get('postos');
    const currentValue = control?.value || [];
    const index = currentValue.indexOf(stationId);
    
    if (index === -1) {
      currentValue.push(stationId);
    } else {
      currentValue.splice(index, 1);
    }
    
    control?.setValue([...currentValue]);
  }

  isPostoSelected(stationId: number): boolean {
    const postoIds = this.form.get('postos')?.value || [];
    return postoIds.includes(stationId);
  }

  getStationNameById(stationId: number): string {
    return this.stations.find(s => s.id === stationId)?.nome || '';
  }

  getUnselectedStations(): Station[] {
    const postoIds = this.form.get('postos')?.value || [];
    return this.stations.filter(s => !postoIds.includes(s.id));
  }
}
