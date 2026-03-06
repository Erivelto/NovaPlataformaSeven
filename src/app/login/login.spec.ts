import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn(),
      logout: vi.fn(),
      getToken: vi.fn()
    };
    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
  });

  // ============================================================================
  // Component Creation
  // ============================================================================
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty user and password', () => {
    expect(component.user).toBe('');
    expect(component.password).toBe('');
  });

  it('should initialize with loading false and no error', () => {
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  // ============================================================================
  // Password Visibility Toggle
  // ============================================================================
  describe('Password Visibility', () => {
    it('should hide password by default', () => {
      fixture.detectChanges();
      const passwordInput = fixture.debugElement.query(By.css('input[name="password"]'));
      expect(passwordInput.nativeElement.type).toBe('password');
      expect(component.showPassword()).toBe(false);
    });

    it('should toggle password visibility', () => {
      fixture.detectChanges();
      const passwordInput = fixture.debugElement.query(By.css('input[name="password"]'));

      component.togglePasswordVisibility();
      fixture.detectChanges();
      expect(component.showPassword()).toBe(true);
      expect(passwordInput.nativeElement.type).toBe('text');

      component.togglePasswordVisibility();
      fixture.detectChanges();
      expect(component.showPassword()).toBe(false);
      expect(passwordInput.nativeElement.type).toBe('password');
    });

    it('should have aria-label on password toggle button', () => {
      fixture.detectChanges();
      const toggleBtn = fixture.debugElement.query(By.css('button[matSuffix]'));
      expect(toggleBtn.nativeElement.getAttribute('aria-label')).toBeTruthy();
      expect(toggleBtn.nativeElement.getAttribute('aria-pressed')).toBeTruthy();
    });

    it('should update aria-label on toggle', () => {
      fixture.detectChanges();
      const toggleBtn = fixture.debugElement.query(By.css('button[matSuffix]'));
      expect(toggleBtn.nativeElement.getAttribute('aria-label')).toContain('Mostrar');

      component.togglePasswordVisibility();
      fixture.detectChanges();
      expect(toggleBtn.nativeElement.getAttribute('aria-label')).toContain('Ocultar');
    });
  });

  // ============================================================================
  // Form Validation
  // ============================================================================
  describe('Form Validation', () => {
    it('should NOT submit when form is invalid', () => {
      const form = { valid: false };
      component.submit(form);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should submit credentials when form is valid', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'test-token' }));
      component.user = 'validuser';
      component.password = 'validpassword';

      component.submit({ valid: true });

      expect(mockAuthService.login).toHaveBeenCalledWith({
        user: 'validuser',
        password: 'validpassword'
      });
    });

    it('should only send user and password fields', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'test-token' }));
      component.user = 'testuser';
      component.password = 'password123';
      component.submit({ valid: true });

      const callArgs = mockAuthService.login.mock.calls[0][0];
      expect(Object.keys(callArgs)).toEqual(['user', 'password']);
    });

    it('should have required fields in the form', () => {
      fixture.detectChanges();
      const userInput = fixture.debugElement.query(By.css('input[name="user"]'));
      const passwordInput = fixture.debugElement.query(By.css('input[name="password"]'));
      expect(userInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
    });
  });

  // ============================================================================
  // Login Success
  // ============================================================================
  describe('Successful Login', () => {
    it('should navigate to home on success', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'jwt-token' }));
      component.user = 'testuser';
      component.password = 'password123';
      component.submit({ valid: true });

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should clear error on new login attempt', () => {
      component.error.set('Previous error');
      mockAuthService.login.mockReturnValue(of({ token: 'test-token' }));

      component.user = 'testuser';
      component.password = 'password123';
      component.submit({ valid: true });

      expect(component.error()).toBeNull();
    });

    it('should set loading false after success', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'test-token' }));
      component.user = 'testuser';
      component.password = 'password123';
      component.submit({ valid: true });

      expect(component.loading()).toBe(false);
    });
  });

  // ============================================================================
  // Login Failure
  // ============================================================================
  describe('Failed Login', () => {
    it('should NOT navigate on failed login', () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => new Error('Invalid credentials'))
      );
      component.user = 'testuser';
      component.password = 'wrong';
      component.submit({ valid: true });

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should show generic error message on failure', () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => ({ status: 401 }))
      );
      component.user = 'testuser';
      component.password = 'wrong';
      component.submit({ valid: true });

      expect(component.error()).toBe('Usu\u00e1rio ou senha inv\u00e1lidos. Tente novamente.');
    });

    it('should not reveal internal server details in error', () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => new Error('Database connection failed at 192.168.1.1:5432'))
      );
      component.user = 'testuser';
      component.password = 'password123';
      component.submit({ valid: true });

      expect(component.error()).toBe('Usu\u00e1rio ou senha inv\u00e1lidos. Tente novamente.');
      expect(component.error()).not.toContain('Database');
      expect(component.error()).not.toContain('192.168.1.1');
    });

    it('should set loading false after failure', () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => new Error('fail'))
      );
      component.user = 'testuser';
      component.password = 'password123';
      component.submit({ valid: true });

      expect(component.loading()).toBe(false);
    });

    it('should handle network errors gracefully', () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => new Error('Network timeout after 30s'))
      );
      component.user = 'testuser';
      component.password = 'password123';
      component.submit({ valid: true });

      expect(component.error()).toBe('Usu\u00e1rio ou senha inv\u00e1lidos. Tente novamente.');
      expect(component.loading()).toBe(false);
    });
  });

  // ============================================================================
  // Loading State & Template
  // ============================================================================
  describe('Loading State & Template', () => {
    it('should have a submit button', () => {
      fixture.detectChanges();
      const submitBtn = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitBtn).toBeTruthy();
    });

    it('should render error message in template', () => {
      component.error.set('Test error');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.login-error'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain('Test error');
    });

    it('should escape HTML in error messages (XSS prevention)', () => {
      const xssPayload = '<img src=x onerror="alert(\'XSS\')">';
      component.error.set(xssPayload);
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.login-error'));
      if (errorElement) {
        expect(errorElement.nativeElement.innerHTML).not.toContain('<img');
      }
    });
  });

  // ============================================================================
  // Special Characters Handling
  // ============================================================================
  describe('Special Characters', () => {
    it('should handle special characters in credentials', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'test-token' }));
      component.user = 'user@domain.com';
      component.password = 'P@ssw0rd!#$%^&*()';
      component.submit({ valid: true });

      expect(mockAuthService.login).toHaveBeenCalledWith({
        user: 'user@domain.com',
        password: 'P@ssw0rd!#$%^&*()'
      });
    });

    it('should handle SQL injection-like strings safely', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'test-token' }));
      component.user = "admin' OR '1'='1";
      component.password = "password123' OR '1'='1";
      component.submit({ valid: true });

      expect(mockAuthService.login).toHaveBeenCalledWith({
        user: "admin' OR '1'='1",
        password: "password123' OR '1'='1"
      });
    });
  });
});
