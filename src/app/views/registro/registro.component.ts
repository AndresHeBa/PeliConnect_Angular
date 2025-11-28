import { Component, inject } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  user = '';
  email = '';
  pass = '';
  confirmPass: string = '';

  // Control de pasos
  currentStep: number = 1; // 1: formulario, 2: verificación
  verificationCode: string = '';

  // Variables para la fortaleza de la contraseña
  passwordStrength: string = 'weak';
  hasUpperCase: boolean = false;
  hasLowerCase: boolean = false;
  hasNumber: boolean = false;
  hasSpecialChar: boolean = false;

  // Estados
  isLoading: boolean = false;
  message: string = '';
  isError: boolean = false;

  // Timer para reenvío
  canResend: boolean = false;
  resendTimer: number = 0;
  private resendInterval: any;

  constructor(private authSvc: AuthService) {}

  private router = inject(Router);

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnInit() {
    if (localStorage.getItem('user')) {
      this.router.navigate(['/home']);
    }
  }

  ngOnDestroy() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  checkPasswordStrength() {
    if (!this.pass) {
      this.passwordStrength = 'weak';
      return;
    }

    // Verificar criterios
    this.hasUpperCase = /[A-Z]/.test(this.pass);
    this.hasLowerCase = /[a-z]/.test(this.pass);
    this.hasNumber = /\d/.test(this.pass);
    this.hasSpecialChar = /[@$!%*?&]/.test(this.pass);

    // Calcular fortaleza
    const criteriaMet = [
      this.hasUpperCase,
      this.hasLowerCase,
      this.hasNumber,
      this.hasSpecialChar,
      this.pass.length >= 8
    ].filter(Boolean).length;

    if (criteriaMet <= 2) {
      this.passwordStrength = 'weak';
    } else if (criteriaMet <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  getPasswordStrengthText(): string {
    switch (this.passwordStrength) {
      case 'weak': return 'Contraseña débil';
      case 'medium': return 'Contraseña media';
      case 'strong': return 'Contraseña fuerte';
      default: return '';
    }
  }

  isPasswordValid(): boolean {
    return this.hasUpperCase && 
           this.hasLowerCase && 
           this.hasNumber && 
           this.hasSpecialChar && 
           this.pass.length >= 8;
  }

  register() {
    // Validaciones
    if (!this.user || !this.pass || !this.confirmPass || !this.email) {
      this.showMessage('Por favor, complete todos los campos', true);
      return;
    }
    
    if (this.pass !== this.confirmPass) {
      this.showMessage('Las contraseñas no coinciden', true);
      return;
    }

    if (!this.isPasswordValid()) {
      this.showMessage('La contraseña no cumple con los requisitos de seguridad', true);
      return;
    }

    this.isLoading = true;

    // Registrar usuario
    this.authSvc.registerUser(this.user, this.pass).subscribe({
      next: (res) => {
        //console.log('Registro exitoso', res);
        // Después del registro exitoso, enviar código
        this.sendVerificationCode();
      },
      error: (err) => {
        this.isLoading = false;
        console.log('Error en registro', err);
        this.showMessage(
          err.error?.message || 'Error al registrar usuario', 
          true
        );
      }
    });
  }

  sendVerificationCode() {
    this.authSvc.sendVerificationCode(this.email, this.user).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.currentStep = 2;
        this.showMessage('Código enviado a tu email', false);
        this.startResendTimer();
      },
      error: (error) => {
        this.isLoading = false;
        console.log('Error al enviar código', error);
        this.showMessage(
          error.error?.error || 'Error al enviar el código de verificación',
          true
        );
      }
    });
  }

  verifyCode() {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.showMessage('Ingresa el código de 6 dígitos', true);
      return;
    }

    this.isLoading = true;
    
    this.authSvc.verifyCode(this.email, this.verificationCode, this.user).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.verified) {
          this.showMessage('¡Cuenta verificada exitosamente!', false);
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.log('Error al verificar código', error);
        this.showMessage(
          error.error?.error || 'Código incorrecto o expirado',
          true
        );
      }
    });
  }

  resendCode() {
    if (!this.canResend) return;
    
    this.verificationCode = '';
    this.isLoading = true;
    
    this.authSvc.sendVerificationCode(this.email, this.user).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showMessage('Nuevo código enviado', false);
        this.startResendTimer();
      },
      error: (error) => {
        this.isLoading = false;
        this.showMessage('Error al reenviar código', true);
      }
    });
  }

  startResendTimer() {
    this.canResend = false;
    this.resendTimer = 60;
    
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.canResend = true;
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  goBack() {
    this.currentStep = 1;
    this.verificationCode = '';
    this.message = '';
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  private showMessage(msg: string, isError: boolean) {
    this.message = msg;
    this.isError = isError;
    
    setTimeout(() => {
      if (!isError) {
        this.message = '';
      }
    }, 5000);
  }
}