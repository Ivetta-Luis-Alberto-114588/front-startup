// src/app/shared/services/role.service.ts
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { IUser } from '../models/iuser';

@Injectable({
    providedIn: 'root'
})
export class RoleService {

    constructor(private authService: AuthService) { }

    /**
     * Verifica si el usuario actual tiene el rol de SUPER_ADMIN_ROLE
     * @returns Observable<boolean>
     */
    isSuperAdmin(): Observable<boolean> {
        return this.authService.user$.pipe(
            map(user => !!(user && user.roles?.includes('SUPER_ADMIN_ROLE')))
        );
    }

    /**
     * Verifica si el usuario actual tiene el rol de ADMIN_ROLE
     * @returns Observable<boolean>
     */
    isAdmin(): Observable<boolean> {
        return this.authService.user$.pipe(
            map(user => !!(user && user.roles?.includes('ADMIN_ROLE')))
        );
    }

    /**
     * Verifica si el usuario actual tiene permisos de administración (SUPER_ADMIN_ROLE o ADMIN_ROLE)
     * @returns Observable<boolean>
     */
    hasAdminPermissions(): Observable<boolean> {
        return this.authService.user$.pipe(
            map(user => {
                if (!user) return false;
                return !!(user.roles?.includes('SUPER_ADMIN_ROLE') || user.roles?.includes('ADMIN_ROLE'));
            })
        );
    }

    /**
     * Verifica si el usuario actual tiene el rol de USER_ROLE
     * @returns Observable<boolean>
     */
    isUser(): Observable<boolean> {
        return this.authService.user$.pipe(
            map(user => !!(user && user.roles?.includes('USER_ROLE')))
        );
    }

    /**
     * Obtiene el rol de mayor privilegio del usuario actual
     * @returns Observable<string | null>
     */
    getHighestRole(): Observable<string | null> {
        return this.authService.user$.pipe(
            map(user => {
                if (!user || !user.roles) return null;

                // Jerarquía de roles: SUPER_ADMIN_ROLE > ADMIN_ROLE > USER_ROLE
                if (user.roles.includes('SUPER_ADMIN_ROLE')) {
                    return 'SUPER_ADMIN_ROLE';
                } else if (user.roles.includes('ADMIN_ROLE')) {
                    return 'ADMIN_ROLE';
                } else if (user.roles.includes('USER_ROLE')) {
                    return 'USER_ROLE';
                }

                return null;
            })
        );
    }

    /**
     * Verifica si el usuario tiene un rol específico
     * @param role - Rol a verificar
     * @returns Observable<boolean>
     */
    hasRole(role: string): Observable<boolean> {
        return this.authService.user$.pipe(
            map(user => !!(user && user.roles?.includes(role)))
        );
    }

    /**
     * Verifica si el usuario tiene al menos uno de los roles especificados
     * @param roles - Array de roles a verificar
     * @returns Observable<boolean>
     */
    hasAnyRole(roles: string[]): Observable<boolean> {
        return this.authService.user$.pipe(
            map(user => {
                if (!user || !user.roles) return false;
                return roles.some(role => user.roles!.includes(role));
            })
        );
    }

    /**
     * Verifica si el usuario puede crear/insertar registros
     * SUPER_ADMIN_ROLE y ADMIN_ROLE pueden crear
     * @returns Observable<boolean>
     */
    canCreate(): Observable<boolean> {
        return this.hasAdminPermissions();
    }

    /**
     * Verifica si el usuario puede leer/listar registros
     * SUPER_ADMIN_ROLE y ADMIN_ROLE pueden leer
     * @returns Observable<boolean>
     */
    canRead(): Observable<boolean> {
        return this.hasAdminPermissions();
    }

    /**
     * Verifica si el usuario puede actualizar registros
     * Solo SUPER_ADMIN_ROLE puede actualizar
     * @returns Observable<boolean>
     */
    canUpdate(): Observable<boolean> {
        return this.isSuperAdmin();
    }

    /**
     * Verifica si el usuario puede eliminar registros
     * Solo SUPER_ADMIN_ROLE puede eliminar
     * @returns Observable<boolean>
     */
    canDelete(): Observable<boolean> {
        return this.isSuperAdmin();
    }

    /**
     * Verifica si el usuario puede realizar una operación específica
     * @param operation - Tipo de operación: 'create', 'read', 'update', 'delete'
     * @returns Observable<boolean>
     */
    canPerformOperation(operation: 'create' | 'read' | 'update' | 'delete'): Observable<boolean> {
        switch (operation) {
            case 'create':
                return this.canCreate();
            case 'read':
                return this.canRead();
            case 'update':
                return this.canUpdate();
            case 'delete':
                return this.canDelete();
            default:
                return this.authService.user$.pipe(map(() => false));
        }
    }
}
