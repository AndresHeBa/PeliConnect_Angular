import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PasswordRecoveryService } from '../../services/password-recovery.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-recovery',
  imports: [CommonModule, FormsModule],
  templateUrl: './password-recovery.component.html',
  styleUrl: './password-recovery.component.css'
})
export class PasswordRecoveryComponent {
  // Datos del formulario
  Correo: string = '';
  code: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // Control de pasos
  currentStep: number = 1; // 1: Correo, 2: código, 3: nueva contraseña

  // Estado de la UI
  message: string = '';
  isError: boolean = false;
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Datos temporales
  resetToken: string = '';
  attemptsLeft: number = 5;

  // Timer para reenvío
  canResend: boolean = true;
  resendTimer: number = 0;

  constructor(
    private passwordRecoveryService: PasswordRecoveryService,
    private router: Router
  ) { }

  // PASO 1: Solicitar código
  requestReset() {
    if (!this.validateCorreo(this.Correo)) {
      this.showMessage('Por favor ingresa un Correo válido', true);
      return;
    }

    this.isLoading = true;
    this.passwordRecoveryService.requestPasswordReset(this.Correo).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.currentStep = 2;
        this.showMessage('Código enviado a tu Correo', false);
        this.startResendTimer();
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage(error.error.error || 'Error al enviar el código', true);
      }
    });
  }

  // PASO 2: Verificar código
  verifyCode() {
    if (!this.code || this.code.length !== 6) {
      this.showMessage('Ingresa el código de 6 dígitos', true);
      return;
    }

    this.isLoading = true;
    this.passwordRecoveryService.verifyRecoveryCode(this.Correo, this.code).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.resetToken = response.resetToken;
        this.currentStep = 3;
        this.showMessage('Código verificado. Ingresa tu nueva contraseña', false);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error.attemptsLeft !== undefined) {
          this.attemptsLeft = error.error.attemptsLeft;
          this.showMessage(
            `${error.error.error}. Intentos restantes: ${this.attemptsLeft}`,
            true
          );
        } else {
          this.showMessage(error.error.error || 'Código incorrecto', true);
        }
      }
    });
  }

  // PASO 3: Establecer nueva contraseña
  resetPassword() {
    // Validaciones
    if (!this.newPassword || this.newPassword.length < 8) {
      this.showMessage('La contraseña debe tener al menos 8 caracteres', true);
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showMessage('Las contraseñas no coinciden', true);
      return;
    }

    if (!this.isPasswordStrong(this.newPassword)) {
      this.showMessage(
        'La contraseña debe contener mayúsculas, minúsculas y números',
        true
      );
      return;
    }

    this.isLoading = true;
    this.passwordRecoveryService.resetPassword(
      this.Correo,
      this.resetToken,
      this.newPassword
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showMessage('¡Contraseña restablecida exitosamente!', false);
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage(error.error.error || 'Error al restablecer contraseña', true);
      }
    });
  }

  // Reenviar código
  resendCode() {
    if (!this.canResend) return;

    this.isLoading = true;
    this.passwordRecoveryService.resendCode(this.Correo).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.code = '';
        this.attemptsLeft = 5;
        this.showMessage('Nuevo código enviado', false);
        this.startResendTimer();
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage('Error al reenviar código', true);
      }
    });
  }

  // Timer para evitar spam de reenvíos
  startResendTimer() {
    this.canResend = false;
    this.resendTimer = 60;

    const interval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.canResend = true;
        clearInterval(interval);
      }
    }, 1000);
  }

  // Volver al paso anterior
  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.message = '';
    }
  }

  // Validaciones
  validateCorreo(Correo: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(Correo);
  }

  isPasswordStrong(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers;
  }

  getPasswordStrength(): string {
    if (!this.newPassword) return '';
    const length = this.newPassword.length;
    const hasUpper = /[A-Z]/.test(this.newPassword);
    const hasLower = /[a-z]/.test(this.newPassword);
    const hasNumber = /\d/.test(this.newPassword);
    const hasSpecial = /[!@#$%^&*]/.test(this.newPassword);

    let strength = 0;
    if (length >= 8) strength++;
    if (length >= 12) strength++;
    if (hasUpper && hasLower) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;

    if (strength <= 2) return 'débil';
    if (strength <= 3) return 'media';
    return 'fuerte';
  }

  // Toggle visibilidad de contraseñas
  togglePasswordVisibility(field: string) {
    if (field === 'new') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Mensajes
  private showMessage(msg: string, isError: boolean) {
    this.message = msg;
    this.isError = isError;
    setTimeout(() => {
      if (!isError) {
        this.message = '';
      }
    }, 5000);
  }

  // Getters para validación de requisitos de contraseña
  get hasUpperCase(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }

  get hasLowerCase(): boolean {
    return /[a-z]/.test(this.newPassword);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.newPassword);
  }

  // Este es el método que faltaba y que se llama desde el HTML
  checkPasswordRequirements() {
    // Los getters se actualizan automáticamente cuando cambia newPassword
    // Este método puede estar vacío o usarse para lógica adicional
  }

  // Validar si la contraseña cumple todos los requisitos
  isPasswordValid(): boolean {
    return this.newPassword.length >= 8 && 
           this.hasUpperCase && 
           this.hasLowerCase && 
           this.hasNumber && 
           this.newPassword === this.confirmPassword;
  }
}