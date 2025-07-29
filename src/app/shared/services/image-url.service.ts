// src/app/shared/services/image-url.service.ts
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ImageUrlService {

    private readonly DEFAULT_PLACEHOLDER = 'assets/placeholder.png';
    private readonly BACKEND_URL = environment.apiUrl;

    constructor() { }

    /**
     * Construye la URL completa de una imagen del producto
     * @param imgUrl URL de imagen que puede ser relativa o absoluta
     * @returns URL completa válida o placeholder en caso de error
     */
    getProductImageUrl(imgUrl?: string): string {
        if (!imgUrl) {
            return this.DEFAULT_PLACEHOLDER;
        }

        // Si ya es una URL completa (http o https), devolverla tal como está
        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
            return imgUrl;
        }

        // Si es una ruta relativa, construir URL completa con el backend
        if (imgUrl.startsWith('/')) {
            return `${this.BACKEND_URL}${imgUrl}`;
        }

        // Si no tiene slash inicial, asumimos que es un archivo en la carpeta de uploads
        return `${this.BACKEND_URL}/uploads/${imgUrl}`;
    }

    /**
     * Obtiene la URL del placeholder por defecto
     */
    getPlaceholderUrl(): string {
        return this.DEFAULT_PLACEHOLDER;
    }

    /**
     * Valida si una URL de imagen es válida
     */
    isValidImageUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
