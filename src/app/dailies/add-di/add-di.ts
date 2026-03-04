import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin } from 'rxjs';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, DetailOption } from '../../services/collaborator-detail.service';
import { DailyService, Daily } from '../../services/daily.service';
import { StationService, Station } from '../../services/station.service';
import { AdiantamentoService, Adiantamento } from '../../services/adiantamento.service';
import { CollaboratorSearchComponent } from '../../shared/collaborator-search/collaborator-search';

/** Linha da tabela — 1 por data da semana */
export interface DailyRow {
  dataDiaria: string;                       // yyyy-MM-dd
  idColaboradorDetalhe: number | null;       // preenchido ao escolher a opção no dropdown
  valor: number;                             // Dias a GRAVAR (quantidade de POSTs)
  existingCount: number;                     // Diárias já salvas para esta data (todos os detalhes)
}

@Component({
  selector: 'app-add-di',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatTooltipModule,
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
  private collaboratorDetailService = inject(CollaboratorDetailService);
  private dailyService = inject(DailyService);
  private stationService = inject(StationService);
  private adiantamentoService = inject(AdiantamentoService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['select', 'data', 'diaria', 'existentes', 'posto'];
  dataSource = new MatTableDataSource<DailyRow>([]);
  selection = new SelectionModel<DailyRow>(true, []);

  collaborators: Collaborator[] = [];
  stations: Station[] = [];
  detailOptions: DetailOption[] = [];  // opções do dropdown (id + descrição)
  selectedCollaboratorId: number | null = null;

  // Campos de adiantamento
  private _valorAdiantamento: number = 0;
  dataAdiantamento: Date = new Date();
  valorAdiantamentoStr: string = '';
  isSaving: boolean = false;
  isLoadingDailies: boolean = false;

  formatarValorAdiantamento() {
    // ngx-mask cuida da formatação automaticamente
    this._valorAdiantamento = parseFloat(this.valorAdiantamentoStr.replace(/\./g, '').replace(',', '.'));
  }

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

  /** Calcula as 7 datas da semana anterior (segunda a domingo) */
  getWeekDates(): string[] {
    const today = new Date();
    const lastMonday = new Date(today);
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0) {
      lastMonday.setDate(today.getDate() - 6);
    } else {
      lastMonday.setDate(today.getDate() - dayOfWeek - 6);
    }
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(lastMonday);
      date.setDate(lastMonday.getDate() + i);
      dates.push(this.formatDateForInput(date.toISOString()));
    }
    return dates;
  }

  onCollaboratorChange(collaboratorId: number) {
    this.selectedCollaboratorId = collaboratorId;
    this.selection.clear();
    this.detailOptions = [];
    this.isLoadingDailies = true;

    const weekDates = this.getWeekDates();

    // 1. Busca opções do dropdown (endpoint /select)
    this.collaboratorDetailService.getSelectOptions(collaboratorId).subscribe({
      next: (options: DetailOption[]) => {
        this.detailOptions = options || [];

        if (this.detailOptions.length === 0) {
          this.isLoadingDailies = false;
          this.dataSource.data = [];
          this.snackBar.open('Nenhum detalhe cadastrado para este colaborador', 'Fechar', { duration: 3000 });
          return;
        }

        // 2. Para cada detalhe, busca diárias existentes para contar por data
        const requests = options.map(opt =>
          this.dailyService.getByCollaboratorDetailId(opt.id)
        );

        forkJoin(requests).subscribe({
          next: (allExisting: Daily[][]) => {
            this.isLoadingDailies = false;
            const allDailies = allExisting.flat();

            const rows: DailyRow[] = weekDates.map(dateStr => {
              const count = allDailies.filter(
                d => d.dataDiaria.split('T')[0] === dateStr
              ).length;

              return {
                dataDiaria: dateStr,
                idColaboradorDetalhe: null,
                valor: 1,
                existingCount: count
              };
            });

            this.dataSource.data = rows;

            const totalExisting = rows.reduce((sum, r) => sum + r.existingCount, 0);
            if (totalExisting > 0) {
              this.snackBar.open(
                `${options.length} posto(s) disponível(is). ${totalExisting} diária(s) já salva(s).`,
                'OK', { duration: 3000 }
              );
            }
          },
          error: () => {
            this.isLoadingDailies = false;
            this.dataSource.data = weekDates.map(dateStr => ({
              dataDiaria: dateStr,
              idColaboradorDetalhe: null,
              valor: 1,
              existingCount: 0
            }));
          }
        });
      },
      error: () => {
        this.isLoadingDailies = false;
        this.dataSource.data = weekDates.map(dateStr => ({
          dataDiaria: dateStr,
          idColaboradorDetalhe: null,
          valor: 1,
          existingCount: 0
        }));
        this.detailOptions = [];
        this.snackBar.open('Erro ao buscar detalhes do colaborador', 'Fechar', { duration: 3000 });
      }
    });
  }

  /** Verifica se a linha já possui diárias salvas */
  hasExistingDailies(row: DailyRow): boolean {
    return row.existingCount > 0;
  }

  checkboxLabel(row: DailyRow): string {
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  get canSaveDailies(): boolean {
    if (this.isSaving) return false;
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 3;
  }

  get deadlineMessage(): string {
    if (this.canSaveDailies) {
      const today = new Date();
      const daysLeft = 3 - today.getDay();
      return daysLeft === 0 ? 'Último dia para salvar!' : `Faltam ${daysLeft} dia(s) para o prazo.`;
    }
    return 'Prazo encerrado. O caixa fecha toda quinta-feira.';
  }

  saveDailies() {
    if (!this.selectedCollaboratorId) {
      this.snackBar.open('Selecione um colaborador primeiro', 'Fechar', { duration: 3000 });
      return;
    }
    if (!this.canSaveDailies) {
      this.snackBar.open('O prazo para salvar diárias desta semana já expirou.', 'Fechar', { duration: 4000 });
      return;
    }

    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) {
      this.snackBar.open('Selecione ao menos uma diária para enviar', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar se todas as linhas selecionadas têm valor (dias) > 0
    const emptyRows = selectedRows.filter(d => !d.valor || d.valor <= 0);
    if (emptyRows.length > 0) {
      this.snackBar.open('Preencha o campo Dias para todos os dias marcados', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar se todas as linhas selecionadas têm posto selecionado
    const noPosto = selectedRows.filter(d => !d.idColaboradorDetalhe);
    if (noPosto.length > 0) {
      this.snackBar.open('Selecione o posto para todos os dias marcados', 'Fechar', { duration: 3000 });
      return;
    }

    // Expande: cada linha com valor=N gera N registros Daily para enviar
    const dailiesToSave: Daily[] = [];
    for (const row of selectedRows) {
      for (let i = 0; i < row.valor; i++) {
        dailiesToSave.push({
          idColaboradorDetalhe: row.idColaboradorDetalhe!,
          dataDiaria: row.dataDiaria
        });
      }
    }

    this.isSaving = true;
    this.dailyService.saveDailies(dailiesToSave).subscribe({
      next: () => {
        const total = dailiesToSave.length;
        
        // Se houver adiantamento, salvar também
        if (this._valorAdiantamento > 0) {
          const adiantamento: Adiantamento = {
            idColaborador: this.selectedCollaboratorId!,
            valor: this._valorAdiantamento,
            data: this.formatDateForInput(this.dataAdiantamento.toISOString().split('T')[0])
          };
          
          this.adiantamentoService.create(adiantamento).subscribe({
            next: () => {
              this.snackBar.open(`${total} diária(s) e adiantamento salvo(s) com sucesso!`, 'OK', { duration: 3000 });
              this.resetAfterSave();
            },
            error: (err: any) => {
              console.error('Erro ao salvar adiantamento:', err);
              this.snackBar.open(`Diárias salvas, mas erro ao salvar adiantamento: ${err?.error?.message || 'Erro desconhecido'}`, 'Fechar', { duration: 4000 });
              this.isSaving = false;
            }
          });
        } else {
          this.snackBar.open(`${total} diária(s) salva(s) com sucesso!`, 'OK', { duration: 3000 });
          this.resetAfterSave();
        }
      },
      error: (err: any) => {
        console.error('Erro ao salvar diárias:', err);
        this.snackBar.open('Erro ao salvar diárias', 'Fechar', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  resetAfterSave() {
    this.isSaving = false;
    this.selection.clear();
    // Recarrega os dados do colaborador selecionado
    if (this.selectedCollaboratorId) {
      this.onCollaboratorChange(this.selectedCollaboratorId);
    }
  }

  deleteDaily(row: DailyRow) {
    this.dataSource.data = this.dataSource.data.filter(d => d !== row);
    this.selection.deselect(row);
  }

  resetForm() {
    this.selectedCollaboratorId = null;
    this.dataSource.data = [];
    this.selection.clear();
    this.detailOptions = [];
    this.valorAdiantamentoStr = '';
    this._valorAdiantamento = 0;
    this.dataAdiantamento = new Date();
    this.isSaving = false;
    this.isLoadingDailies = false;
  }

  getStationName(stationId: number | undefined): string {
    const station = this.stations.find(s => s.id === stationId);
    return station ? station.nome : 'N/A';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
