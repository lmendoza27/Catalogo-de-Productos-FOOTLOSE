import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient, private configService: ConfigService) { }

  login(credentials: any): Observable<any> {
    const serverUrl = this.configService.getServerUrl();
    return this.http.post<any>(`${serverUrl}/login`, credentials);
  }

}