
---
description: 'Estándares de codificación y mejores prácticas específicas de Angular (basado en módulos)'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---
# Instrucciones para el desarrollo en Angular

Instrucciones para generar aplicaciones Angular de alta calidad con TypeScript, utilizando módulos (NgModules) y las mejores prácticas descritas en https://angular.dev.

## Contexto del Proyecto

- Última versión de Angular **con arquitectura basada en módulos (sin componentes standalone)**
- Uso de TypeScript para garantizar la seguridad de tipos
- Uso de Angular CLI para la configuración del proyecto y scaffolding
- Seguir la Guía de Estilo de Angular (https://angular.dev/style-guide)
- Utilizar Angular Material u otras bibliotecas modernas de UI si se especifica

## Estándares de Desarrollo

### Arquitectura

- **Usar NgModules como base de la arquitectura** (NO usar componentes standalone)
- Organizar el código por módulos funcionales o dominios (estructura modular escalable)
- Implementar lazy loading para módulos mediante rutas para mejorar el rendimiento
- Utilizar el sistema de inyección de dependencias de Angular (DI)
- Separar lógica de presentación y lógica de negocio (smart vs presentational components)

* siempre responde en castellano
* tratar de usar boostrap, tratar de NO usar scss
* debe usar observables y tratar de evitar usar promesas
* no usar any para el tipado, intentar siempre tipar los datos
* cuando termines de hacer una implementacion NO crees un archivo .md con lo hecho salvo que se te pida

### TypeScript

- Habilitar modo estricto en `tsconfig.json`
- Definir interfaces y tipos claros para componentes, servicios y modelos
- Usar type guards, tipos unión y tipado estricto para robustez
- Manejo de errores con operadores RxJS como `catchError`
- Formularios reactivos con `FormGroup`, `FormControl`, validadores y tipado

### Diseño de Componentes

- Respetar el ciclo de vida de componentes (`ngOnInit`, `ngOnDestroy`, etc.)
- Usar decoradores clásicos como `@Input()`, `@Output()`, `@ViewChild()`, etc.
- Usar la estrategia de detección de cambios `OnPush` cuando sea posible
- Mantener templates simples y la lógica en la clase o en servicios
- Utilizar directivas y pipes personalizados reutilizables donde aplique

### Estilos

- Encapsulamiento de estilos por componente (`ViewEncapsulation.Emulated` por defecto)
- Preferir boostrap  para organización y tematización
- Trata de no usar CSS, salvo que sea necesario
- Seguir las guías de diseño de Angular Material (si se usa)
- Asegurar accesibilidad (a11y) con atributos ARIA y estructura semántica

### Gestión del Estado

- Usar servicios Angular con RxJS para el manejo del estado global y compartido
- Utilizar `BehaviorSubject`, `ReplaySubject` y `Observable` para reactividad
- Manejar estado derivado usando operadores como `map`, `combineLatest`, etc.
- Estados de carga y error controlados con flags (`isLoading`, `error`) y lógica en la UI
- Usar `AsyncPipe` en templates para suscribirse automáticamente

### Obtención de Datos

- Usar `HttpClient` para llamadas HTTP con tipado adecuado
- Usar operadores de RxJS para transformar datos (`map`, `tap`, `catchError`, etc.)
- **NO usar `inject()`** — seguir inyectando dependencias mediante constructores
- Implementar estrategias de caching (por ejemplo, `shareReplay`)
- Guardar respuestas de APIs en servicios y exponerlas como observables

### Seguridad

- Sanitizar entradas del usuario con el sistema interno de Angular
- Usar `Route Guards` (`CanActivate`, `CanLoad`, etc.) para proteger rutas
- Usar `HttpInterceptor` para agregar encabezados de autenticación o protección CSRF
- Validar formularios con validadores integrados y personalizados
- Evitar manipulaciones directas del DOM (usar `Renderer2` si es necesario)

### Rendimiento

- Compilar con `ng build --prod` para optimización
- Cargar rutas de forma diferida (lazy loading) con `loadChildren` en rutas
- Optimizar el cambio de detección con `ChangeDetectionStrategy.OnPush`
- Usar `trackBy` en `ngFor` para evitar renders innecesarios
- Considerar SSR (Angular Universal) o prerender (SSG) si aplica

### Pruebas

- Pruebas unitarias con Jasmine y Karma para componentes, servicios y pipes
- Utilizar `TestBed` para configuración de pruebas unitarias
- Simular dependencias con mocks y `HttpClientTestingModule`
- Pruebas end-to-end con Cypress o Playwright (si se requiere)
- Asegurar buena cobertura de código, especialmente en lógica crítica

## Proceso de Implementación

1. Planificar la estructura de módulos (feature modules, shared, core)
2. Definir interfaces y modelos en TypeScript
3. Generar componentes, servicios, pipes y módulos usando Angular CLI
4. Crear servicios para lógica de negocio y llamadas a APIs
5. Diseñar componentes reutilizables con inputs/outputs bien definidos
6. Agregar formularios reactivos con validaciones
7. Aplicar estilos SCSS y diseño responsivo
8. Implementar lazy loading en rutas y guards de navegación
9. Agregar manejo de errores, carga y estados vacíos
10. Escribir pruebas unitarias y pruebas E2E
11. Optimizar el rendimiento final del bundle

## Guías Adicionales

- Nombrar archivos siguiendo las convenciones Angular (`componente.component.ts`, etc.)
- Usar Angular CLI para generación de código estándar
- Documentar componentes y servicios con comentarios JSDoc
- Asegurar accesibilidad WCAG 2.1 cuando sea necesario
- Internacionalización con Angular i18n si se requiere
- Evitar duplicación de código reutilizando módulos y servicios compartidos
- Usar RxJS consistentemente en servicios para una gestión de estado reactiva y eficiente
  """
