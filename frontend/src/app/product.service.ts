import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private serverUrl = 'http://localhost:8081';
  // private serverUrl = 'https://310f-2001-1388-ae0-7600-5dc6-1450-162b-9748.ngrok-free.app';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.serverUrl}/productos`);
  }

  getListProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.serverUrl}/detail_product`);
  }

  saveProduct(productData: FormData): Observable<any> {
    // Realizar una solicitud HTTP POST al servidor para guardar el producto
    return this.http.post<any>(`${this.serverUrl}/save_product`, productData);
  }

  deleteProduct(productId: number): Observable<any> {
    // Realizar una solicitud HTTP DELETE al servidor para eliminar el producto
    return this.http.delete<any>(`${this.serverUrl}/producto/${productId}`);
  }

  getProductById(productId: number): Observable<any> {
    return this.http.get<any>(`${this.serverUrl}/producto/${productId}`);
  }

  updateProduct(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.serverUrl}/update_product`, formData);
  }

  exportarExcel(): Observable<any> {
    return this.http.get(`${this.serverUrl}/download_excel`, { responseType: 'arraybuffer' });
  }

  downloadTechnicalSheet(id: number): Observable<Blob> {
    return this.http.get(`${this.serverUrl}/ficha_tecnica/${id}`, { responseType: 'blob' });
  }

  updateProductPrice(idProducto: number, precioVenta: number, correo: string) {
    const body = {
      idProducto: idProducto,
      PrecioVenta: precioVenta,
      toPerson: correo
    };

    return this.http.post<any>(`${this.serverUrl}/quote_product`, body);
  }

  uploadProductsExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.serverUrl}/upload_products_excel`, formData);
  }

  setServerUrl(url: string) {
    this.serverUrl = url; // Método para establecer la URL del servidor
  }

}
