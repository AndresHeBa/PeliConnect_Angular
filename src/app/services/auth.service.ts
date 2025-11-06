import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

export const _IP = 'localhost';
export const _URL_SERVICES = "http://" + _IP + ":3000/";


const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  }),
  body: {}
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http:HttpClient) { }

  registerUser(username: string, password: string) {
    const body = {
      user: username,
      pass: password
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

  logout() {
    localStorage.removeItem('user');
  }

  
}
