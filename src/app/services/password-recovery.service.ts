import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PasswordRecoveryService {

  private apiUrl = 'http://peliconnect.ddns.net:3000';

  constructor(private http: HttpClient) {}

  requestPasswordReset(Correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { Correo });
  }

  verifyRecoveryCode(Correo: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-recovery-code`, { Correo, code });
  }

  resetPassword(Correo: string, resetToken: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { 
      Correo, 
      resetToken, 
      newPassword 
    });
  }

  resendCode(Correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-recovery-code`, { Correo });
  }
}
