import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Station } from '../../services/station.service';

@Component({
  selector: 'app-station-search',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './station-search.html',
  styleUrl: './station-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationSearchComponent implements OnInit, OnChanges {
  @Input() stations: Station[] = [];
  @Input() label = 'Posto';
  @Input() showAllOption = true;
  @Output() stationSelected = new EventEmitter<number | null>();

  stationFilterControl = new FormControl<string>('');
  filteredStations!: Observable<Station[]>;
  selectedStationId: number | null = null;

  ngOnInit(): void {
    this.setupFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stations'] && !changes['stations'].firstChange) {
      this.setupFilter();
    }
  }

  setupFilter(): void {
    this.filteredStations = this.stationFilterControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterStations(value || '')),
    );
  }

  private _filterStations(value: string): Station[] {
    const filterValue = value.toLowerCase();
    return this.stations.filter(station =>
      station.nome.toLowerCase().includes(filterValue) ||
      station.id?.toString().includes(filterValue)
    );
  }

  getSelectedStationName(): string {
    if (this.selectedStationId === null) {
      return this.showAllOption ? 'Todos' : 'Selecione um posto';
    }
    const station = this.stations.find(s => s.id === this.selectedStationId);
    return station ? station.nome : 'Selecione um posto';
  }

  onStationSelected(): void {
    this.stationSelected.emit(this.selectedStationId);
  }
}
