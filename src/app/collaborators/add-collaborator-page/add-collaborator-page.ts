import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AddCollaborator } from '../add-collaborator/add-collaborator';

@Component({
  selector: 'app-add-collaborator-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    AddCollaborator
  ],
  templateUrl: './add-collaborator-page.html',
  styleUrl: './add-collaborator-page.scss'
})
export class AddCollaboratorPage {
  private router = inject(Router);

  onCollaboratorAdded() {
    this.router.navigate(['/colaboradores']);
  }

  goBack() {
    this.router.navigate(['/colaboradores']);
  }
}
