// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // <-- Importar
import { ToastrModule } from 'ngx-toastr'; // <-- Importar

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
// Elimina la importación de AuthModule si aún la tienes aquí
// import { AuthModule } from './auth/auth.module';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { FeaturesModule } from './features/features.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    BrowserAnimationsModule, // <-- Añadir aquí
    ToastrModule.forRoot({   // <-- Añadir y configurar (opcional)
      timeOut: 3000, // Tiempo visible en ms
      positionClass: 'toast-bottom-right', // Posición en pantalla
      preventDuplicates: true, // Evitar toasts duplicados idénticos
      closeButton: true, // Mostrar botón de cierre
      progressBar: true, // Mostrar barra de progreso
    }),
    FeaturesModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }