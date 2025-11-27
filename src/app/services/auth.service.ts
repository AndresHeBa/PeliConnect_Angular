import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export const _IP = 'peliconnect.ddns.net';
export const _URL_SERVICES = "http://" + _IP + ":3000/";


const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  }),
  body: {}
};


export interface usuario {
  id: string;
  nombre: string;
  Correo: string;
  activo: string;
}

export interface usuarioinf {
  id: string;
  nombre: string;
  Correo: string;
  two_fa: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  sendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${_URL_SERVICES}send-verification`, { email });
  }

  verifyCode(email: string, code: string): Observable<any> {
    return this.http.post(`${_URL_SERVICES}verify-code`, { email, code });
  }

  registerUser(username: string, password: string, email: string) {
    const body = {
      user: username,
      pass: password,
      email: email
    }
    return this.http.post<any>(`${_URL_SERVICES}registrarUsuario`, body, httpOptions);
  }



  // auth.service.ts
  login(user: string, pass: string, token2fa?: string) {
    const deviceToken = localStorage.getItem('deviceToken'); // Recuperar token del dispositivo

    const body = {
      user: user,
      pass: pass,
      token2fa: token2fa,
      deviceToken: deviceToken
    };

    return this.http.post<any>(`${_URL_SERVICES}login`, body, httpOptions);
  }

  verify2FA(user: string, pass: string, token2fa: string) {
    const body = {
      user: user,
      pass: pass,
      token2fa: token2fa
    };

    return this.http.post<any>(`${_URL_SERVICES}verify-2fa`, body, httpOptions);
  }

  getUserReviews(id: string): Observable<any[]> {
    const body = {
      id: id
    }
    return this.http.post<any[]>(`${_URL_SERVICES}userReviews`, body, httpOptions);
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${_URL_SERVICES}review/${reviewId}`);
  }

  readuser() {
    return this.http.get<{ users: usuario[] }>(`${_URL_SERVICES}get_users`);
  }

  readuserid(id: string) {
    const body = { id: id };
    return this.http.post<{ user: usuarioinf }>(`${_URL_SERVICES}get_user`, body, httpOptions);
  }

  banuser(id: string) {
    const body = {
      id: id
    }
    return this.http.post<any>(`${_URL_SERVICES}ban_user`, body, httpOptions);
  }

  actuser(id: string) {
    const body = {
      id: id
    }
    return this.http.post<any>(`${_URL_SERVICES}activate_user`, body, httpOptions);
  }

  logout() {
    localStorage.removeItem('user');
  }


  // En tu auth.service.ts, agrega estos métodos:

  // Actualizar usuario
  updateUser(userId: string, userData: usuarioinf) {
    return this.http.put(`${_URL_SERVICES}update/${userId}`, userData);
  }

  // Generar 2FA
  generate2FA(userId: string) {
    return this.http.post(`${_URL_SERVICES}2fa/generate`, { userId });
  }

  // Verificar 2FA
  verify2FAs(userId: string, token: string) {
    return this.http.post(`${_URL_SERVICES}2fa/verify`, { userId, token });
  }


  // Desactivar 2FA
  disable2FA(userId: string, token: string) {
    return this.http.post(`${_URL_SERVICES}2fa/disable`, { userId, token });
  }


  // Cambiar contraseña
  changePassword(userId: string, currentPassword: string, newPassword: string) {
    return this.http.post(`${_URL_SERVICES}user/change-password`, {
      userId,
      currentPassword,
      newPassword
    });
  }

}
