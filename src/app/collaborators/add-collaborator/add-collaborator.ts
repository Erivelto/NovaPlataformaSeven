import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CollaboratorService } from '../../services/collaborator.service';
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
    MatSnackBarModule
  ],
  templateUrl: './add-collaborator.html',
  styleUrl: './add-collaborator.scss'
})
export class AddCollaborator implements OnInit {
  @Output() collaboratorAdded = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private collaboratorService = inject(CollaboratorService);
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
  }

  initForm() {
    this.form = this.fb.group({
      // Dados Pessoais
      nome: ['', [Validators.required, Validators.minLength(3)]],
      pix: ['', Validators.required],
      referencia: [''],

      // Endereço
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      logradouro: ['', Validators.required],
      numero: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],

      // Contratação
      valorDiaria: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
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
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.snackBar.open('Erro ao carregar opções do formulário', 'Fechar', { duration: 3000 });
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

    const collaboratorData = {
      nome: formValue.nome,
      cep: formValue.cep.replace('-', ''),
      logradouro: formValue.logradouro,
      numero: formValue.numero,
      complemento: formValue.complemento,
      bairro: formValue.bairro,
      cidade: formValue.cidade,
      estado: formValue.estado,
      referencia: formValue.referencia,
      pix: formValue.pix,
      valorDiaria: parseFloat(formValue.valorDiaria),
      funcaoId: formValue.funcao,
      supervisorId: formValue.supervisor,
      postoId: formValue.posto
    };

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

  reset() {
    this.form.reset();
  }
}
