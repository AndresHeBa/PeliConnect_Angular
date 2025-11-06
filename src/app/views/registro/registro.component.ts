import { Component, inject } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  user = '';
  pass = '';

  constructor(private authSvc: AuthService) {}

  private router = inject(Router);

  ngOnInit() {
    if (localStorage.getItem('user')) {
      this.router.navigate(['/home']);
    }
  }

  register() {
    this.authSvc.registerUser(this.user, this.pass).subscribe({
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
