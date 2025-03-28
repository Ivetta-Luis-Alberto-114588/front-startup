export interface IProduct {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string; // el uuid de  'pizzas', 'empanadas', 'lomitos', 'bebidas'
    unit: string; // el uuid de 'unidad', 'docena', 'litro'
    imgUrl?: string;
    isActive: boolean;
    description: string;
}
