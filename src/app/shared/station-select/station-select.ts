import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Station } from '../../services/station.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-station-select',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './station-select.html',
  styleUrl: './station-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationSelectComponent implements OnChanges {
  @Input() stations: Station[] = [];
  @Input() label = 'Posto';
  @Output() selectionChange = new EventEmitter<number | null>();

  stationFilterControl = new FormControl<string>('');
  filteredStations!: Observable<Station[]>;
  selectedStationId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stations']) {
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
    return this.stations.filter(s =>
      s.nome.toLowerCase().includes(filterValue) ||
      s.id?.toString().includes(filterValue)
    );
  }

  getSelectedStationName(): string {
    const station = this.stations.find(s => s.id === this.selectedStationId);
    return station ? `${station.nome} - Cód: ${station.id}` : 'Selecione um posto';
  }

  onStationSelected(): void {
    this.selectionChange.emit(this.selectedStationId ?? null);
  }
}
