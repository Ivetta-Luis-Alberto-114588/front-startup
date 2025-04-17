// src/app/shared/pages/terms-conditions/terms-conditions.component.ts
import { Component } from '@angular/core';
import { Location } from '@angular/common'; // <-- Importar Location

@Component({
  selector: 'app-terms-conditions',
  templateUrl: './terms-conditions.component.html',
  styleUrls: ['./terms-conditions.component.scss']
})
export class TermsConditionsComponent {

  // Inyectar Location en el constructor
  constructor(private location: Location) { }

  // Método para volver a la página anterior
  goBack(): void {
    this.location.back();
  }
}