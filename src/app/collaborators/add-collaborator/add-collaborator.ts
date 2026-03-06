import { ChangeDetectionStrategy, Component, OnInit, Output, EventEmitter, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StationSelectComponent } from '../../shared/station-select/station-select';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../../services/collaborator-detail.service';
import { RoleService, Role } from '../../services/role.service';
import { SupervisorService, Supervisor } from '../../services/supervisor.service';
import { StationService, Station } from '../../services/station.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { formatNumberToCurrency, parseCurrencyToNumber } from '../../shared/utils/currency.utils';
import { forkJoin, switchMap } from 'rxjs';

@Component({
  selector: 'app-add-collaborator',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    StationSelectComponent
  ],
  templateUrl: './add-collaborator.html',
  styleUrl: './add-collaborator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private authService = inject(AuthService);
  private notify = inject(NotificationService);

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
      endereco: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      uf: ['', [Validators.pattern(/^[A-Z]{2}$/)]],

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
      error: () => {
        this.notify.error('Erro ao carregar opções do formulário');
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
          pix: collaborator.pix || detail?.pix || '',
          referencia: collaborator.referencia || '',
          cep: collaborator.cep || detail?.cep || '',
          endereco: collaborator.endereco || detail?.endereco || '',
          numero: collaborator.numero || '',
          complemento: collaborator.complemento || '',
          bairro: collaborator.bairro || detail?.bairro || '',
          cidade: collaborator.cidade || detail?.cidade || '',
          uf: collaborator.uf || detail?.uf || '',
          valorDiaria: detail?.valorDiaria || '',
          funcao: detail?.idFuncao || '',
          supervisor: detail?.idSupervisor || '',
          postos: detail?.idPosto ? [detail.idPosto] : []
        });
      },
      error: () => {
        this.notify.error('Erro ao carregar dados do colaborador');
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.notify.warn('Formulário inválido. Verifique os campos obrigatórios.');
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

    // 1) Montar payload do Colaborador (POST /api/Colaborador)
    const now = new Date().toISOString();
    const userData = this.authService.getUserData();
    const userName = userData?.user || '';

    const colaboradorPayload: Partial<Collaborator> = {
      id: 0,
      nome: cleanValue(formValue.nome),
      pix: cleanValue(formValue.pix) || undefined,
      referencia: cleanValue(formValue.referencia) || undefined,
      endereco: cleanValue(formValue.endereco) || undefined,
      numero: formValue.numero ? String(formValue.numero) : undefined,
      complemento: cleanValue(formValue.complemento) || undefined,
      bairro: cleanValue(formValue.bairro) || undefined,
      cidade: cleanValue(formValue.cidade) || undefined,
      uf: cleanValue(formValue.uf) ? cleanValue(formValue.uf).toUpperCase() : undefined,
      cep: cleanValue(formValue.cep) ? cleanValue(formValue.cep).replace(/\D/g, '') : undefined,
      dataCadastro: now,
      dataAlteracao: now,
      userCad: userName,
      userAlt: userName,
      excluido: false
    };

    // 2) Montar payload(s) do ColaboradorDetalhe (POST /api/ColaboradorDetalhe)
    const postos: number[] = formValue.postos && Array.isArray(formValue.postos) ? formValue.postos : [];
    const valorDiaria = parseFloat(String(formValue.valorDiaria).replace(',', '.'));
    const funcaoId = formValue.funcao;
    const supervisorId = formValue.supervisor;

    if (this.isEditMode && this.collaboratorId) {
      // Atualizar colaborador existente
      this.collaboratorService.update(this.collaboratorId, colaboradorPayload).subscribe({
        next: () => {
          this.loading = false;
          this.notify.success('Colaborador atualizado com sucesso!');
          this.collaboratorUpdated.emit();
        },
        error: (err) => {
          this.loading = false;
          const errorMsg = this.extractErrorMessage(err, 'Erro ao atualizar colaborador');
          this.notify.error(errorMsg);
        }
      });
    } else {
      // Criar colaborador, depois criar detalhe(s)
      this.collaboratorService.create(colaboradorPayload).pipe(
        switchMap((newId: number) => {
          if (newId && typeof newId === 'number' && newId > 0) {
            return this.createDetails(newId, postos, valorDiaria, funcaoId, supervisorId);
          }

          return this.collaboratorService.getAll().pipe(
            switchMap((all) => {
              const found = all
                .filter(c => c.nome?.trim().toLowerCase() === cleanValue(formValue.nome).toLowerCase() && !c.excluido)
                .sort((a, b) => (b.id || 0) - (a.id || 0));
              const id = found[0]?.id;
              if (!id) throw new Error('Colaborador criado mas ID não encontrado');
              return this.createDetails(id, postos, valorDiaria, funcaoId, supervisorId);
            })
          );
        })
      ).subscribe({
        next: () => {
          this.loading = false;
          this.notify.success('Colaborador cadastrado com sucesso!');
          this.form.reset();
          this.collaboratorAdded.emit();
        },
        error: (err) => {
          this.loading = false;
          const errorMsg = this.extractErrorMessage(err, 'Erro ao cadastrar colaborador');
          this.notify.error(errorMsg);
        }
      });
    }
  }

  private createDetails(idColaborador: number, postos: number[], valorDiaria: number, funcaoId: number, supervisorId: number) {
    const detailRequests = postos.map(postoId => {
      const detailPayload: Partial<CollaboratorDetail> = {
        id: 0,
        idColaborador: idColaborador,
        valorDiaria: valorDiaria,
        idFuncao: funcaoId,
        idSupervisor: supervisorId,
        idPosto: postoId
      };
      return this.detailService.create(detailPayload);
    });
    return forkJoin(detailRequests);
  }

  private extractErrorMessage(err: { error?: { errors?: Record<string, string[]>; title?: string; message?: string }; statusText?: string }, fallback: string): string {
    if (err?.error?.errors) {
      const errors = err.error.errors;
      const messages = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`);
      return messages.join(' | ');
    }
    return err?.error?.title || err?.error?.message || err?.statusText || fallback;
  }

  reset() {
    this.form.reset();
  }

  formatarValor(valor: string): string {
    return formatNumberToCurrency(valor);
  }


}
