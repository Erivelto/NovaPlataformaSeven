import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
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
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
  ],
  templateUrl: './station-select.html',
  styleUrl: './station-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StationSelectComponent),
      multi: true,
    },
  ],
})
export class StationSelectComponent implements ControlValueAccessor, OnChanges {
  @Input() stations: Station[] = [];
  @Input() label = 'Postos *';
  @Input() placeholder = 'Clique para adicionar postos';
  @Input() errorMessage = 'Selecione pelo menos um posto';
  @Output() selectionChange = new EventEmitter<number[]>();

  searchControl = new FormControl<string>('');
  filteredStations$!: Observable<Station[]>;

  selectedIds: number[] = [];
  disabled = false;

  private onChange: (value: number[]) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stations']) {
      this.setupFilter();
    }
  }

  writeValue(value: number[] | null): void {
    this.selectedIds = value ?? [];
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }

  setupFilter(): void {
    this.filteredStations$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterUnselected(value || '')),
    );
  }

  private filterUnselected(search: string): Station[] {
    const term = search.toLowerCase();
    return this.stations
      .filter(s => !this.selectedIds.includes(s.id!))
      .filter(s =>
        term === '' ||
        s.nome.toLowerCase().includes(term) ||
        s.id?.toString().includes(term),
      );
  }

  getStationName(id: number): string {
    return this.stations.find(s => s.id === id)?.nome ?? '';
  }

  addStation(stationId: number): void {
    if (this.selectedIds.includes(stationId)) return;
    this.selectedIds = [...this.selectedIds, stationId];
    this.searchControl.setValue('');
    this.emitChange();
  }

  removeStation(stationId: number): void {
    this.selectedIds = this.selectedIds.filter(id => id !== stationId);
    this.emitChange();
  }

  onBlur(): void {
    this.onTouched();
  }

  private emitChange(): void {
    const value = [...this.selectedIds];
    this.onChange(value);
    this.selectionChange.emit(value);
    this.setupFilter();
  }
}
