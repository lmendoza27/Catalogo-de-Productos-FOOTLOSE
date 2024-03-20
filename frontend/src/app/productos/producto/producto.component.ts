import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../product.service';
import { ConfigService } from '../../config.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.component.html',
  styleUrls: ['./producto.component.css']
})

export class ProductoComponent implements OnInit {

  productos: any[] = [];
  permissions: string[] = [];
  searchTerm: string = '';

  listProducts: any;
  selectedMarcas: { [key: string]: boolean } = {};
  selectedModelos: { [key: string]: boolean } = {};
  selectedColores: { [key: string]: boolean } = {};
  selectedTallas: { [key: string]: boolean } = {};

  fileToUpload: File | null = null;

  constructor(private productService: ProductService, private router: Router, public configService: ConfigService) {
    const permissionsString = localStorage.getItem('permissions');
    if (permissionsString) {
      this.permissions = JSON.parse(permissionsString);
    }
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      // Si no hay token en el localStorage, redirigir al usuario a la página de login
      this.router.navigate(['/login']);
    } else {

      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1])); // Decodificar el payload del token
        const currentTime = Math.floor(Date.now() / 1000); // Convertir a segundos
        // console.log('El tiempo es: ' + tokenPayload.exp)
        // console.log('El tiempo actual es:' + currentTime)
        if (tokenPayload.exp < currentTime) {

          localStorage.removeItem('token');
          this.router.navigate(['/login']);

        } else {

          this.loadProducts();
          this.productService.getListProducts().subscribe((data: any) => {
            this.listProducts = data;
  
            this.listProducts.marcas.forEach((marca: any) => {
              this.selectedMarcas[marca.NombreMarca] = true;
            });
  
            this.listProducts.modelos.forEach((modelo: any) => {
              this.selectedModelos[modelo.NombreModelo] = true;
            });
  
            this.listProducts.colores.forEach((color: any) => {
              this.selectedColores[color.NombreColor] = true;
            });
        
            this.listProducts.tallas.forEach((talla: any) => {
              this.selectedTallas[talla.NombreTalla] = true;
            });
  
          });

        }

      } catch (error) {
        console.error('Error al decodificar el token:', error);
        // Manejar el error como desees
      }

    }
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(data => {
      this.productos = data;
    });
  }

  addProduct(): void {
    this.productService.getListProducts().subscribe((data: any) => {
      console.log(data)
      if (data && Object.keys(data).length > 0) {
      const selectHtml = `
          <div>
          <label for="nombre">Nombre Producto:</label>
          <input type="text" id="product_name" class="swal2-input" placeholder="nombre">
        </div>
        <div>
          <label for="marca">Marca:</label><br>
          <select id="marca" class="swal2-select">
            ${data.marcas.map((marca: any) => `<option class="swal2-select" value="${marca.idMarca}">${marca.NombreMarca}</option>`).join('')}
          </select>
        </div>
        <div>
          <label for="modelo">Modelo:</label><br>
          <select id="modelo" class="swal2-select">
            ${data.modelos.map((modelo: any) => `<option value="${modelo.idModelo}">${modelo.NombreModelo}</option>`).join('')}
          </select>
        </div>
        <div>
          <label for="color">Color:</label><br>
          <select id="color" class="swal2-select">
            ${data.colores.map((color: any) => `<option value="${color.idColor}">${color.NombreColor}</option>`).join('')}
          </select>
        </div>
        <div>
          <label for="talla">Talla:</label><br>
          <select id="talla" class="swal2-select">
            ${data.tallas.map((talla: any) => `<option value="${talla.idTalla}">${talla.NombreTalla}</option>`).join('')}
          </select>
        </div>
        <div>
        <label for="nombre">Imagen Producto:</label>
        <input type="file" id="product_image" class="swal2-input" placeholder="nombre">
        </div>
      <div>
      <label for="nombre">Precio: (No obligatorio)</label>
      <input type="number" id="product_price" class="swal2-input" placeholder="cantidad">
    </div>
      `;
  
        Swal.fire({
          title: 'Registrando productos',
          html: selectHtml,
          showCancelButton: true,
          confirmButtonText: 'Guardar',
          cancelButtonText: 'Cancelar',
          preConfirm: () => {
            // Get selected values here
            const imageInput = document.getElementById('product_image') as HTMLInputElement | null;
            const image = imageInput && imageInput.files ? imageInput.files[0] : null;
            // Obtener los otros valores del producto
            const nombreProducto = (document.getElementById('product_name') as HTMLInputElement).value;
            const marcaSeleccionada = (document.getElementById('marca') as HTMLSelectElement).value;
            const modeloSeleccionado = (document.getElementById('modelo') as HTMLSelectElement).value;
            const colorSeleccionado = (document.getElementById('color') as HTMLSelectElement).value;
            const tallaSeleccionada = (document.getElementById('talla') as HTMLSelectElement).value;
            const precio = parseFloat((document.getElementById('product_price') as HTMLInputElement).value);
  
            // Llamar a insertProduct con todos los datos del producto incluyendo la imagen
            this.insertProduct(nombreProducto, marcaSeleccionada, modeloSeleccionado, colorSeleccionado, tallaSeleccionada, image, precio);
          }
        });
      } else {
        console.error('No se encontraron datos para los selectores.');
      }
    });
  }

  insertProduct(nombreProducto: string, marcaSeleccionada: string, modeloSeleccionado: string, colorSeleccionado: string, tallaSeleccionada: string, imagen: File | null, precio: number): void {
    // Aquí puedes enviar los datos del producto y la imagen al servicio para ser guardados en el servidor
    // Por ejemplo, podrías utilizar FormData para enviar la imagen junto con otros datos
    const formData = new FormData();
    formData.append('NombreProducto', nombreProducto);
    formData.append('idMarca', marcaSeleccionada);
    formData.append('idModelo', modeloSeleccionado);
    formData.append('idColor', colorSeleccionado);
    formData.append('idTalla', tallaSeleccionada);
    if (imagen) {
      formData.append('imagen', imagen);
    } else {
      // Manejar el caso de imagen nula si es necesario
    }
    formData.append('PrecioVenta', precio.toString());
  
    // Ahora puedes llamar al método en tu servicio que se encargará de enviar estos datos al servidor
    this.productService.saveProduct(formData).subscribe(
      response => {
        console.log('Respuesta del servidor:', response);
        Swal.fire('Producto agregado correctamente');
        this.loadProducts();
      },
      error => {
        console.error('Error al insertar el producto:', error);
        Swal.fire('Error', 'Hubo un problema al agregar el producto', 'error');
      }
    );
  }

  editProduct(productId: any): void {
    console.log(productId)
    // Obtener los datos del producto por su ID
    this.productService.getProductById(productId).subscribe((data: any) => {
      if (data) {
        console.log(data)
        // Llamar a getListProducts para obtener los datos necesarios
        this.productService.getListProducts().subscribe((listData: any) => {
          if (listData && Object.keys(listData).length > 0) {
            // Generar el formulario con los datos del producto y las opciones de los selectores
            const selectHtml = `
              <div>
                <label for="nombre">Nombre Producto:</label>
                <input type="text" id="product_name" class="swal2-input" value="${data.NombreProducto}">
              </div>
              <div>
                <label for="marca">Marca:</label><br>
                <select id="marca" class="swal2-select">
                  ${this.generateOptions(listData.marcas, data.idMarca, 'idMarca', 'NombreMarca')}
                </select>
              </div>
              <div>
                <label for="modelo">Modelo:</label><br>
                <select id="modelo" class="swal2-select">
                  ${this.generateOptions(listData.modelos, data.idModelo, 'idModelo', 'NombreModelo')}
                </select>
              </div>
              <div>
                <label for="color">Color:</label><br>
                <select id="color" class="swal2-select">
                  ${this.generateOptions(listData.colores, data.idColor, 'idColor', 'NombreColor')}
                </select>
              </div>
              <div>
                <label for="talla">Talla:</label><br>
                <select id="talla" class="swal2-select">
                  ${this.generateOptions(listData.tallas, data.idTalla, 'idTalla', 'NombreTalla')}
                </select>
              </div>
              <div>
                <img src="${ this.configService.getServerUrl() }/uploads/${ data.Imagen }" alt="Imagen del producto" width="100">
                <br><label for="nombre">Imagen Producto:</label>
                <input type="file" id="product_image" class="swal2-input">
              </div>
              <div>
                <label for="nombre">Precio: (No obligatorio)</label>
                <input type="number" id="product_price" class="swal2-input" value="${data.PrecioVenta}">
              </div>
            `;
  
            // Mostrar el formulario modal
            Swal.fire({
              title: 'Editar Producto',
              html: selectHtml,
              showCancelButton: true,
              confirmButtonText: 'Guardar',
              cancelButtonText: 'Cancelar',
              preConfirm: () => {
                // Lógica para manejar la confirmación del formulario
                const imageInput = document.getElementById('product_image') as HTMLInputElement | null;
                const image = imageInput && imageInput.files ? imageInput.files[0] : null;
                const nombreProducto = (document.getElementById('product_name') as HTMLInputElement).value;
                const marcaSeleccionada = (document.getElementById('marca') as HTMLSelectElement).value;
                const modeloSeleccionado = (document.getElementById('modelo') as HTMLSelectElement).value;
                const colorSeleccionado = (document.getElementById('color') as HTMLSelectElement).value;
                const tallaSeleccionada = (document.getElementById('talla') as HTMLSelectElement).value;
                const precio = parseFloat((document.getElementById('product_price') as HTMLInputElement).value);

                this.updateProduct(productId, nombreProducto, marcaSeleccionada, modeloSeleccionado, colorSeleccionado, tallaSeleccionada, precio, image);
              }
            });
          } else {
            console.error('No se encontraron datos para los selectores.');
          }
        });
      } else {
        console.error('No se encontraron datos para el producto.');
      }
    });
  }

  updateProduct(productId: any, nombreProducto: string, idMarca: string, idModelo: string, idColor: string, idTalla: string, precio: number, imagen: File | null): void {
    const formData = new FormData();
    formData.append('idProducto', productId);
    formData.append('NombreProducto', nombreProducto);
    formData.append('idMarca', idMarca);
    formData.append('idModelo', idModelo);
    formData.append('idColor', idColor);
    formData.append('idTalla', idTalla);
    formData.append('PrecioVenta', precio.toString());
    if (imagen) {
      formData.append('imagen', imagen);
    }

    this.productService.updateProduct(formData).subscribe(
      response => {
        console.log('Respuesta del servidor:', response);
        Swal.fire('Producto actualizado correctamente');
        this.loadProducts();
      },
      error => {
        console.error('Error al actualizar el producto:', error);
        Swal.fire('Error', 'Hubo un problema al actualizar el producto', 'error');
      }
    );
  }

  private generateOptions(data: any[], selectedId: any, valueKey: string, textKey: string): string {
    return data.map((item: any) => `<option value="${item[valueKey]}" ${item[valueKey] === selectedId ? 'selected' : ''}>${item[textKey]}</option>`).join('');
  }

  deleteProduct(productId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(productId).subscribe(
          response => {
            console.log('Producto eliminado correctamente');
            // Actualizar la lista de productos u otra lógica después de eliminar el producto
            this.loadProducts();
          },
          error => {
            console.error('Error al eliminar el producto:', error);
            // Manejar errores
          }
        );
      }
    });
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  logout() {
    // Redireccionar a la ruta /login
    this.router.navigate(['/login']);
    // Limpiar el localStorage
    localStorage.removeItem('permissions');
    localStorage.removeItem('token');
  }

  get filteredProducts(): any[] {

    let filteredProductos = this.productos;

    /*if (!this.searchTerm.trim()) {
      return this.productos;
    } else {
      return this.productos.filter(producto =>
        Object.values(producto).some(value =>
          String(value).toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }*/

    if (this.searchTerm.trim()) {
      filteredProductos = filteredProductos.filter(producto =>
        Object.values(producto).some(value =>
          String(value).toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }


    // Filtrar por marcas seleccionadas
    filteredProductos = filteredProductos.filter(producto =>
      Object.keys(this.selectedMarcas).some(marcaId => 
        this.selectedMarcas[marcaId] && producto.NombreMarca === marcaId
      )
    );

    filteredProductos = filteredProductos.filter(producto =>
      Object.keys(this.selectedColores).some(colorId => 
        this.selectedColores[colorId] && producto.NombreColor === colorId
      )
    );

    filteredProductos = filteredProductos.filter(producto =>
      Object.keys(this.selectedModelos).some(modeloId => 
        this.selectedModelos[modeloId] && producto.NombreModelo === modeloId
      )
    );

    filteredProductos = filteredProductos.filter(producto =>
      Object.keys(this.selectedTallas).some(tallaId => 
        this.selectedTallas[tallaId] && producto.NombreTalla === tallaId
      )
    );

    return filteredProductos;

  }

  descargarExcel(): void {
    this.productService.exportarExcel().subscribe(
      (data: ArrayBuffer) => {
        // Crear un Blob con los datos recibidos
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
        // Crear una URL con el Blob
        const url = window.URL.createObjectURL(blob);
  
        // Nombre del archivo deseado
        const filename = 'productos.xlsx';
  
        // Abrir una nueva pestaña del navegador con la URL del archivo y el nombre del archivo
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        // Liberar la URL creada después de un cierto tiempo
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
      },
      (error) => {
        // Manejar el error si ocurre
        console.error('Error al descargar el archivo Excel:', error);
      }
    );
  }

  descargarFichaTecnica(idProducto: number): void {
    this.productService.downloadTechnicalSheet(idProducto).subscribe(
      (data: Blob) => {
        const url = window.URL.createObjectURL(data);
        // Abrir una nueva pestaña del navegador con el PDF
        window.open(url);
        // Liberar la URL creada después de un cierto tiempo
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
      },
      (error) => {
        console.error('Error al descargar la ficha técnica:', error);
      }
    );
  }

  editProduct2(productId: any): void {
    console.log(productId)
    // Obtener los datos del producto por su ID
    this.productService.getProductById(productId).subscribe((data: any) => {
      if (data) {
        console.log(data)
        // Llamar a getListProducts para obtener los datos necesarios
        this.productService.getListProducts().subscribe((listData: any) => {
          if (listData && Object.keys(listData).length > 0) {
            // Generar el formulario con los datos del producto y las opciones de los selectores
            const selectHtml = `
              <div>
                <label for="nombre">Precio:</label><br>
                <input type="number" id="product_price_2" class="swal2-input" value="${data.PrecioVenta}">
              </div>
              <div>
              <label for="email">Correo Electrónico:</label>
              <input type="email" id="to_email" class="swal2-input" value="mendozachateluis@gmail.com">
            </div>
            `;
  
            // Mostrar el formulario modal
            Swal.fire({
              title: 'Cotizar Producto',
              html: selectHtml,
              showCancelButton: true,
              confirmButtonText: 'Guardar',
              cancelButtonText: 'Cancelar',
              preConfirm: () => {
                const precio = parseFloat((document.getElementById('product_price_2') as HTMLInputElement).value);
                const correo = (document.getElementById('to_email') as HTMLInputElement).value;
                this.quoteProduct(productId, precio, correo);
              }
            });
          } else {
            console.error('No se encontraron datos para los selectores.');
          }
        });
      } else {
        console.error('No se encontraron datos para el producto.');
      }
    });
  }
  
  quoteProduct(id: number, price: number, email: string) {
    this.productService.updateProductPrice(id, price, email).subscribe(
      (response) => {
        // console.log('Precio del producto actualizado exitosamente:', response);
        Swal.fire('Producto cotizado y notificado correctamente');
        this.loadProducts();
        // Aquí puedes agregar lógica adicional si lo deseas
      },
      (error) => {
        console.error('Error al actualizar el precio del producto:', error);
      }
    );
  }

  handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      this.fileToUpload = target.files.item(0);
    }
  }

  uploadFileToServer() {
    if (!this.fileToUpload) {
      // console.error('No se ha seleccionado ningún archivo.');
      Swal.fire('Escoge un archivo .xlsx por favor');
      return;
    }

    this.productService.uploadProductsExcel(this.fileToUpload).subscribe(
      response => {
        // console.log('Archivo cargado exitosamente:', response);
        Swal.fire('Registros subidos correctamente');
        this.loadProducts();
        // Aquí puedes manejar la respuesta del servidor, si es necesario
      },
      error => {
        console.error('Error al cargar el archivo:', error);
      }
    );
  }

  fallbackImage(event: any) {
    const serverUrl = this.configService.getServerUrl();
    event.target.src = `${serverUrl}/uploads/no-image.jpg`;
  }

  setServerUrl(url: string) {
    this.configService.setServerUrl(url); // Método para establecer la URL del servidor
  }

}
