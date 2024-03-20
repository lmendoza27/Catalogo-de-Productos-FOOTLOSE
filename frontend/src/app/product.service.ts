import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient, private configService: ConfigService) { }

  getProducts(): Observable<any[]> {
    const serverUrl = this.configService.getServerUrl();
    return this.http.get<any[]>(`${serverUrl}/productos`);
  }

  getListProducts(): Observable<any[]> {
    const serverUrl = this.configService.getServerUrl();
    return this.http.get<any[]>(`${serverUrl}/detail_product`);
  }

  saveProduct(productData: FormData): Observable<any> {
    // Realizar una solicitud HTTP POST al servidor para guardar el producto
    const serverUrl = this.configService.getServerUrl();
    return this.http.post<any>(`${serverUrl}/save_product`, productData);
  }

  deleteProduct(productId: number): Observable<any> {
    // Realizar una solicitud HTTP DELETE al servidor para eliminar el producto
    const serverUrl = this.configService.getServerUrl();
    return this.http.delete<any>(`${serverUrl}/producto/${productId}`);
  }

  getProductById(productId: number): Observable<any> {
    const serverUrl = this.configService.getServerUrl();
    return this.http.get<any>(`${serverUrl}/producto/${productId}`);
  }

  updateProduct(formData: FormData): Observable<any> {
    const serverUrl = this.configService.getServerUrl();
    return this.http.post<any>(`${serverUrl}/update_product`, formData);
  }

  exportarExcel(): Observable<any> {
    const serverUrl = this.configService.getServerUrl();
    return this.http.get(`${serverUrl}/download_excel`, { responseType: 'arraybuffer' });
  }

  downloadTechnicalSheet(id: number): Observable<Blob> {
    const serverUrl = this.configService.getServerUrl();
    return this.http.get(`${serverUrl}/ficha_tecnica/${id}`, { responseType: 'blob' });
  }

  updateProductPrice(idProducto: number, precioVenta: number, correo: string) {
    const body = {
      idProducto: idProducto,
      PrecioVenta: precioVenta,
      toPerson: correo
    };

    const serverUrl = this.configService.getServerUrl();
    return this.http.post<any>(`${serverUrl}/quote_product`, body);
  }

  uploadProductsExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const serverUrl = this.configService.getServerUrl();
    return this.http.post<any>(`${serverUrl}/upload_products_excel`, formData);
  }

}
