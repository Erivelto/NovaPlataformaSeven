import { ChangeDetectionStrategy, Component, DestroyRef, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StationService, Station } from '../../services/station.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-station-registration',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './station-registration.html',
  styleUrl: './station-registration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationRegistration implements OnInit, AfterViewInit {
  private stationService = inject(StationService);
  private notify = inject(NotificationService);
  private confirmService = inject(ConfirmService);
  private destroyRef = inject(DestroyRef);

  novoPosto: string = '';
  displayedColumns: string[] = ['codigo', 'nome', 'actions'];
  dataSource = new MatTableDataSource<Station>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadStations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadStations() {
    this.stationService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: () => {
        this.notify.error('Erro ao carregar postos da API');
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  addStation() {
    // Validar campo vazio
    if (!this.novoPosto || this.novoPosto.trim() === '') {
      this.notify.warn('O campo de posto não pode estar vazio');
      return;
    }

    // Validar nome duplicado
    const nomeNormalizado = this.novoPosto.trim().toLowerCase();
    const postoExistente = this.dataSource.data.find(
      station => station.nome.toLowerCase() === nomeNormalizado
    );

    if (postoExistente) {
      this.notify.warn('Já existe um posto cadastrado com este nome');
      return;
    }

    const newStation: Station = {
      nome: this.novoPosto.trim()
    };
    
    this.stationService.create(newStation).subscribe({
      next: () => {
        this.notify.success('Posto adicionado com sucesso!');
        this.novoPosto = '';
        this.loadStations();
      },
      error: () => {
        this.notify.error('Erro ao cadastrar posto');
      }
    });
  }

  deleteStation(station: Station) {
    this.confirmService.confirmDelete(`o posto ${station.nome}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed && station.id) {
        this.stationService.delete(station.id).subscribe({
          next: () => {
            this.notify.success('Posto excluído com sucesso');
            this.loadStations();
          },
          error: () => {
            this.notify.error('Erro ao excluir posto');
          }
        });
      }
    });
  }
}
