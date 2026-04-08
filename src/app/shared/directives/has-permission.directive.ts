import { Directive, Input, OnInit, OnDestroy, inject, TemplateRef, ViewContainerRef, effect, signal } from '@angular/core';
import { PermissionService } from '../../services/permission.service';

@Directive({
  standalone: true,
  selector: '[appHasPermission]'
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private permissionService = inject(PermissionService);
  private templateRef = inject(TemplateRef<any>);
  private vcr = inject(ViewContainerRef);

  private readonly codigosSignal = signal<number[]>([]);
  private viewCreated = false;

  @Input() set appHasPermission(value: number | number[]) {
    const codes = Array.isArray(value) ? value : [value];
    this.codigosSignal.set(codes);
  }

  constructor() {
    effect(() => {
      const codes = this.codigosSignal();
      // Lê permissionsSignal — registra dependência reativa
      const permsForTracking = this.permissionService.permissionsSignal();
      const allowed = codes.length > 0 && this.permissionService.hasPermission(codes);
      if (allowed && !this.viewCreated) {
        this.vcr.createEmbeddedView(this.templateRef);
        this.viewCreated = true;
      } else if (!allowed && this.viewCreated) {
        this.vcr.clear();
        this.viewCreated = false;
      }
    });
  }

  ngOnInit(): void {}
  ngOnDestroy(): void { this.vcr.clear(); }
}
