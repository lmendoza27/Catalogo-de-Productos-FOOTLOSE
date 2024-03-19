import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontenddd';

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.navigate(['/login']); // Redirige automáticamente a la página de inicio de sesión al iniciar la aplicación
  }

}
