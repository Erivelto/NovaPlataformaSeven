import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AddCollaborator } from '../add-collaborator/add-collaborator';

@Component({
  selector: 'app-add-collaborator-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    AddCollaborator
  ],
  templateUrl: './add-collaborator-page.html',
  styleUrl: './add-collaborator-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCollaboratorPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  
  collaboratorId: number | null = null;
  isEditMode = false;

  ngOnInit() {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      this.collaboratorId = parseInt(idFromRoute, 10);
      this.isEditMode = true;
      this.cdr.markForCheck();
    }
  }

  onCollaboratorAdded() {
    this.router.navigate(['/colaboradores']);
  }

  goBack() {
    this.router.navigate(['/colaboradores']);
  }
}
