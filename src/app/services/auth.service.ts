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

  login(username: string, password: string) {
    const body = {
      user: username,
      pass: password
    }
    return this.http.post<any>(`${_URL_SERVICES}login`, body, httpOptions);
  }

  readuser() {
    return this.http.get<{ users: usuario[] }>(`${_URL_SERVICES}get_users`);
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


}
