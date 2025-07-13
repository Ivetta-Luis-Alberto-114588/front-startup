import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IDeliveryMethod, IDeliveryMethodsResponse } from '../models/idelivery-method';
import { RoleService } from './role.service';

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

    constructor(
        private http: HttpClient,
        private roleService: RoleService
    ) { }

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
        // Petición a API que devuelve objeto con deliveryMethods
        this.deliveryMethodsCache$ = this.http.get<IDeliveryMethodsResponse>(`${this.apiUrl}/delivery-methods`)
            .pipe(
                // Extraer array de métodos del cuerpo de respuesta
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

    /**
     * ADMIN METHODS - Para gestión administrativa de métodos de entrega
     */

    /**
     * Obtiene TODOS los métodos de entrega (activos e inactivos) para administración.
     * @returns Observable con array de todos los métodos de entrega
     */
    getAllDeliveryMethods(): Observable<IDeliveryMethod[]> {
        this.loadingSubject.next(true);
        return this.http.get<IDeliveryMethod[]>(`${this.apiUrl}/delivery-methods`)
            .pipe(
                // No necesitamos map porque la API devuelve directamente el array
                tap(() => this.loadingSubject.next(false)),
                catchError(error => {
                    this.loadingSubject.next(false);
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
                })
            );
    }

    /**
     * Crea un nuevo método de entrega.
     * @param method Datos del método de entrega a crear
     * @returns Observable con el método creado
     */
    createDeliveryMethod(method: Omit<IDeliveryMethod, 'id'>): Observable<IDeliveryMethod> {
        this.loadingSubject.next(true);
        return this.http.post<IDeliveryMethod>(`${this.apiUrl}/admin/delivery-methods`, method)
            .pipe(
                tap(() => {
                    this.loadingSubject.next(false);
                    this.clearCache(); // Limpiar cache después de crear
                }),
                catchError(error => {
                    this.loadingSubject.next(false);
                    return throwError(() => error);
                })
            );
    }

    /**
     * Actualiza un método de entrega existente.
     * Solo disponible para SUPER_ADMIN_ROLE.
     * @param id ID del método a actualizar
     * @param method Datos actualizados del método
     * @returns Observable con el método actualizado
     */
    updateDeliveryMethod(id: string, method: Partial<IDeliveryMethod>): Observable<IDeliveryMethod> {
        return this.roleService.canUpdate().pipe(
            switchMap(canUpdate => {
                if (!canUpdate) {
                    return throwError(() => new Error('No tienes permisos para actualizar métodos de entrega. Solo los Super Administradores pueden realizar esta acción.'));
                }

                this.loadingSubject.next(true);
                return this.http.put<IDeliveryMethod>(`${this.apiUrl}/admin/delivery-methods/${id}`, method)
                    .pipe(
                        tap(() => {
                            this.loadingSubject.next(false);
                            this.clearCache(); // Limpiar cache después de actualizar
                        }),
                        catchError(error => {
                            this.loadingSubject.next(false);
                            return throwError(() => error);
                        })
                    );
            })
        );
    }

    /**
     * Elimina un método de entrega.
     * Solo disponible para SUPER_ADMIN_ROLE.
     * @param id ID del método a eliminar
     * @returns Observable con confirmación de eliminación
     */
    deleteDeliveryMethod(id: string): Observable<void> {
        return this.roleService.canDelete().pipe(
            switchMap(canDelete => {
                if (!canDelete) {
                    return throwError(() => new Error('No tienes permisos para eliminar métodos de entrega. Solo los Super Administradores pueden realizar esta acción.'));
                }

                this.loadingSubject.next(true);
                return this.http.delete<void>(`${this.apiUrl}/admin/delivery-methods/${id}`)
                    .pipe(
                        tap(() => {
                            this.loadingSubject.next(false);
                            this.clearCache(); // Limpiar cache después de eliminar
                        }),
                        catchError(error => {
                            this.loadingSubject.next(false);
                            return throwError(() => error);
                        })
                    );
            })
        );
    }

    /**
     * Activa o desactiva un método de entrega.
     * @param id ID del método
     * @param isActive Estado activo/inactivo
     * @returns Observable con el método actualizado
     */
    toggleDeliveryMethodStatus(id: string, isActive: boolean): Observable<IDeliveryMethod> {
        return this.updateDeliveryMethod(id, { isActive });
    }
}
