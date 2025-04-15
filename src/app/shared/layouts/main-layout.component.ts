import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarService } from '../sidebar/sidebar.service'; // Asegúrate que la ruta sea correcta

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  // Vincula la clase 'sidebar-expanded' del host a la propiedad 'isSidebarExpanded'
  @HostBinding('class.sidebar-expanded') isSidebarExpanded = false;
  private sidebarSub: Subscription | undefined;

  // Inyecta SidebarService
  constructor(public sidebarService: SidebarService) { }

  ngOnInit(): void {
    // Suscríbete a los cambios del estado del sidebar para actualizar la propiedad
    // Necesitarás que SidebarService exponga un Observable o Subject para esto.
    // Modifiquemos SidebarService.

    // Asumiendo que SidebarService ahora tiene isSidebarCollapsed$ (ver Paso 2)
    this.sidebarSub = this.sidebarService.isSidebarCollapsed$.subscribe(isCollapsed => {
      this.isSidebarExpanded = !isCollapsed;
    });
  }

  ngOnDestroy(): void {
    // Desuscribe para evitar fugas de memoria
    this.sidebarSub?.unsubscribe();
  }
}