// login.component.ts
import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  user: string = '';
  pass: string = '';
  showPassword: boolean = false;

  require2fa: boolean = false;
  twoFaCode: string = '';
  twoFaError: string = '';

  private router = inject(Router);

  constructor(private authSvc: AuthService) { }

  ngOnInit() {
    if (localStorage.getItem('user')) {
      this.router.navigate(['/home']);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.twoFaError = '';

    if (this.require2fa) {
      // Si ya estamos en modo 2FA, verificar el código
      this.verify2FA();
      return;
    }

    // Login inicial
    this.authSvc.login(this.user, this.pass).subscribe({
      next: (res: any) => {
        console.log(res);

        if (res.two_fa) {
          // Backend pide 2FA
          this.require2fa = true;
          return;
        }

        if (res.success) {
          this.handleSuccessfulLogin(res);
        } else {
          this.twoFaError = res.error || 'Credenciales incorrectas';
        }
      },
      error: (err) => {
        this.twoFaError = err?.error?.error || 'Error al iniciar sesión';
        console.error(err);
      }
    });
  }

  getDeviceInfo() {
    const userAgent = navigator.userAgent;

    let browser = 'Desconocido';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let os = 'Desconocido';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone')) os = 'iOS';

    const isMobile = /Mobi|Android/i.test(userAgent);

    return {
      browser,
      os,
      isMobile
    };
  }


  getLocation() {
    return fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        return `${data.city}, ${data.country_name}`;
      })
      .catch(() => 'Ubicación no disponible');
  }


  async verify2FA() {
    if (!this.twoFaCode || this.twoFaCode.length !== 6) {
      this.twoFaError = 'Ingresa un código de 6 dígitos';
      return;
    }

    const device = this.getDeviceInfo();
    const deviceInfo = `${device.browser} - ${device.os} - ${device.isMobile ? 'Móvil' : 'Escritorio'}`;

    const location = await this.getLocation();

    const loginDate = new Date().toLocaleDateString();
    const loginTime = new Date().toLocaleTimeString();

    this.authSvc.verify2FA(this.user, this.pass, this.twoFaCode, loginDate,
      loginTime,
      deviceInfo,
      location).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.handleSuccessfulLogin(res);
          } else {
            this.twoFaError = res.error || 'Código 2FA incorrecto';
          }
        },
        error: (err) => {
          this.twoFaError = err?.error?.error || 'Error al verificar 2FA';
          console.error(err);
        }
      });
  }

  private handleSuccessfulLogin(res: any) {
    localStorage.setItem('user', this.user);
    localStorage.setItem('admin', res.admin);
    localStorage.setItem('idUser', res.id);
    //localStorage.setItem('token', res.token);

    // ✅ Guardar device token si viene en la respuesta
    if (res.deviceToken) {
      localStorage.setItem('deviceToken', res.deviceToken);
    }

    console.log('Login successful');
    window.location.reload();
  }
}