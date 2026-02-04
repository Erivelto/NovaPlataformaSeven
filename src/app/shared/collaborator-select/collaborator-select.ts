import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { Collaborator, CollaboratorService } from '../../services/collaborator.service';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-collaborator-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    MatOptionModule
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Colaborador</mat-label>
      <mat-select 
        [formControl]="selectedCollaborator"
        (selectionChange)="onSelectionChange($event)"
        [compareWith]="compareById">
        <mat-option [value]="null">Todos</mat-option>
        <mat-option *ngFor="let col of filteredCollaborators$ | async" [value]="col.id">
          {{col.nome}}
        </mat-option>
      </mat-select>
      <mat-icon matPrefix>person</mat-icon>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class CollaboratorSelectComponent implements OnInit {
  @Input() collaborators: Collaborator[] = [];
  @Output() selectionChange = new EventEmitter<number | null>();

  private collaboratorService = inject(CollaboratorService);

  selectedCollaborator = new FormControl<number | null>(null);
  filteredCollaborators$: Observable<Collaborator[]> = of([]);

  ngOnInit() {
    this.filteredCollaborators$ = this.selectedCollaborator.valueChanges.pipe(
      startWith(null),
      map(() => this.collaborators)
    );
  }

  onSelectionChange(event: any) {
    this.selectionChange.emit(event.value);
  }

  compareById(a: any, b: any): boolean {
    return a === b;
  }
}
