import { ICity } from "./icity";
import { INeighborhood } from "./ineighborhood";

export interface IAddress {
     id: string,
     customerId: string,
     recipientName: string,
     phone: string,
     streetAddress: string,
     neighborhood: INeighborhood, // Entidad poblada
     city: ICity,             // Entidad poblada
     additionalInfo?: string,
     isDefault: boolean // false,
     alias?: string,
     createdAt?: Date,
     updatedAt?: Date,
     postalCode?: string,
}
