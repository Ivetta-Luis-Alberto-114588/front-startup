// src/app/shared/dtos/pagination.dto.ts

/**
 * Interface para representar los parámetros de paginación
 * enviados a la API o utilizados internamente en el frontend.
 */
export interface PaginationDto {
    /**
     * El número de página actual (empezando desde 1).
     */
    page: number;

    /**
     * El número máximo de ítems a devolver por página.
     */
    limit: number;
}