import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IDeliveryMethod, IDeliveryMethodsResponse } from '../models/idelivery-method';

@Injectable({
    providedIn: 'root'
})
export class DeliveryMethodService {
    private readonly apiUrl = `${environment.apiUrl}/api`;

    // Cache local para optimizar rendimiento
    private deliveryMethodsCache$: Observable<IDeliveryMethod[]> | null = null;
    private cacheExpiration = 5 * 60 * 1000; // 5 minutos
    private lastCacheTime = 0;

    // Estados de loading y error
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string | null>(null);

    public loading$ = this.loadingSubject.asObservable();
    public error$ = this.errorSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Obtiene todos los métodos de entrega activos disponibles para el cliente.
     * Utiliza cache local para optimizar el rendimiento.
     * @returns Observable con array de métodos de entrega activos
     */
    getActiveDeliveryMethods(): Observable<IDeliveryMethod[]> {
        // Verificar si hay cache válido
        const now = Date.now();
        const isCacheValid = this.deliveryMethodsCache$ && (now - this.lastCacheTime) < this.cacheExpiration;

        if (isCacheValid) {
            return this.deliveryMethodsCache$!;
        }

        // Limpiar errores previos
        this.errorSubject.next(null);
        this.loadingSubject.next(true);

        // Crear nueva petición con cache
        this.deliveryMethodsCache$ = this.http.get<IDeliveryMethodsResponse>(`${this.apiUrl}/delivery-methods`)
            .pipe(
                map(response => response.deliveryMethods),
                tap(() => {
                    this.lastCacheTime = now;
                    this.loadingSubject.next(false);
                }),
                catchError(error => {
                    this.loadingSubject.next(false);
                    this.deliveryMethodsCache$ = null; // Limpiar cache en caso de error

                    let errorMessage = 'Error al cargar métodos de entrega';
                    if (error.status === 0) {
                        errorMessage = 'No se pudo conectar con el servidor';
                    } else if (error.status >= 500) {
                        errorMessage = 'Error interno del servidor';
                    } else if (error.error?.message) {
                        errorMessage = error.error.message;
                    }

                    this.errorSubject.next(errorMessage);
                    return throwError(() => error);
                }),
                shareReplay(1) // Compartir el resultado entre múltiples suscriptores
            );

        return this.deliveryMethodsCache$;
    }

    /**
     * Obtiene un método de entrega específico por su ID.
     * @param id ID del método de entrega
     * @returns Observable con el método de entrega o null si no se encuentra
     */
    getDeliveryMethodById(id: string): Observable<IDeliveryMethod | null> {
        return this.getActiveDeliveryMethods().pipe(
            map(methods => methods.find(method => method.id === id) || null),
            catchError(error => {
                console.error('Error al buscar método de entrega por ID:', error);
                return of(null);
            })
        );
    }

    /**
     * Obtiene un método de entrega específico por su código.
     * @param code Código del método de entrega (ej: "SHIPPING", "PICKUP")
     * @returns Observable con el método de entrega o null si no se encuentra
     */
    getDeliveryMethodByCode(code: string): Observable<IDeliveryMethod | null> {
        return this.getActiveDeliveryMethods().pipe(
            map(methods => methods.find(method => method.code === code) || null),
            catchError(error => {
                console.error('Error al buscar método de entrega por código:', error);
                return of(null);
            })
        );
    }

    /**
     * Verifica si un método de entrega requiere dirección de envío.
     * @param methodId ID del método de entrega
     * @returns Observable<boolean> - true si requiere dirección
     */
    requiresAddress(methodId: string): Observable<boolean> {
        return this.getDeliveryMethodById(methodId).pipe(
            map(method => method?.requiresAddress || false)
        );
    }

    /**
     * Limpia el cache manualmente. Útil cuando se actualizan los métodos desde admin.
     */
    clearCache(): void {
        this.deliveryMethodsCache$ = null;
        this.lastCacheTime = 0;
        this.errorSubject.next(null);
    }

    /**
     * Reintenta la carga de métodos de entrega en caso de error.
     */
    retry(): Observable<IDeliveryMethod[]> {
        this.clearCache();
        return this.getActiveDeliveryMethods();
    }
}
