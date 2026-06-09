import { ChangeDetectionStrategy, Component, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, Input, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, CollaboratorDetail } from '../../services/collaborator-detail.service';
import { RoleService, Role } from '../../services/role.service';
import { SupervisorService, Supervisor } from '../../services/supervisor.service';
import { StationService, Station } from '../../services/station.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { CepService } from '../../services/cep.service';
import { formatNumberToCurrency, parseCurrencyToNumber } from '../../shared/utils/currency.utils';
import { ContractDialog, ContractDialogData } from './contract-dialog';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { forkJoin, switchMap, debounceTime, startWith, map, of, distinctUntilChanged, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-add-collaborator',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-collaborator.html',
  styleUrl: './add-collaborator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCollaborator implements OnInit, OnChanges {
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
  private cepService = inject(CepService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  form!: FormGroup;
  roles: Role[] = [];
  supervisors: Supervisor[] = [];
  stations: Station[] = [];
  loading = false;
  cepLoading = false;
  private lastFetchedCep = '';

  filteredRoles$ = of<Role[]>([]);
  filteredSupervisors$ = of<Supervisor[]>([]);
  filteredStations$ = of<Station[]>([]);

  // Tabela de contratações
  contractsDataSource = new MatTableDataSource<CollaboratorDetail>();
  displayedColumns: string[] = ['id', 'valorDiaria', 'funcao', 'supervisor', 'posto', 'actions'];
  contracts: CollaboratorDetail[] = [];

  private dataLoaded = false;
  private selectDataLoaded = false;

  ngOnInit() {
    this.initForm();
    this.setupCepLookup();
    this.loadSelectData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['collaboratorId'] || changes['isEditMode']) && this.isEditMode && this.collaboratorId && !this.dataLoaded) {
      if (this.selectDataLoaded) {
        this.dataLoaded = true;
        this.loadCollaboratorData();
      }
    }
  }

  initForm() {
    this.form = this.fb.group({
      // Dados Pessoais
      nome: ['', [Validators.required, Validators.minLength(3)]],
      pix: ['', Validators.required],
      referencia: [''],

      // Endereço (OPCIONAL)
      cep: ['', [Validators.pattern(/^(\d{5}-\d{3}|\d{8})$/)]],
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
      posto: ['', Validators.required]
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

        // Configurar observables de filtro para autocomplete
        const funcaoControl = this.form.get('funcao');
        const postoControl = this.form.get('posto');

        if (funcaoControl) {
          this.filteredRoles$ = funcaoControl.valueChanges.pipe(
            debounceTime(200),
            startWith(''),
            map(val => this._filterRoles(val))
          );
        }

        if (postoControl) {
          this.filteredStations$ = postoControl.valueChanges.pipe(
            debounceTime(200),
            startWith(''),
            map(val => this._filterStations(val))
          );
        }

        const supervisorControl = this.form.get('supervisor');
        if (supervisorControl) {
          this.filteredSupervisors$ = supervisorControl.valueChanges.pipe(
            debounceTime(200),
            startWith(''),
            map(val => this._filterSupervisors(val))
          );
        }

        this.selectDataLoaded = true;
        this.cdr.markForCheck();

        // Se já temos o collaboratorId mas os dados ainda não foram carregados
        if (this.isEditMode && this.collaboratorId && !this.dataLoaded) {
          this.dataLoaded = true;
          this.loadCollaboratorData();
        }
      },
      error: () => {
        this.notify.error('Erro ao carregar opções do formulário');
      }
    });
  }

  private _filterRoles(value: any): Role[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return filterValue
      ? this.roles.filter(role => role.nome.toLowerCase().includes(filterValue))
      : this.roles;
  }

  private _filterStations(value: any): Station[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return filterValue
      ? this.stations.filter(station => station.nome.toLowerCase().includes(filterValue))
      : this.stations;
  }

  private _filterSupervisors(value: any): Supervisor[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return filterValue
      ? this.supervisors.filter(supervisor => supervisor.nome.toLowerCase().includes(filterValue))
      : this.supervisors;
  }

  getRoleName(id: number): string {
    return this.roles.find(r => r.id === id)?.nome || '';
  }

  displayRoleName = (id: any): string => {
    if (typeof id === 'number') {
      return this.getRoleName(id);
    }
    return '';
  };

  getStationName(id: number): string {
    return this.stations.find(s => s.id === id)?.nome || '';
  }

  displayStationName = (id: any): string => {
    if (typeof id === 'number') {
      return this.getStationName(id);
    }
    return '';
  };

  getSupervisorName(id: number): string {
    return this.supervisors.find(s => s.id === id)?.nome || '';
  }

  displaySupervisorName = (id: any): string => {
    if (typeof id === 'number') {
      return this.getSupervisorName(id);
    }
    return '';
  };

  loadCollaboratorData() {
    if (!this.collaboratorId) {
      return;
    }
    
    forkJoin({
      collaborator: this.collaboratorService.getById(this.collaboratorId),
      details: this.detailService.getByCollaboratorId(this.collaboratorId)
    }).subscribe({
      next: (res) => {
        const collaborator = res.collaborator;
        const details = res.details || [];
        
        // Carregar dados pessoais do primeiro detalhe (se existir)
        const detail = details.length > 0 ? details[0] : null;
        
        const formattedCep = this.cepService.format(collaborator.cep || detail?.cep || '');
        this.lastFetchedCep = this.cepService.normalize(formattedCep);

        this.form.patchValue({
          nome: collaborator.nome,
          pix: collaborator.pix || detail?.pix || '',
          referencia: collaborator.referencia || '',
          cep: formattedCep,
          endereco: collaborator.endereco || detail?.endereco || '',
          numero: collaborator.numero || '',
          complemento: collaborator.complemento || '',
          bairro: collaborator.bairro || detail?.bairro || '',
          cidade: collaborator.cidade || detail?.cidade || '',
          uf: collaborator.uf || detail?.uf || ''
        }, { emitEvent: false });

        // Desabilitar campos de contratação (uses-se apenas a tabela)
        this.form.get('valorDiaria')?.disable();
        this.form.get('funcao')?.disable();
        this.form.get('supervisor')?.disable();
        this.form.get('posto')?.disable();

        // Carregar tabela de contratações
        this.contracts = details;
        this.contractsDataSource.data = details;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notify.error('Erro ao carregar dados do colaborador');
      }
    });
  }

  onSubmit() {
    // Em modo edição, campos de contratação não são validados
    const isFormValid = this.isEditMode 
      ? this.form.get('nome')?.valid && this.form.get('pix')?.valid
      : this.form.valid;

    if (!isFormValid) {
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
      id: this.isEditMode && this.collaboratorId ? this.collaboratorId : 0,
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

    // 2) Montar payload do ColaboradorDetalhe (POST /api/ColaboradorDetalhe)
    const postoId: number = formValue.posto;
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
            return this.createDetail(newId, postoId, valorDiaria, funcaoId, supervisorId);
          }

          return this.collaboratorService.getAll().pipe(
            switchMap((all) => {
              const found = all
                .filter(c => c.nome?.trim().toLowerCase() === cleanValue(formValue.nome).toLowerCase() && !c.excluido)
                .sort((a, b) => (b.id || 0) - (a.id || 0));
              const id = found[0]?.id;
              if (!id) throw new Error('Colaborador criado mas ID não encontrado');
              return this.createDetail(id, postoId, valorDiaria, funcaoId, supervisorId);
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

  private createDetail(idColaborador: number, postoId: number, valorDiaria: number, funcaoId: number, supervisorId: number) {
    const detailPayload: Partial<CollaboratorDetail> = {
      id: 0,
      idColaborador: idColaborador,
      valorDiaria: valorDiaria,
      idFuncao: funcaoId,
      idSupervisor: supervisorId,
      idPosto: postoId
    };
    return this.detailService.create(detailPayload);
  }

  private extractErrorMessage(
    err: { status?: number; error?: { errors?: Record<string, string[]>; title?: string; message?: string; detail?: string } | string; statusText?: string; message?: string },
    fallback: string
  ): string {
    if (err?.status === 0) {
      return 'Não foi possível salvar a contratação. O servidor da API retornou erro interno (500). Isso não é falta de permissão — o time responsável pela API precisa corrigir o endpoint PUT /ColaboradorDetalhe.';
    }
    if (err?.status === 500) {
      const body = err.error;
      if (typeof body === 'string' && body.trim()) return `Erro da API: ${body}`;
      if (body && typeof body === 'object') {
        const detail = body.title || body.message || body.detail;
        if (detail) return `Erro da API: ${detail}`;
      }
      return 'Erro interno da API (500) ao atualizar contratação. Veja o console (F12) para detalhes.';
    }
    if (err?.error && typeof err.error === 'object' && err.error.errors) {
      const errors = err.error.errors;
      const messages = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`);
      return messages.join(' | ');
    }
    if (err?.error && typeof err.error === 'object') {
      return err.error.title || err.error.message || err.statusText || fallback;
    }
    return err?.message || err?.statusText || fallback;
  }

  reset() {
    this.form.reset();
    this.lastFetchedCep = '';
  }

  formatarValor(valor: string): string {
    return formatNumberToCurrency(valor);
  }

  onCepInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = this.cepService.normalize(input.value).slice(0, 8);
    const formatted = this.cepService.format(digits);

    this.form.get('cep')?.setValue(formatted, { emitEvent: true });
    input.value = formatted;

    if (digits.length < 8) {
      this.lastFetchedCep = '';
    }
  }

  private setupCepLookup(): void {
    this.form.get('cep')?.valueChanges.pipe(
      debounceTime(350),
      map(value => this.cepService.normalize(String(value ?? ''))),
      distinctUntilChanged(),
      filter(digits => digits.length === 8),
      filter(digits => digits !== this.lastFetchedCep),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(digits => this.fetchCepAddress(digits));
  }

  formatarCep(): void {
    const control = this.form.get('cep');
    if (!control) return;

    const formatted = this.cepService.format(String(control.value || ''));
    control.setValue(formatted, { emitEvent: false });
  }

  buscarCep(): void {
    const cep = this.cepService.normalize(String(this.form.get('cep')?.value || ''));
    if (!this.cepService.isValid(cep) || cep === this.lastFetchedCep || this.cepLoading) {
      return;
    }
    this.fetchCepAddress(cep);
  }

  private fetchCepAddress(cep: string): void {
    if (this.cepLoading) return;

    this.cepLoading = true;
    this.cdr.markForCheck();

    this.cepService.lookup(cep).subscribe({
      next: (address) => {
        this.cepLoading = false;

        if (!address) {
          this.notify.warn('CEP não encontrado.');
          this.cdr.markForCheck();
          return;
        }

        this.lastFetchedCep = cep;
        this.applyCepAddress(address);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cepLoading = false;
        this.notify.error('Erro ao consultar CEP. Tente novamente.');
        this.cdr.markForCheck();
      }
    });
  }

  private applyCepAddress(address: { cep: string; endereco: string; complemento: string; bairro: string; cidade: string; uf: string }): void {
    const patch: Record<string, string> = {
      cep: address.cep,
      endereco: address.endereco,
      bairro: address.bairro,
      cidade: address.cidade,
      uf: address.uf
    };

    if (address.complemento && !this.form.get('complemento')?.value) {
      patch['complemento'] = address.complemento;
    }

    this.form.patchValue(patch);
  }

  // ===== MÉTODOS DA TABELA DE CONTRATAÇÕES =====

  openContractDialog(contract?: CollaboratorDetail) {
    if (!this.collaboratorId) return;

    const dialogData: ContractDialogData = {
      contract: contract,
      roles: this.roles,
      supervisors: this.supervisors,
      stations: this.stations,
      collaboratorId: this.collaboratorId
    };

    const dialogRef = this.dialog.open(ContractDialog, {
      width: '500px',
      disableClose: true,
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: Partial<CollaboratorDetail> | undefined) => {
      if (!result) return;

      this.loading = true;

      if (result.id) {
        this.detailService.update(result.id, result).subscribe({
          next: () => {
            this.loading = false;
            this.notify.success('Contratação atualizada com sucesso!');
            this.loadContractionsTable();
          },
          error: (err) => {
            this.loading = false;
            this.notify.error(this.extractErrorMessage(err, 'Erro ao atualizar contratação'));
          }
        });
      } else {
        this.detailService.create(result).subscribe({
          next: () => {
            this.loading = false;
            this.notify.success('Contratação adicionada com sucesso!');
            this.loadContractionsTable();
          },
          error: (err) => {
            this.loading = false;
            this.notify.error(this.extractErrorMessage(err, 'Erro ao adicionar contratação'));
          }
        });
      }
    });
  }

  deleteContract(contract: CollaboratorDetail) {
    if (!contract.id) return;

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      data: {
        title: 'Excluir Contratação',
        message: 'Tem certeza que deseja excluir esta contratação?',
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.loading = true;
      this.detailService.delete(contract.id!).subscribe({
        next: () => {
          this.loading = false;
          this.notify.success('Contratação excluída com sucesso!');
          this.loadContractionsTable();
        },
        error: (err) => {
          this.loading = false;
          this.notify.error(this.extractErrorMessage(err, 'Erro ao excluir contratação'));
        }
      });
    });
  }

  private loadContractionsTable() {
    if (!this.collaboratorId) return;

    this.detailService.getByCollaboratorId(this.collaboratorId).subscribe({
      next: (details) => {
        this.contracts = details;
        this.contractsDataSource.data = details;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Erro ao carregar contratações');
      }
    });
  }

}
