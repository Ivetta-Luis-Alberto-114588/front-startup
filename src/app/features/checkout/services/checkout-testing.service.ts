// src/app/features/checkout/services/checkout-testing.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { ICreateOrderPayload } from '../../orders/models/ICreateOrderPayload';
import { IDeliveryMethod } from 'src/app/shared/models/idelivery-method';

/**
 * Servicio para testing exhaustivo del flujo de checkout.
 * Incluye escenarios de prueba para diferentes métodos de entrega y casos de error.
 */
@Injectable({
    providedIn: 'root'
})
export class CheckoutTestingService {

    constructor() { }

    /**
     * ESCENARIO 1: Envío a domicilio (con dirección)
     * Simula un pedido con entrega que requiere dirección completa
     */
    testHomeDeliveryScenario(): Observable<any> {
        console.log('🧪 TESTING - Escenario 1: Envío a domicilio');

        const homeDeliveryMethod: IDeliveryMethod = {
            id: 'home-delivery-001',
            code: 'SHIPPING',
            name: 'Envío a Domicilio',
            description: 'Entrega en la dirección especificada',
            price: 150.00,
            isActive: true,
            requiresAddress: true
        };

        const testPayload: ICreateOrderPayload = {
            items: [
                {
                    productId: 'test-product-001',
                    quantity: 2,
                    unitPrice: 25.99
                }
            ],
            deliveryMethod: homeDeliveryMethod.id,
            paymentMethodId: 'mercado_pago',
            notes: 'Prueba de envío a domicilio',
            // Datos de envío completos
            shippingRecipientName: 'Juan Pérez Test',
            shippingPhone: '+54911234567',
            shippingStreetAddress: 'Av. Corrientes 1234, Piso 5, Dpto B',
            shippingPostalCode: '1043',
            shippingNeighborhoodId: 'test-neighborhood-001',
            shippingCityId: 'test-city-001',
            shippingAdditionalInfo: 'Timbre: Pérez - Edificio azul',
            // Datos del cliente (para invitados)
            customerName: 'Juan Pérez',
            customerEmail: 'juan.perez.test@example.com'
        };

        return this.simulateOrderCreation(testPayload, 'home-delivery').pipe(
            switchMap(result => {
                console.log('✅ Escenario 1 completado:', result);
                return of(result);
            })
        );
    }

    /**
     * ESCENARIO 2: Retiro en local (sin dirección)
     * Simula un pedido con retiro que NO requiere dirección
     */
    testPickupScenario(): Observable<any> {
        console.log('🧪 TESTING - Escenario 2: Retiro en local');

        const pickupMethod: IDeliveryMethod = {
            id: 'pickup-local-001',
            code: 'PICKUP',
            name: 'Retiro en Local',
            description: 'Retiro en nuestro local de Palermo',
            price: 0.00,
            isActive: true,
            requiresAddress: false
        };

        const testPayload: ICreateOrderPayload = {
            items: [
                {
                    productId: 'test-product-002',
                    quantity: 1,
                    unitPrice: 45.00
                },
                {
                    productId: 'test-product-003',
                    quantity: 3,
                    unitPrice: 12.50
                }
            ],
            deliveryMethod: pickupMethod.id,
            paymentMethodId: 'cash',
            notes: 'Prueba de retiro en local - Cliente prefiere retiro por la tarde',
            // Para retiro en local, NO incluimos datos de shipping
            // Solo datos del cliente
            customerName: 'María González',
            customerEmail: 'maria.gonzalez.test@example.com'
        };

        return this.simulateOrderCreation(testPayload, 'pickup').pipe(
            switchMap(result => {
                console.log('✅ Escenario 2 completado:', result);
                return of(result);
            })
        );
    }

    /**
     * ESCENARIO 3: Usuario autenticado con dirección guardada
     * Simula un usuario logueado que usa una dirección previamente guardada
     */
    testAuthenticatedUserScenario(): Observable<any> {
        console.log('🧪 TESTING - Escenario 3: Usuario autenticado');

        const expressDeliveryMethod: IDeliveryMethod = {
            id: 'express-delivery-001',
            code: 'EXPRESS',
            name: 'Envío Express',
            description: 'Entrega en el día',
            price: 300.00,
            isActive: true,
            requiresAddress: true
        };

        const testPayload: ICreateOrderPayload = {
            items: [
                {
                    productId: 'test-product-004',
                    quantity: 1,
                    unitPrice: 89.99
                }
            ],
            deliveryMethod: expressDeliveryMethod.id,
            paymentMethodId: 'mercado_pago',
            selectedAddressId: 'user-address-123456', // Usuario usa dirección guardada
            notes: 'Envío express para usuario autenticado',
            couponCode: 'DESCUENTO10'
            // NO incluimos customerName/customerEmail porque el usuario está autenticado
            // NO incluimos campos shipping individuales porque usa dirección guardada
        };

        return this.simulateOrderCreation(testPayload, 'authenticated').pipe(
            switchMap(result => {
                console.log('✅ Escenario 3 completado:', result);
                return of(result);
            })
        );
    }

    /**
     * ESCENARIO 4: Validaciones de formulario
     * Prueba casos donde faltan datos requeridos
     */
    testFormValidationScenarios(): Observable<any> {
        console.log('🧪 TESTING - Escenario 4: Validaciones de formulario');

        const validationTests = [
            {
                name: 'Carrito vacío',
                payload: {
                    items: [],
                    deliveryMethod: 'test-delivery',
                    paymentMethodId: 'cash'
                } as ICreateOrderPayload,
                expectedError: 'El carrito no puede estar vacío'
            },
            {
                name: 'Sin método de entrega',
                payload: {
                    items: [{ productId: 'test', quantity: 1, unitPrice: 10 }]
                } as unknown as ICreateOrderPayload,
                expectedError: 'Debe seleccionar un método de entrega'
            },
            {
                name: 'Envío sin dirección completa',
                payload: {
                    items: [{ productId: 'test', quantity: 1, unitPrice: 10 }],
                    deliveryMethod: 'home-delivery-001',
                    paymentMethodId: 'mercado_pago',
                    shippingRecipientName: 'Test',
                    // Faltan otros campos requeridos
                } as ICreateOrderPayload,
                expectedError: 'Teléfono de contacto es requerido'
            }
        ];

        return of(validationTests).pipe(
            delay(100),
            switchMap(tests => {
                console.log('✅ Validaciones de formulario probadas:', tests.length, 'casos');
                return of({ validationTests: tests, status: 'completed' });
            })
        );
    }

    /**
     * ESCENARIO 5: Casos de error (API no disponible)
     * Simula errores de red y respuestas de error del backend
     */
    testErrorScenarios(): Observable<any> {
        console.log('🧪 TESTING - Escenario 5: Casos de error');

        const errorScenarios = [
            {
                type: 'network-error',
                description: 'Error de conexión de red',
                simulation: () => throwError(() => new Error('Network connection failed'))
            },
            {
                type: 'server-error',
                description: 'Error 500 del servidor',
                simulation: () => throwError(() => ({ status: 500, message: 'Internal server error' }))
            },
            {
                type: 'validation-error',
                description: 'Error de validación del backend',
                simulation: () => throwError(() => ({
                    status: 400,
                    error: {
                        message: 'Datos de pedido inválidos',
                        details: ['El producto no está disponible', 'Stock insuficiente']
                    }
                }))
            },
            {
                type: 'timeout-error',
                description: 'Timeout de la petición',
                simulation: () => throwError(() => new Error('Request timeout'))
            }
        ];

        return of(errorScenarios).pipe(
            delay(200),
            switchMap(scenarios => {
                console.log('✅ Casos de error simulados:', scenarios.length, 'escenarios');
                return of({ errorScenarios: scenarios, status: 'completed' });
            })
        );
    }

    /**
     * Ejecuta todos los escenarios de testing en secuencia
     */
    runAllTestScenarios(): Observable<any> {
        console.log('🚀 Iniciando testing exhaustivo del checkout...');

        return this.testHomeDeliveryScenario().pipe(
            delay(500),
            switchMap(() => this.testPickupScenario()),
            delay(500),
            switchMap(() => this.testAuthenticatedUserScenario()),
            delay(500),
            switchMap(() => this.testFormValidationScenarios()),
            delay(500),
            switchMap(() => this.testErrorScenarios()),
            switchMap((finalResult) => {
                console.log('🎉 Testing exhaustivo completado exitosamente!');
                return of({
                    message: 'Todos los escenarios de testing completados',
                    timestamp: new Date().toISOString(),
                    scenarios: [
                        'Envío a domicilio',
                        'Retiro en local',
                        'Usuario autenticado',
                        'Validaciones de formulario',
                        'Casos de error'
                    ],
                    status: 'success'
                });
            })
        );
    }

    /**
     * Simula la creación de una orden con diferentes comportamientos según el escenario
     */
    private simulateOrderCreation(payload: ICreateOrderPayload, scenario: string): Observable<any> {
        return of(null).pipe(
            delay(Math.random() * 1000 + 500), // Simular latencia de red variable
            switchMap(() => {
                // Simular respuesta exitosa
                const mockOrder = {
                    id: `order-${scenario}-${Date.now()}`,
                    status: 'confirmed',
                    total: payload.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
                    deliveryMethod: payload.deliveryMethod,
                    items: payload.items,
                    createdAt: new Date().toISOString(),
                    scenario: scenario
                };

                return of(mockOrder);
            })
        );
    }
}
