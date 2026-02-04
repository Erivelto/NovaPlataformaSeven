import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Collaborator } from '../../services/collaborator.service';

@Component({
  selector: 'app-collaborator-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './collaborator-search.html',
  styleUrl: './collaborator-search.scss'
})
export class CollaboratorSearchComponent implements OnInit, OnChanges {
  @Input() collaborators: Collaborator[] = [];
  @Input() label: string = 'Selecione o Colaborador *';
  @Output() collaboratorSelected = new EventEmitter<number>();

  collaboratorFilterControl = new FormControl<string>('');
  filteredCollaborators!: Observable<Collaborator[]>;
  selectedCollaboratorId: number | null = null;

  ngOnInit() {
    this.setupFilter();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['collaborators'] && !changes['collaborators'].firstChange) {
      // Reconfigurar o filtro quando os colaboradores mudarem
      this.setupFilter();
    }
  }

  setupFilter() {
    this.filteredCollaborators = this.collaboratorFilterControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCollaborators(value || '')),
    );
  }

  private _filterCollaborators(value: string): Collaborator[] {
    const filterValue = value.toLowerCase();
    return this.collaborators.filter(collaborator => 
      collaborator.nome.toLowerCase().includes(filterValue) ||
      collaborator.id?.toString().includes(filterValue)
    );
  }

  getSelectedCollaboratorName(): string {
    const collaborator = this.collaborators.find(c => c.id === this.selectedCollaboratorId);
    return collaborator ? `${collaborator.nome} - Cód: ${collaborator.id}` : 'Selecione um colaborador';
  }

  onCollaboratorSelected() {
    if (this.selectedCollaboratorId) {
      this.collaboratorSelected.emit(this.selectedCollaboratorId);
    }
  }
}
