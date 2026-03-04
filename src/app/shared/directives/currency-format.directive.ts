import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Diretiva para formatação de valores monetários em tempo real (NATIVA DO ANGULAR)
 * Uso: <input appCurrencyFormat formControlName="valor" type="text">
 * 
 * A diretiva:
 * - Aceita apenas números e separadores decimais (. ou ,) durante digitação
 * - Formata automaticamente com pt-BR no blur
 * - Armazena valor numérico no FormControl
 * - Limita a 2 casas decimais
 */
@Directive({
  selector: '[appCurrencyFormat]',
  standalone: true
})
export class CurrencyFormatDirective {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    const input = this.el.nativeElement as HTMLInputElement;
    const char = event.key;
    
    // Aceita: números (0-9), separador decimal (. ou ,)
    const isNumber = /[0-9]/.test(char);
    const isDecimal = /[.,]/.test(char);
    const isNavigationKey = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key);
    
    if (!isNumber && !isDecimal && !isNavigationKey) {
      event.preventDefault();
    }
  }

  @HostListener('input')
  onInput() {
    const input = this.el.nativeElement as HTMLInputElement;
    let value = input.value;

    // Remove caracteres inválidos, mantém apenas números, ponto e vírgula
    value = value.replace(/[^\d.,]/g, '');
    
    // Garante apenas 1 separador decimal
    let parts = value.split(/[.,]/);
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
      parts = value.split('.');
    }

    // Limita a 2 casas decimais
    if (parts.length === 2 && parts[1]) {
      parts[1] = parts[1].substring(0, 2);
      value = parts.join('.');
    }

    input.value = value;
  }

  @HostListener('blur')
  onBlur() {
    const input = this.el.nativeElement as HTMLInputElement;
    if (!input.value) {
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(null, { emitEvent: false });
      }
      return;
    }

    // Converte para número
    let numValue = parseFloat(input.value.replace(',', '.'));
    if (isNaN(numValue)) {
      numValue = 0;
    }

    // Formata no padrão pt-BR: 1.234,56
    const formatted = numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    input.value = formatted;

    // Atualiza o FormControl com o valor numérico
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(numValue, { emitEvent: false });
    }
  }
}
