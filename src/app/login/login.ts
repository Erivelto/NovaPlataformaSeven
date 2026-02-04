import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loading = false;
  error: string | null = null;
  
  // Propriedades para bind direto no HTML via [(ngModel)]
  user = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  submit(form: any) {
    if (form.valid) {
      this.loading = true;
      this.error = null;

      const credentials = {
        user: this.user,
        password: this.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.loading = false;
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Usuário ou senha inválidos. Tente novamente.';
          console.error('Login error:', err);
        }
      });
    }
  }
}
