import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'; // Importar

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Estado inicial basado en el ancho de la ventana
  private initialState = window.innerWidth < 768;
  // BehaviorSubject para mantener y emitir el estado actual
  private _isSidebarCollapsed = new BehaviorSubject<boolean>(this.initialState);

  // Observable público para que otros componentes se suscriban
  public isSidebarCollapsed$ = this._isSidebarCollapsed.asObservable();

  // Getter público para acceder al valor actual si es necesario (opcional)
  public get isSidebarCollapsed(): boolean {
    return this._isSidebarCollapsed.value;
  }

  constructor() {
    // Opcional: Añadir clase inicial al body en móvil si está abierto
    if (window.innerWidth < 768 && !this.initialState) {
      document.body.classList.add('sidebar-open');
    }
  }

  toggleSidebar(): void {
    const newState = !this._isSidebarCollapsed.value;
    this._isSidebarCollapsed.next(newState); // Emitir el nuevo estado

    // Mantener la lógica de la clase 'sidebar-open' en el body para móviles
    if (window.innerWidth < 768) {
      if (!newState) { // Si NO está colapsado (está abierto)
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }
  }

  // Método para establecer explícitamente el estado (útil en resize)
  setSidebarCollapsed(isCollapsed: boolean): void {
    if (this._isSidebarCollapsed.value !== isCollapsed) {
      this._isSidebarCollapsed.next(isCollapsed);
      // Actualizar clase del body en móvil si el estado cambia externamente
      if (window.innerWidth < 768) {
        if (!isCollapsed) { document.body.classList.add('sidebar-open'); }
        else { document.body.classList.remove('sidebar-open'); }
      }
    }
  }
}