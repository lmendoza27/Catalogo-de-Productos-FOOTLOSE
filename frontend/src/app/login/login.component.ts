import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  userData = { user: '', password: '' };
  error = false;

  constructor(private loginService: LoginService, private router: Router) { }

  /*
  ngOnInit(): void {
    // Verificar si existe el token en el localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Si existe, redirigir al usuario a la ruta /productos
      this.router.navigate(['/productos']);
    }
  }
  */

  ngOnInit(): void {
    // Verificar si existe el token en el localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Si existe, verificar si ha expirado
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1])); // Decodificar el payload del token
        const currentTime = Math.floor(Date.now() / 1000); // Convertir a segundos
        // console.log('El tiempo es: ' + tokenPayload.exp)
        // console.log('El tiempo actual es:' + currentTime)
        if (tokenPayload.exp < currentTime) {
          // Si el token ha expirado, eliminarlo y redirigir al usuario al inicio de sesión
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        } else {
          // Si el token aún es válido, redirigir al usuario a la ruta /productos
          this.router.navigate(['/productos']);
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        // Manejar el error como desees
      }
    }
  }

  onSubmit(): void {

    if (!this.userData.user || !this.userData.password) {
      this.error = true; // Mostrar el mensaje de error
      return; // Detener la ejecución del método
    }

    this.loginService.login(this.userData).subscribe(response => {
      if (response.status === 'Correcto') {
        // Redirigir al módulo de productos
        this.router.navigate(['/productos']);

        // Guardar la información de la sesión en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('permissions', JSON.stringify(response.permissions));
      } else {
        // console.error('Error en el inicio de sesión');
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Credenciales incorrectas!",
          showConfirmButton: false
        });
      }
    }, error => {
      console.error('Error en el inicio de sesión:', error);
    });
  }

}