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
import { IOrder } from 'src/app/features/orders/models/iorder';
import { IOrderStatus, IOrderStatusesResponse } from 'src/app/shared/models/iorder-status';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

describe('Admin OrderListComponent - Pagination Tests', () => {
    let component: OrderListComponent;
    let fixture: ComponentFixture<OrderListComponent>;
    let adminOrderService: jasmine.SpyObj<AdminOrderService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let orderStatusService: jasmine.SpyObj<OrderStatusService>;
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
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning']);
        const orderStatusServiceSpy = jasmine.createSpyObj('OrderStatusService', ['getOrderStatuses']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']); await TestBed.configureTestingModule({
            declarations: [OrderListComponent],
            imports: [NgbPaginationModule, FormsModule],
            providers: [
                { provide: AdminOrderService, useValue: adminOrderServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: OrderStatusService, useValue: orderStatusServiceSpy },
                { provide: Router, useValue: routerSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(OrderListComponent);
        component = fixture.componentInstance;
        adminOrderService = TestBed.inject(AdminOrderService) as jasmine.SpyObj<AdminOrderService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        orderStatusService = TestBed.inject(OrderStatusService) as jasmine.SpyObj<OrderStatusService>;
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

        it('should load first page on component initialization', () => {
            fixture.detectChanges();

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
});
