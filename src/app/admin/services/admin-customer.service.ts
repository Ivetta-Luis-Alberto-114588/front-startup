// src/app/admin/services/admin-customer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ICustomer } from '../../features/customers/models/icustomer'; // Reutiliza la interfaz existente
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { RoleService } from 'src/app/shared/services/role.service';

// Interfaz para la respuesta paginada (AJÚSTALA SI TU BACKEND DEVUELVE ALGO DIFERENTE)
export interface PaginatedAdminCustomersResponse {
  total: number;      // Número total de clientes que coinciden con los filtros (no solo en la página actual)
  customers: ICustomer[]; // Array de clientes para la página actual
  // page: number;    // Opcional: Página actual devuelta por el backend
  // limit: number;   // Opcional: Límite por página devuelto por el backend
}

// Interfaz para los datos que se pueden actualizar (define qué campos puede modificar el admin)
// ¡IMPORTANTE! Evita incluir email y userId aquí si no quieres que el admin los modifique.
export interface UpdateAdminCustomerData {
  name?: string;
  phone?: string;
  address?: string;
  neighborhoodId?: string; // Enviar solo el ID
  isActive?: boolean;
  // Añade otros campos si son necesarios y seguros de modificar por un admin
}


@Injectable({
  providedIn: 'root'
})
export class AdminCustomerService {

  // Apunta al endpoint de admin para clientes
  private adminApiUrl = `${environment.apiUrl}/api/admin/customers`;

  constructor(
    private http: HttpClient,
    private roleService: RoleService
  ) { }

  /**
   * Obtiene una lista paginada de todos los clientes (admin).
   * GET /api/admin/customers
   */
  getCustomers(pagination: PaginationDto): Observable<PaginatedAdminCustomersResponse> {
    // Asume que el backend devuelve { total: number, customers: ICustomer[] }
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    // Aquí podrías añadir más params para filtros futuros (ej: nombre, email, estado)
    // params = params.set('status', 'active');
    return this.http.get<PaginatedAdminCustomersResponse>(this.adminApiUrl, { params });
  }

  /**
   * Obtiene los detalles de un cliente específico por su ID (admin).
   * GET /api/admin/customers/:id
   */
  getCustomerById(id: string): Observable<ICustomer> {
    return this.http.get<ICustomer>(`${this.adminApiUrl}/${id}`);
  }

  /**
   * Actualiza la información de un cliente (admin).
   * PUT /api/admin/customers/:id
   * @param id ID del cliente a actualizar.
   * @param customerData Objeto con los campos a modificar (ver UpdateAdminCustomerData).
   */
  updateCustomer(id: string, customerData: UpdateAdminCustomerData): Observable<ICustomer> {
    return this.roleService.canUpdate().pipe(
      switchMap((canUpdate: boolean) => {
        if (!canUpdate) {
          return throwError(() => new Error('No tienes permisos para actualizar clientes'));
        }
        // Asegúrate que el payload solo contenga los campos permitidos
        // y que neighborhood sea solo el ID si se envía.
        const payload: any = { ...customerData };
        if (payload.neighborhoodId) {
          payload.neighborhood = payload.neighborhoodId; // El backend espera 'neighborhood' con el ID
          delete payload.neighborhoodId; // Elimina la propiedad extra
        }
        return this.http.put<ICustomer>(`${this.adminApiUrl}/${id}`, payload);
      })
    );
  }

  /**
   * Elimina un cliente (admin).
   * DELETE /api/admin/customers/:id
   * @returns Observable con el cliente eliminado (o void si el backend no devuelve nada).
   */
  deleteCustomer(id: string): Observable<ICustomer> {
    return this.roleService.canDelete().pipe(
      switchMap(canDelete => {
        if (!canDelete) {
          return throwError(() => new Error('No tienes permisos para eliminar clientes. Solo los Super Administradores pueden realizar esta acción.'));
        }

        // Ajusta el tipo de retorno (ICustomer o void) según lo que devuelva tu API
        return this.http.delete<ICustomer>(`${this.adminApiUrl}/${id}`);
      })
    );
  }

  // --- Métodos Adicionales (Opcionales pero útiles para admin) ---

  /**
   * Busca clientes por email (admin).
   * GET /api/admin/customers/by-email/:email
   */
  getCustomerByEmail(email: string): Observable<ICustomer> { // Asume que devuelve uno o 404
    return this.http.get<ICustomer>(`${this.adminApiUrl}/by-email/${encodeURIComponent(email)}`);
  }

  /**
   * Busca clientes por barrio (admin).
   * GET /api/admin/customers/by-neighborhood/:neighborhoodId
   */
  getCustomersByNeighborhood(neighborhoodId: string, pagination: PaginationDto): Observable<PaginatedAdminCustomersResponse> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('limit', pagination.limit.toString());
    return this.http.get<PaginatedAdminCustomersResponse>(`${this.adminApiUrl}/by-neighborhood/${neighborhoodId}`, { params });
  }

  // NOTA: Crear cliente desde admin (POST /api/admin/customers) no se incluye
  // porque la lógica de creación principal está en el registro de usuario.
  // Si necesitas que el admin cree clientes manualmente, añade un método createCustomer aquí.
  /*
  createCustomer(customerData: CreateAdminCustomerData): Observable<ICustomer> {
    // Define CreateAdminCustomerData con los campos necesarios
    return this.http.post<ICustomer>(this.adminApiUrl, customerData);
  }
  */
}