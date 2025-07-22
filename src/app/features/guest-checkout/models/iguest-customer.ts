// Interface para información básica del cliente invitado
export interface IGuestCustomer {
  customerName: string;
  customerEmail: string;
}

// Interface para validación de datos de cliente invitado
export interface IGuestCustomerValidation {
  isValid: boolean;
  errors: {
    customerName?: string;
    customerEmail?: string;
  };
}
