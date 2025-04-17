// src/app/shared/models/iuser.ts

/**
 * Representa la información básica del usuario en el frontend.
 * Basado en UserEntity y UserMapper del backend (excluyendo contraseña).
 */
export interface IUser {
    id: string;
    name: string;
    email: string;
    role: string[];
    img?: string;
    // No incluir password
}