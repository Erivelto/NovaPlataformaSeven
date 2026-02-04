import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DailyService } from '../../services/daily.service';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorSearchComponent } from '../../shared/collaborator-search/collaborator-search';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-add-single-di',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    CollaboratorSearchComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './add-single-di.html',
  styleUrl: './add-single-di.scss'
})
export class AddSingleDi implements OnInit {
  private fb = inject(FormBuilder);
  private dailyService = inject(DailyService);
  private collaboratorService = inject(CollaboratorService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  collaborators: Collaborator[] = [];
  loading = false;

  ngOnInit() {
    this.initForm();
    this.loadCollaborators();
  }

  initForm() {
    this.form = this.fb.group({
      dataDiaria: [new Date(), Validators.required],
      colaboradorId: ['', Validators.required]
    });
  }

  loadCollaborators() {
    this.collaboratorService.getAll().subscribe({
      next: (data) => {
        this.collaborators = data;
      },
      error: (err) => {
        console.error('Erro ao carregar colaboradores:', err);
        this.snackBar.open('Erro ao carregar colaboradores', 'Fechar', { duration: 3000 });
      }
    });
  }

  onCollaboratorChange(collaboratorId: number) {
    this.form.patchValue({
      colaboradorId: collaboratorId
    });
  }

  save() {
    if (this.form.invalid) {
      this.snackBar.open('Preencha todos os campos obrigatórios', 'Fechar', { duration: 3000 });
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    const dailyData = {
      dataDiaria: formValue.dataDiaria.toISOString().split('T')[0],
      colaboradorId: formValue.colaboradorId
    };

    this.dailyService.create(dailyData as any).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Diária cadastrada com sucesso!', 'OK', { duration: 2000 });
        this.reset();
      },
      error: (err) => {
        this.loading = false;
        console.error('Erro ao cadastrar diária:', err);
        this.snackBar.open('Erro ao cadastrar diária', 'Fechar', { duration: 3000 });
      }
    });
  }

  reset() {
    this.form.reset({
      dataDiaria: new Date(),
      colaboradorId: ''
    });
  }
}
