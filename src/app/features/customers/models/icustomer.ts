// src/app/features/customers/models/icustomer.ts
import { INeighborhood } from "./ineighborhood"; // Asegúrate que la ruta sea correcta

/**
 * Representa la estructura de un cliente en el frontend.
 * Basado en CustomerEntity y CustomerMapper del backend.
 */
export interface ICustomer {
    /** ID único del cliente (string de MongoDB). */
    id: string;

    /** Nombre completo del cliente. */
    name: string;

    /** Dirección de correo electrónico única del cliente. */
    email: string;

    /** Número de teléfono de contacto del cliente. */
    phone: string;

    /**
     * Dirección principal registrada (puede ser un placeholder inicial).
     * La gestión detallada de múltiples direcciones se maneja por separado.
     */
    address: string;

    /**
     * El barrio asociado al cliente (debería venir poblado desde la API).
     * Contiene también la información de la ciudad.
     */
    neighborhood: INeighborhood; // Incluye la ciudad anidada

    /** Indica si el perfil del cliente está activo. */
    isActive: boolean;

    /**
     * ID del usuario (User) asociado a este cliente, si es un usuario registrado.
     * Será `null` o `undefined` si es un cliente invitado.
     * Ayuda a diferenciar entre clientes registrados e invitados.
     */
    userId?: string | null;

    /** Fecha de creación del registro (opcional en frontend). */
    createdAt?: string | Date;

    /** Fecha de la última actualización del registro (opcional en frontend). */
    updatedAt?: string | Date;
}