import { Component, ViewChild, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StationService, Station } from '../../services/station.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-station-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './station-registration.html',
  styleUrl: './station-registration.scss'
})
export class StationRegistration implements OnInit, AfterViewInit {
  private stationService = inject(StationService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

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
      error: (err) => {
        console.error('Erro ao carregar postos:', err);
        this.snackBar.open('Erro ao carregar postos da API', 'Fechar', { duration: 3000 });
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
      this.snackBar.open('O campo de posto não pode estar vazio', 'Fechar', { duration: 3000 });
      return;
    }

    // Validar nome duplicado
    const nomeNormalizado = this.novoPosto.trim().toLowerCase();
    const postoExistente = this.dataSource.data.find(
      station => station.nome.toLowerCase() === nomeNormalizado
    );

    if (postoExistente) {
      this.snackBar.open('Já existe um posto cadastrado com este nome', 'Fechar', { duration: 3000 });
      return;
    }

    const newStation: Station = {
      nome: this.novoPosto.trim()
    };
    
    this.stationService.create(newStation).subscribe({
      next: () => {
        this.snackBar.open('Posto adicionado com sucesso!', 'OK', { duration: 2000 });
        this.novoPosto = '';
        this.loadStations();
      },
      error: (err) => {
        console.error('Erro ao adicionar posto:', err);
        this.snackBar.open('Erro ao cadastrar posto', 'Fechar', { duration: 3000 });
      }
    });
  }

  deleteStation(station: Station) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      maxWidth: '90vw',
      data: {
        title: 'Confirmar Exclusão',
        message: `Deseja realmente excluir o posto ${station.nome}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && station.id) {
        this.stationService.delete(station.id).subscribe({
          next: () => {
            this.snackBar.open('Posto excluído com sucesso', 'OK', { duration: 2000 });
            this.loadStations();
          },
          error: (err) => {
            console.error('Erro ao deletar:', err);
            this.snackBar.open('Erro ao excluir posto', 'Fechar', { duration: 3000 });
          }
        });
      }
    });
  }
}
