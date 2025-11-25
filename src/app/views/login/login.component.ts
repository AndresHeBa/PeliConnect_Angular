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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  constructor(private authSvc: AuthService) {}

  private router = inject(Router);

  ngOnInit() {
    if (localStorage.getItem('user')) {
      this.router.navigate(['/home']);
    }
  }

  login() {
    this.authSvc.login(this.user, this.pass).subscribe({
      next: (res) => {
        if (res) { // Ajusta según la respuesta de tu API
          console.log(res);
          localStorage.setItem('user', this.user);
          localStorage.setItem('admin', res.admin);
          localStorage.setItem('idUser', res.id);
          console.log('Login successful');
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
