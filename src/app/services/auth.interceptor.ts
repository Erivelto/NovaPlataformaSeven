import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { LoadingService } from './loading.service';
import { finalize } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);
  const token = authService.getToken();

  // Mostra o loading
  loadingService.show();

  // Não adiciona o header na chamada de login ou se não houver token
  if (token && !req.url.includes('/login')) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned).pipe(
      finalize(() => loadingService.hide())
    );
  }

  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};
