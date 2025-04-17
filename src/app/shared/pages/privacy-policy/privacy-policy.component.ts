// src/app/shared/pages/privacy-policy/privacy-policy.component.ts
import { Component } from '@angular/core';
import { Location } from '@angular/common'; // <-- Importar Location

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent {

  // Inyectar Location en el constructor
  constructor(private location: Location) { }

  // Método para volver a la página anterior
  goBack(): void {
    this.location.back();
  }
}