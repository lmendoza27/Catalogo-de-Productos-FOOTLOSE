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

  ngOnInit(): void {
    // Verificar si existe el token en el localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Si existe, redirigir al usuario a la ruta /productos
      this.router.navigate(['/productos']);
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