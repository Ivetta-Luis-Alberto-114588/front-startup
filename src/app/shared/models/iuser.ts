// src/app/shared/models/iuser.ts

/**
 * Representa la información básica del usuario en el frontend.
 * Basado en UserEntity y UserMapper del backend (excluyendo contraseña).
 * Estructura actualizada para coincidir con MongoDB.
 */
export interface IUser {
    id: string;
    name: string;
    email: string;
    roles: string[]; // Roles del usuario, consistente con MongoDB
    img?: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
    // No incluir password
}