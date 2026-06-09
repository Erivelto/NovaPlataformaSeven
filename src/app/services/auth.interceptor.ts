import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';
import { environment } from '../environments/environment';
import { finalize, catchError, throwError } from 'rxjs';

function isApiRequest(url: string): boolean {
  const base = environment.apiBaseUrl;
  if (url.startsWith(base)) return true;

  try {
    const path = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').pathname;
    return path.startsWith(base);
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);
  const token = authService.getToken();

  loadingService.show();

  let request = req;
  if (token && isApiRequest(req.url)) {
    request = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
        notificationService.warn('Sessão expirada. Faça login novamente.');
      } else if (error.status === 403) {
        notificationService.error('Acesso negado.');
      } else if (error.status >= 500) {
        if (!environment.production) {
          console.error('[API erro]', error.status, error.url, error.error);
        }
        notificationService.error('Erro interno do servidor. Tente novamente.');
      }
      return throwError(() => error);
    }),
    finalize(() => loadingService.hide())
  );
};
