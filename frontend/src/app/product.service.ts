import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) { }

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8081/productos');
  }

  getListProducts(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8081/detail_product');
  }

  saveProduct(productData: FormData): Observable<any> {
    // Realizar una solicitud HTTP POST al servidor para guardar el producto
    return this.http.post<any>('http://localhost:8081/save_product', productData);
  }

  deleteProduct(productId: number): Observable<any> {
    // Realizar una solicitud HTTP DELETE al servidor para eliminar el producto
    return this.http.delete<any>(`http://localhost:8081/producto/${productId}`);
  }

  getProductById(productId: number): Observable<any> {
    return this.http.get<any>(`http://localhost:8081/producto/${productId}`);
  }

  updateProduct(formData: FormData): Observable<any> {
    return this.http.post<any>('http://localhost:8081/update_product', formData);
  }

  exportarExcel(): Observable<any> {
    return this.http.get('http://localhost:8081/download_excel', { responseType: 'arraybuffer' });
  }

  downloadTechnicalSheet(id: number): Observable<Blob> {
    return this.http.get(`http://localhost:8081/ficha_tecnica/${id}`, { responseType: 'blob' });
  }

  updateProductPrice(idProducto: number, precioVenta: number, correo: string) {
    const body = {
      idProducto: idProducto,
      PrecioVenta: precioVenta,
      toPerson: correo
    };

    return this.http.post<any>('http://localhost:8081/quote_product', body);
  }

  uploadProductsExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>('http://localhost:8081/upload_products_excel', formData);
  }

}
