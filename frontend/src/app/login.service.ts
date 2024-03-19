import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private serverUrl = 'http://localhost:8081';
  // private serverUrl = 'https://310f-2001-1388-ae0-7600-5dc6-1450-162b-9748.ngrok-free.app';

  constructor(private http: HttpClient) { }

  login(credentials: any): Observable<any> {
    //return this.http.post<any>('http://localhost:8081/login', credentials);
    return this.http.post<any>(`${this.serverUrl}/login`, credentials);
  }

  setServerUrl(url: string) {
    this.serverUrl = url; // Método para establecer la URL del servidor
  }

}