import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastr: ToastrService) { }

  showSuccess(message: string, title?: string): void {
    this.toastr.success(message, title);
  }

  showError(message: string, title?: string): void {
    // Puedes añadir lógica extra aquí si es necesario
    this.toastr.error(message, title, {
      // Opciones específicas para errores si quieres
      // timeOut: 5000,
      // extendedTimeOut: 1000,
    });
  }

  showInfo(message: string, title?: string): void {
    this.toastr.info(message, title);
  }

  showWarning(message: string, title?: string): void {
    this.toastr.warning(message, title);
  }
}
