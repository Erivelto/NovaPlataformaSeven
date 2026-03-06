import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin } from 'rxjs';
import { CollaboratorService, Collaborator } from '../../services/collaborator.service';
import { CollaboratorDetailService, DetailOption } from '../../services/collaborator-detail.service';
import { DailyService, Daily } from '../../services/daily.service';
import { StationService, Station } from '../../services/station.service';
import { AdiantamentoService, Adiantamento } from '../../services/adiantamento.service';
import { NotificationService } from '../../services/notification.service';
import { parseCurrencyToNumber, formatNumberToCurrency } from '../../shared/utils/currency.utils';
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
    MatTooltipModule,
    MatProgressBarModule,
    CollaboratorSearchComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './add-di.html',
  styleUrl: './add-di.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDi implements OnInit, AfterViewInit {
  private collaboratorService = inject(CollaboratorService);
  private collaboratorDetailService = inject(CollaboratorDetailService);
  private dailyService = inject(DailyService);
  private stationService = inject(StationService);
  private adiantamentoService = inject(AdiantamentoService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

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

  // Limites do datepicker de adiantamento (range da grid)
  minDateAdiantamento: Date = new Date();
  maxDateAdiantamento: Date = new Date();

  formatarValorAdiantamento() {
    if (!this.valorAdiantamentoStr) {
      this._valorAdiantamento = 0;
      return;
    }
    this._valorAdiantamento = parseCurrencyToNumber(this.valorAdiantamentoStr);
    if (this._valorAdiantamento === 0) {
      this.valorAdiantamentoStr = '';
      return;
    }
    this.valorAdiantamentoStr = formatNumberToCurrency(this._valorAdiantamento);
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Erro ao carregar colaboradores');
        this.cdr.markForCheck();
      }
    });
  }

  loadStations() {
    this.stationService.getAll().subscribe({
      next: (data) => {
        this.stations = data;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notify.error('Erro ao carregar postos');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Calcula as 7 datas (segunda a domingo) da semana a exibir.
   * A partir de quinta-feira, exibe a semana corrente.
   * De segunda a quarta, exibe a semana anterior.
   */
  getWeekDates(): string[] {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb

    // Calcula a segunda-feira da semana atual
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);

    // Seg–Qua: mostra semana anterior; Qui–Dom: mostra semana corrente
    if (dayOfWeek >= 1 && dayOfWeek <= 3) {
      monday.setDate(monday.getDate() - 7);
    }

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(this.formatDateForInput(date.toISOString()));
    }

    // Atualiza limites do datepicker de adiantamento
    this.minDateAdiantamento = new Date(monday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.maxDateAdiantamento = sunday;
    this.dataAdiantamento = new Date(monday);

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
          this.cdr.markForCheck();
          this.notify.warn('Nenhum detalhe cadastrado para este colaborador');
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
              this.notify.info(
                `${options.length} posto(s) disponível(is). ${totalExisting} diária(s) já salva(s).`
              );
            }
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoadingDailies = false;
            this.dataSource.data = weekDates.map(dateStr => ({
              dataDiaria: dateStr,
              idColaboradorDetalhe: null,
              valor: 1,
              existingCount: 0
            }));
            this.cdr.markForCheck();
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
        this.notify.error('Erro ao buscar detalhes do colaborador');
        this.cdr.markForCheck();
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
    return this.selection.selected.length > 0;
  }

  saveDailies() {
    if (!this.selectedCollaboratorId) {
      this.notify.warn('Selecione um colaborador primeiro');
      return;
    }
    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) {
      this.notify.warn('Selecione ao menos uma diária para enviar');
      return;
    }

    // Validar se todas as linhas selecionadas têm valor (dias) > 0
    const emptyRows = selectedRows.filter(d => !d.valor || d.valor <= 0);
    if (emptyRows.length > 0) {
      this.notify.warn('Preencha o campo Dias para todos os dias marcados');
      return;
    }

    // Validar se todas as linhas selecionadas têm posto selecionado
    const noPosto = selectedRows.filter(d => !d.idColaboradorDetalhe);
    if (noPosto.length > 0) {
      this.notify.warn('Selecione o posto para todos os dias marcados');
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
            data: this.dataAdiantamento.toISOString()
          };
          
          this.adiantamentoService.create(adiantamento).subscribe({
            next: () => {
              this.notify.success(`${total} diária(s) e adiantamento salvo(s) com sucesso!`);
              this.resetAfterSave();
            },
            error: (err: { error?: { message?: string } }) => {
              this.notify.warn(`Diárias salvas, mas erro ao salvar adiantamento: ${err?.error?.message || 'Erro desconhecido'}`);
              this.isSaving = false;
            }
          });
        } else {
          this.notify.success(`${total} diária(s) salva(s) com sucesso!`);
          this.resetAfterSave();
        }
      },
      error: (err: any) => {
        this.notify.error('Erro ao salvar diárias');
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
