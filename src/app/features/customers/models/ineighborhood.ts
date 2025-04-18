import { ICity } from "./icity";

export interface INeighborhood {
    id: string, // <<<--- CAMBIADO A string
    name: string,
    description: string,
    city: ICity, // Aquí establecemos la relación con City
    isActive: boolean
}
