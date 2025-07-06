import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

import { OrderListComponent } from './order-list.component';
import { AdminOrderService, PaginatedAdminOrdersResponse } from '../../services/admin-order.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { OrderStatusService } from 'src/app/shared/services/order-status.service';
import { PaymentVerificationService } from 'src/app/features/payments/services/payment-verification.service';
import { IOrder } from 'src/app/features/orders/models/iorder';
import { IOrderStatus, IOrderStatusesResponse } from 'src/app/shared/models/iorder-status';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

describe('Admin OrderListComponent - Pagination Tests', () => {
    let component: OrderListComponent;
    let fixture: ComponentFixture<OrderListComponent>;
    let adminOrderService: jasmine.SpyObj<AdminOrderService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let orderStatusService: jasmine.SpyObj<OrderStatusService>;
    let paymentVerificationService: jasmine.SpyObj<PaymentVerificationService>;
    let router: jasmine.SpyObj<Router>;

    // Mock data
    const mockOrderStatus: IOrderStatus = {
        _id: 'status-1',
        code: 'PENDING',
        name: 'Pendiente',
        description: 'Pedido pendiente',
        color: '#FFC107',
        priority: 1,
        isActive: true,
        isDefault: true,
        isFinal: false,
        allowedTransitions: ['status-2']
    };

    const mockOrder: IOrder = {
        id: 'order-1',
        customer: {
            id: 'cust-1',
            name: 'Juan Pérez',
            email: 'juan@example.com'
        } as any,
        items: [],
        subtotal: 25.00,
        taxAmount: 3.00,
        discountRate: 0,
        discountAmount: 0,
        total: 28.00,
        date: new Date(),
        status: mockOrderStatus,
        notes: 'Test order'
    };

    const mockOrders: IOrder[] = Array.from({ length: 28 }, (_, i) => ({
        ...mockOrder,
        id: `order-${i + 1}`,
        total: 25 + i
    }));

    const mockPaginatedResponse: PaginatedAdminOrdersResponse = {
        orders: mockOrders.slice(0, 10),
        total: 28
    };

    const mockOrderStatusesResponse: IOrderStatusesResponse = {
        total: 1,
        orderStatuses: [mockOrderStatus]
    };

    beforeEach(async () => {
        const adminOrderServiceSpy = jasmine.createSpyObj('AdminOrderService', ['getOrders', 'updateOrderStatus']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning', 'showInfo']);
        const orderStatusServiceSpy = jasmine.createSpyObj('OrderStatusService', ['getOrderStatuses']);
        const paymentVerificationServiceSpy = jasmine.createSpyObj('PaymentVerificationService', ['manualVerifyAndUpdate']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']); await TestBed.configureTestingModule({
            declarations: [OrderListComponent],
            imports: [NgbPaginationModule, FormsModule],
            providers: [
                { provide: AdminOrderService, useValue: adminOrderServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: OrderStatusService, useValue: orderStatusServiceSpy },
                { provide: PaymentVerificationService, useValue: paymentVerificationServiceSpy },
                { provide: Router, useValue: routerSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(OrderListComponent);
        component = fixture.componentInstance;
        adminOrderService = TestBed.inject(AdminOrderService) as jasmine.SpyObj<AdminOrderService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        orderStatusService = TestBed.inject(OrderStatusService) as jasmine.SpyObj<OrderStatusService>;
        paymentVerificationService = TestBed.inject(PaymentVerificationService) as jasmine.SpyObj<PaymentVerificationService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    describe('Pagination Functionality', () => {
        beforeEach(() => {
            orderStatusService.getOrderStatuses.and.returnValue(of(mockOrderStatusesResponse));
            adminOrderService.getOrders.and.returnValue(of(mockPaginatedResponse));
        });

        it('should initialize with correct pagination defaults', () => {
            expect(component.currentPage).toBe(1);
            expect(component.itemsPerPage).toBe(10);
            expect(component.totalItems).toBe(0);
        });

        it('should load first page on component initialization', async () => {
            fixture.detectChanges();
            await fixture.whenStable(); // Esperar que las promesas se resuelvan

            expect(adminOrderService.getOrders).toHaveBeenCalledWith({
                page: 1,
                limit: 10
            });
            expect(component.orders.length).toBe(10);
            expect(component.totalItems).toBe(28);
            expect(component.currentPage).toBe(1);
        });

        it('should load page 2 when loadPage(2) is called', () => {
            const page2Response: PaginatedAdminOrdersResponse = {
                orders: mockOrders.slice(10, 20),
                total: 28
            };
            adminOrderService.getOrders.and.returnValue(of(page2Response));

            component.loadPage(2);

            expect(component.currentPage).toBe(2);
            expect(adminOrderService.getOrders).toHaveBeenCalledWith({
                page: 2,
                limit: 10
            });
            expect(component.orders.length).toBe(10);
            expect(component.totalItems).toBe(28);
        });

        it('should not reload same page when loadPage is called with current page', () => {
            fixture.detectChanges();
            adminOrderService.getOrders.calls.reset();

            component.loadPage(1); // Already on page 1

            expect(adminOrderService.getOrders).not.toHaveBeenCalled();
        });

        it('should not load page when component is loading', () => {
            component.isLoading = true;
            adminOrderService.getOrders.calls.reset();

            component.loadPage(2);

            expect(adminOrderService.getOrders).not.toHaveBeenCalled();
            expect(component.currentPage).toBe(1); // Should remain unchanged
        });

        it('should handle pagination with different page sizes', () => {
            component.itemsPerPage = 5;

            component.loadPage(3);

            expect(adminOrderService.getOrders).toHaveBeenCalledWith({
                page: 3,
                limit: 5
            });
        });

        it('should handle error when loading page fails', () => {
            const errorResponse = { error: { error: 'Server error' } };
            adminOrderService.getOrders.and.returnValue(throwError(errorResponse));

            component.loadPage(2);

            expect(component.error).toBe('Server error');
            expect(notificationService.showError).toHaveBeenCalledWith(
                'Server error',
                'Error'
            );
            expect(component.currentPage).toBe(2);
            expect(component.orders).toEqual([]);
            expect(component.totalItems).toBe(0);
        }); it('should update isLoading state during pagination', async () => {
            const subject = new Subject<PaginatedAdminOrdersResponse>();
            adminOrderService.getOrders.and.returnValue(subject.asObservable());

            expect(component.isLoading).toBe(false);

            component.loadPage(2);

            expect(component.isLoading).toBe(true);

            subject.next(mockPaginatedResponse);
            subject.complete();

            expect(component.isLoading).toBe(false);
        }); it('should handle service error', () => {
            const errorResponse = { error: { error: 'Server error' } };
            adminOrderService.getOrders.and.returnValue(throwError(errorResponse));

            component.loadOrders();

            expect(component.orders).toEqual([]);
            expect(component.totalItems).toBe(0);
            expect(component.error).toBe('Server error');
            expect(notificationService.showError).toHaveBeenCalledWith(
                'Server error',
                'Error'
            );
        });

        it('should handle empty results on pagination', () => {
            const emptyResponse: PaginatedAdminOrdersResponse = {
                orders: [],
                total: 0
            };
            adminOrderService.getOrders.and.returnValue(of(emptyResponse));

            component.loadPage(1);

            expect(component.orders).toEqual([]);
            expect(component.totalItems).toBe(0);
        });

        it('should reset error state when loading new page', () => {
            component.error = 'Previous error';

            component.loadPage(2);

            expect(component.error).toBeNull();
        });

        it('should calculate correct pagination parameters for different pages', () => {
            // Test page 1
            component.currentPage = 1;
            component.loadOrders();
            expect(adminOrderService.getOrders).toHaveBeenCalledWith({ page: 1, limit: 10 });

            // Test page 3
            component.currentPage = 3;
            component.loadOrders();
            expect(adminOrderService.getOrders).toHaveBeenCalledWith({ page: 3, limit: 10 });

            // Test with different itemsPerPage
            component.itemsPerPage = 20;
            component.currentPage = 2;
            component.loadOrders();
            expect(adminOrderService.getOrders).toHaveBeenCalledWith({ page: 2, limit: 20 });
        });
    });

    describe('Navigation Integration', () => {
        beforeEach(() => {
            orderStatusService.getOrderStatuses.and.returnValue(of(mockOrderStatusesResponse));
            adminOrderService.getOrders.and.returnValue(of(mockPaginatedResponse));
        });

        it('should navigate to order detail while maintaining current page', () => {
            component.currentPage = 3;

            component.goToOrderDetail('order-123');

            expect(router.navigate).toHaveBeenCalledWith(['/admin/orders', 'order-123']);
            expect(component.currentPage).toBe(3); // Should maintain current page
        });
    });

    describe('Status Loading Integration', () => {
        it('should load order statuses on component initialization', () => {
            orderStatusService.getOrderStatuses.and.returnValue(of(mockOrderStatusesResponse));
            adminOrderService.getOrders.and.returnValue(of(mockPaginatedResponse));

            fixture.detectChanges();

            expect(orderStatusService.getOrderStatuses).toHaveBeenCalled();
            expect(component.allOrderStatuses.length).toBe(1);
            expect(component.allOrderStatuses[0]).toEqual(mockOrderStatus);
        });

        it('should handle array response format for order statuses', () => {
            orderStatusService.getOrderStatuses.and.returnValue(of([mockOrderStatus] as any));
            adminOrderService.getOrders.and.returnValue(of(mockPaginatedResponse));

            fixture.detectChanges();

            expect(component.allOrderStatuses.length).toBe(1);
            expect(component.allOrderStatuses[0]).toEqual(mockOrderStatus);
        });
    });

    describe('Payment Verification Functionality', () => {
        // Mock data adicional para tests de verificación
        const mockApprovedStatus: IOrderStatus = {
            _id: 'status-approved',
            code: 'APPROVED',
            name: 'Aprobado',
            description: 'Pago aprobado',
            color: '#28A745',
            priority: 3,
            isActive: true,
            isDefault: false,
            isFinal: true,
            allowedTransitions: []
        };

        const mockPendingStatus: IOrderStatus = {
            _id: 'status-pending',
            code: 'PENDING',
            name: 'Pendiente',
            description: 'Pago pendiente',
            color: '#FFC107',
            priority: 1,
            isActive: true,
            isDefault: true,
            isFinal: false,
            allowedTransitions: ['status-approved']
        };

        const mockOrderPending: IOrder = {
            ...mockOrder,
            id: 'order-pending',
            status: mockPendingStatus
        };

        const mockOrderApproved: IOrder = {
            ...mockOrder,
            id: 'order-approved',
            status: mockApprovedStatus
        };

        beforeEach(async () => {
            orderStatusService.getOrderStatuses.and.returnValue(of({
                total: 2,
                orderStatuses: [mockPendingStatus, mockApprovedStatus]
            }));
            adminOrderService.getOrders.and.returnValue(of({
                orders: [mockOrderPending, mockOrderApproved],
                total: 2
            }));
            fixture.detectChanges();
            await fixture.whenStable(); // Esperar que la carga asíncrona termine
        });

        describe('verifyPaymentManually method', () => {
            it('should not proceed if order id is missing', () => {
                const orderWithoutId = { ...mockOrderPending, id: '' };

                component.verifyPaymentManually(orderWithoutId);

                expect(paymentVerificationService.manualVerifyAndUpdate).not.toHaveBeenCalled();
                expect(component.isVerifyingPayment['']).toBeUndefined();
            });

            it('should not proceed if verification is already in progress', () => {
                component.isVerifyingPayment[mockOrderPending.id] = true;

                component.verifyPaymentManually(mockOrderPending);

                expect(paymentVerificationService.manualVerifyAndUpdate).not.toHaveBeenCalled();
            });

            it('should set loading state during verification', () => {
                const subject = new Subject<any>();
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(subject.asObservable());

                expect(component.isVerifyingPayment[mockOrderPending.id]).toBeFalsy();

                component.verifyPaymentManually(mockOrderPending);

                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(true);
                expect(paymentVerificationService.manualVerifyAndUpdate).toHaveBeenCalledWith(mockOrderPending.id);

                subject.next({ success: true });
                subject.complete();

                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(false);
            });

            it('should call payment verification service with correct order id', () => {
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(of({ success: true }));

                component.verifyPaymentManually(mockOrderPending);

                expect(paymentVerificationService.manualVerifyAndUpdate).toHaveBeenCalledWith(mockOrderPending.id);
            });

            it('should handle verification error and show error notification', () => {
                const errorResponse = {
                    error: { error: 'Payment verification failed' }
                };
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(throwError(errorResponse));

                component.verifyPaymentManually(mockOrderPending);

                expect(notificationService.showError).toHaveBeenCalledWith(
                    `❌ Error al verificar el pago del pedido #${mockOrderPending.id.slice(0, 8)}: Payment verification failed`,
                    'Error de Verificación'
                );
                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(false);
            });

            it('should handle verification error without specific error message', () => {
                const errorResponse = {};
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(throwError(errorResponse));

                component.verifyPaymentManually(mockOrderPending);

                expect(notificationService.showError).toHaveBeenCalledWith(
                    `❌ Error al verificar el pago del pedido #${mockOrderPending.id.slice(0, 8)}: No se pudo verificar el estado del pago.`,
                    'Error de Verificación'
                );
            });
        });

        describe('reloadOrderAndNotify method - Status Change Scenarios', () => {
            it('should show success notification when status changes from pending to approved', () => {
                const updatedOrder = { ...mockOrderPending, status: mockApprovedStatus };
                const updatedResponse = {
                    orders: [updatedOrder, mockOrderApproved],
                    total: 2
                };

                adminOrderService.getOrders.and.returnValue(of(updatedResponse));
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(of({ success: true }));

                component.verifyPaymentManually(mockOrderPending);

                expect(notificationService.showSuccess).toHaveBeenCalledWith(
                    `✅ Estado actualizado del pedido #${mockOrderPending.id.slice(0, 8)}: Pendiente → Aprobado`,
                    'Verificación Exitosa'
                );
            });

            it('should show success notification when status changes from approved to pending', () => {
                const updatedOrder = { ...mockOrderApproved, status: mockPendingStatus };
                const updatedResponse = {
                    orders: [updatedOrder, mockOrderPending],
                    total: 2
                };

                adminOrderService.getOrders.and.returnValue(of(updatedResponse));
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(of({ success: true }));

                component.verifyPaymentManually(mockOrderApproved);

                expect(notificationService.showSuccess).toHaveBeenCalledWith(
                    `✅ Estado actualizado del pedido #${mockOrderApproved.id.slice(0, 8)}: Aprobado → Pendiente`,
                    'Verificación Exitosa'
                );
            });

            it('should show info notification when status does not change', () => {
                const unchangedResponse = {
                    orders: [mockOrderPending, mockOrderApproved],
                    total: 2
                };

                adminOrderService.getOrders.and.returnValue(of(unchangedResponse));
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(of({ success: true }));

                component.verifyPaymentManually(mockOrderPending);

                expect(notificationService.showInfo).toHaveBeenCalledWith(
                    `ℹ️ Verificación completada para pedido #${mockOrderPending.id.slice(0, 8)}. El estado se mantiene: Pendiente`,
                    'Sin Cambios'
                );
            });

            it('should handle case when order is not found after verification', () => {
                const responseWithoutOrder = {
                    orders: [mockOrderApproved], // Sin el pedido que se verificó
                    total: 1
                };

                adminOrderService.getOrders.and.returnValue(of(responseWithoutOrder));
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(of({ success: true }));

                component.verifyPaymentManually(mockOrderPending);

                expect(notificationService.showSuccess).toHaveBeenCalledWith(
                    `✅ Verificación completada para pedido #${mockOrderPending.id.slice(0, 8)}`,
                    'Verificación Exitosa'
                );
            });

            it('should handle error when reloading orders after verification', () => {
                const reloadError = { error: { error: 'Failed to reload orders' } };
                adminOrderService.getOrders.and.returnValue(throwError(reloadError));
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(of({ success: true }));

                component.verifyPaymentManually(mockOrderPending);

                expect(notificationService.showWarning).toHaveBeenCalledWith(
                    `⚠️ Verificación completada, pero no se pudo actualizar la vista. Recarga la página para ver cambios.`,
                    'Advertencia'
                );
            });
        });

        describe('Status Change Edge Cases', () => {
            it('should handle order with undefined status', () => {
                const orderWithUndefinedStatus = { ...mockOrderPending, status: undefined as any };
                const responseWithChangedOrder = {
                    orders: [{ ...orderWithUndefinedStatus, status: mockApprovedStatus }],
                    total: 1
                };

                adminOrderService.getOrders.and.returnValue(of(responseWithChangedOrder));
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(of({ success: true }));

                component.verifyPaymentManually(orderWithUndefinedStatus);

                expect(notificationService.showSuccess).toHaveBeenCalledWith(
                    jasmine.stringContaining('Desconocido → Aprobado'),
                    'Verificación Exitosa'
                );
            });

            it('should handle order with null status', () => {
                const orderWithNullStatus = { ...mockOrderPending, status: null as any };
                const responseWithChangedOrder = {
                    orders: [{ ...orderWithNullStatus, status: mockApprovedStatus }],
                    total: 1
                };

                adminOrderService.getOrders.and.returnValue(of(responseWithChangedOrder));
                paymentVerificationService.manualVerifyAndUpdate.and.returnValue(of({ success: true }));

                component.verifyPaymentManually(orderWithNullStatus);

                expect(notificationService.showSuccess).toHaveBeenCalledWith(
                    jasmine.stringContaining('Desconocido → Aprobado'),
                    'Verificación Exitosa'
                );
            });

            it('should handle verification of multiple orders simultaneously', () => {
                const subject1 = new Subject<any>();
                const subject2 = new Subject<any>();

                paymentVerificationService.manualVerifyAndUpdate.and.returnValues(
                    subject1.asObservable(),
                    subject2.asObservable()
                );

                // Verificar primer pedido
                component.verifyPaymentManually(mockOrderPending);
                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(true);

                // Verificar segundo pedido
                component.verifyPaymentManually(mockOrderApproved);
                expect(component.isVerifyingPayment[mockOrderApproved.id]).toBe(true);

                // Ambos deberían estar en estado de verificación
                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(true);
                expect(component.isVerifyingPayment[mockOrderApproved.id]).toBe(true);

                expect(paymentVerificationService.manualVerifyAndUpdate).toHaveBeenCalledTimes(2);

                // Limpiar los subjects para evitar memory leaks
                subject1.complete();
                subject2.complete();
            });
        });

        describe('UI State Management', () => {
            it('should initialize isVerifyingPayment as empty object', () => {
                expect(component.isVerifyingPayment).toEqual({});
            });

            it('should maintain verification state per order id', () => {
                const subject1 = new Subject<any>();
                const subject2 = new Subject<any>();

                paymentVerificationService.manualVerifyAndUpdate.and.returnValues(
                    subject1.asObservable(),
                    subject2.asObservable()
                );

                // Iniciar verificación del primer pedido
                component.verifyPaymentManually(mockOrderPending);
                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(true);
                expect(component.isVerifyingPayment[mockOrderApproved.id]).toBeFalsy();

                // Iniciar verificación del segundo pedido
                component.verifyPaymentManually(mockOrderApproved);
                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(true);
                expect(component.isVerifyingPayment[mockOrderApproved.id]).toBe(true);

                // Completar primer pedido
                subject1.next({ success: true });
                subject1.complete();
                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(false);
                expect(component.isVerifyingPayment[mockOrderApproved.id]).toBe(true);

                // Completar segundo pedido
                subject2.next({ success: true });
                subject2.complete();
                expect(component.isVerifyingPayment[mockOrderPending.id]).toBe(false);
                expect(component.isVerifyingPayment[mockOrderApproved.id]).toBe(false);
            });
        });

        describe('Integration with existing functionality', () => {
            it('should not interfere with status update functionality', () => {
                const statusUpdatePayload = { statusId: 'new-status-id' };
                adminOrderService.updateOrderStatus.and.returnValue(of(mockOrderApproved));

                // Verificar que la verificación de pago no interfiere con actualización de estado
                component.onStatusChangeById(mockOrderPending, 'new-status-id');

                expect(adminOrderService.updateOrderStatus).toHaveBeenCalledWith(
                    mockOrderPending.id,
                    statusUpdatePayload
                );
            });

            it('should not interfere with pagination functionality', () => {
                const paginationResponse = {
                    orders: [mockOrderPending],
                    total: 1
                };
                adminOrderService.getOrders.and.returnValue(of(paginationResponse));

                component.loadPage(2);

                expect(adminOrderService.getOrders).toHaveBeenCalledWith({
                    page: 2,
                    limit: 10
                });
            });

            it('should not interfere with order detail navigation', () => {
                component.goToOrderDetail(mockOrderPending.id);

                expect(router.navigate).toHaveBeenCalledWith(['/admin/orders', mockOrderPending.id]);
            });
        });
    });
});
