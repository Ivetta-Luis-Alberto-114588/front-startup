// Interfaz para los detalles de envío en una orden recibida
export interface IShippingDetails {
    recipientName: string;
    phone: string;
    streetAddress: string;
    postalCode?: string;
    neighborhoodName: string;
    cityName: string;
    additionalInfo?: string;
}