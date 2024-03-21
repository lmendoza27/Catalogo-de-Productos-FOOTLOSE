import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private serverUrl = 'https://catalogo-de-productos-footlose.onrender.com';
  // private serverUrl = 'http://localhost:8081';

  constructor() { }

  getServerUrl(): string {
    return this.serverUrl;
  }

  setServerUrl(url: string): void {
    this.serverUrl = url;
  }

}