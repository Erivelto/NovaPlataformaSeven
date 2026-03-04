import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
export class AddCollaboratorPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  collaboratorId: number | null = null;
  isEditMode = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.collaboratorId = parseInt(id);
      this.isEditMode = true;
    }
  }

  onCollaboratorAdded() {
    this.router.navigate(['/colaboradores']);
  }

  goBack() {
    this.router.navigate(['/colaboradores']);
  }
}
