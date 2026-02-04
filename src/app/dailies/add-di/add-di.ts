import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { DailyService, Daily } from '../../services/daily.service';
import { StationService, Station } from '../../services/station.service';
import { CollaboratorSearchComponent } from '../../shared/collaborator-search/collaborator-search';

@Component({
  selector: 'app-add-di',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    CollaboratorSearchComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './add-di.html',
  styleUrl: './add-di.scss'
})
export class AddDi implements OnInit, AfterViewInit {
  private collaboratorService = inject(CollaboratorService);
  private dailyService = inject(DailyService);
  private stationService = inject(StationService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['select', 'data', 'diaria', 'posto', 'actions'];
  dataSource = new MatTableDataSource<Daily>([]);
  selection = new SelectionModel<Daily>(true, []);
  
  collaborators: Collaborator[] = [];
  stations: Station[] = [];
  selectedCollaboratorId: number | null = null;

  // Novos campos de adiantamento
  valorAdiantamento: number = 0;
  dataAdiantamento: Date = new Date();

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadCollaborators();
    this.loadStations();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
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

  loadStations() {
    this.stationService.getAll().subscribe({
      next: (data) => {
        this.stations = data;
      },
      error: (err) => {
        console.error('Erro ao carregar postos:', err);
        this.snackBar.open('Erro ao carregar postos', 'Fechar', { duration: 3000 });
      }
    });
  }

  onCollaboratorChange(collaboratorId: number) {
    this.selectedCollaboratorId = collaboratorId;

    // Cria 7 linhas vazias para cadastro de diárias
    const today = new Date();
    const dailies: Daily[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      dailies.push({
        idColaboradorDetalhe: this.selectedCollaboratorId,
        dataDiaria: this.formatDateForInput(date.toISOString()),
        valor: 0,
        idPosto: undefined
      });
    }
    
    this.dataSource.data = dailies;
    this.snackBar.open('7 diárias criadas para cadastro', 'OK', { duration: 2000 });
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row: Daily): string {
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addEmptyRow() {
    if (!this.selectedCollaboratorId) {
      this.snackBar.open('Selecione um colaborador primeiro', 'Fechar', { duration: 3000 });
      return;
    }

    const newRow: Daily = {
      idColaboradorDetalhe: this.selectedCollaboratorId,
      dataDiaria: new Date().toISOString().split('T')[0],
      valor: 0,
      idPosto: this.stations[0]?.id
    };
    this.dataSource.data = [...this.dataSource.data, newRow];
  }

  deleteDaily(daily: Daily) {
    this.dataSource.data = this.dataSource.data.filter(d => d !== daily);
    this.selection.deselect(daily);
  }

  getStationName(stationId: number | undefined): string {
    const station = this.stations.find(s => s.id === stationId);
    return station ? station.nome : 'N/A';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  formatDateForInput(dateString: string): string {
    // Converte para formato yyyy-MM-dd que o input type="date" requer
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
