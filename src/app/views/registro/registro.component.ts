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

  // Variables para la fortaleza de la contraseña
  passwordStrength: string = 'weak';
  hasUpperCase: boolean = false;
  hasLowerCase: boolean = false;
  hasNumber: boolean = false;
  hasSpecialChar: boolean = false;

  constructor(private authSvc: AuthService) {}

  private router = inject(Router);

  ngOnInit() {
    if (localStorage.getItem('user')) {
      this.router.navigate(['/home']);
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

  register() {
    if (!this.user || !this.pass || !this.confirmPass || !this.email) {
      alert('Por favor, complete todos los campos');
      return;
    }
    else if (this.pass !== this.confirmPass) {
      alert('Las contraseñas no coinciden o hay campos vacíos');
      return;
    } else {  
      this.authSvc.registerUser(this.user, this.pass, this.email).subscribe({
      next: (res) => {
        if (res) { // Ajusta según la respuesta de tu API
          console.log('Register successful');
          window.location.reload();
        } else {
          console.log('Login failed');
        }
        console.log(res);
        
      },
      error: (err) => {
        console.log('Login failed', err);
      }
    });
    }
  }

}
