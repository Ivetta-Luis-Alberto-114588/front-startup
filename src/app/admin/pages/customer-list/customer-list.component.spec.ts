import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CustomerListComponent } from './customer-list.component';
import { AdminCustomerService, PaginatedAdminCustomersResponse } from '../../services/admin-customer.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { RoleService } from 'src/app/shared/services/role.service';
import { ICustomer } from 'src/app/features/customers/models/icustomer';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

describe('Admin CustomerListComponent - Pagination Tests', () => {
    let component: CustomerListComponent;
    let fixture: ComponentFixture<CustomerListComponent>;
    let adminCustomerService: jasmine.SpyObj<AdminCustomerService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let roleService: jasmine.SpyObj<RoleService>;
    let router: jasmine.SpyObj<Router>;
    let modalService: jasmine.SpyObj<NgbModal>;

    // Mock data
    const mockNeighborhood = {
        id: 'neigh-1',
        name: 'La Mariscal',
        city: { id: 'city-1', name: 'Quito' }
    };

    const mockCustomer: ICustomer = {
        id: 'cust-1',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+593987654321',
        address: 'Av. Principal 123',
        neighborhood: mockNeighborhood as any,
        userId: null,
        isActive: true
    };

    const mockCustomers: ICustomer[] = Array.from({ length: 35 }, (_, i) => ({
        ...mockCustomer,
        id: `cust-${i + 1}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`
    }));

    const mockPaginatedResponse: PaginatedAdminCustomersResponse = {
        customers: mockCustomers.slice(0, 10),
        total: 35
    };

    beforeEach(async () => {
        const adminCustomerServiceSpy = jasmine.createSpyObj('AdminCustomerService', ['getCustomers', 'deleteCustomer']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning']);
        const roleServiceSpy = jasmine.createSpyObj('RoleService', ['canUpdate', 'canDelete', 'canEdit', 'isSuperAdmin']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);

        await TestBed.configureTestingModule({
            declarations: [CustomerListComponent],
            imports: [NgbPaginationModule, HttpClientTestingModule],
            providers: [
                { provide: AdminCustomerService, useValue: adminCustomerServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: RoleService, useValue: roleServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: NgbModal, useValue: modalServiceSpy }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(CustomerListComponent);
        component = fixture.componentInstance;
        adminCustomerService = TestBed.inject(AdminCustomerService) as jasmine.SpyObj<AdminCustomerService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        roleService = TestBed.inject(RoleService) as jasmine.SpyObj<RoleService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

        // Configurar valores por defecto para RoleService
        roleService.canUpdate.and.returnValue(of(true));
        roleService.canDelete.and.returnValue(of(true));
        roleService.canEdit.and.returnValue(of(true));
        roleService.isSuperAdmin.and.returnValue(of(true));
    });
    describe('Pagination Functionality', () => {
        beforeEach(() => {
            // Mock the service to return paginated response
            adminCustomerService.getCustomers.and.returnValue(of(mockPaginatedResponse));
        });

        it('should initialize with correct pagination defaults', () => {
            expect(component.currentPage).toBe(1);
            expect(component.itemsPerPage).toBe(10);
            expect(component.totalItems).toBe(0);
        });

        it('should load first page on component initialization', () => {
            fixture.detectChanges();

            expect(adminCustomerService.getCustomers).toHaveBeenCalledWith({
                page: 1,
                limit: 10
            });
            expect(component.customers.length).toBe(10);
            expect(component.currentPage).toBe(1);
        });

        it('should load page 2 when loadPage(2) is called', () => {
            // Mock page 2 response
            const page2Response: PaginatedAdminCustomersResponse = {
                customers: mockCustomers.slice(10, 20),
                total: 35
            };
            adminCustomerService.getCustomers.and.returnValue(of(page2Response));

            component.loadPage(2);

            expect(component.currentPage).toBe(2);
            expect(adminCustomerService.getCustomers).toHaveBeenCalledWith({
                page: 2,
                limit: 10
            });
            expect(component.customers.length).toBe(10);
        });

        it('should not reload same page when loadPage is called with current page', () => {
            fixture.detectChanges();
            adminCustomerService.getCustomers.calls.reset();

            component.loadPage(1); // Already on page 1

            expect(adminCustomerService.getCustomers).not.toHaveBeenCalled();
        });

        it('should not load page when component is loading', () => {
            component.isLoading = true;
            adminCustomerService.getCustomers.calls.reset();

            component.loadPage(2);

            expect(adminCustomerService.getCustomers).not.toHaveBeenCalled();
            expect(component.currentPage).toBe(1); // Should remain unchanged
        });

        it('should handle pagination with different page sizes', () => {
            component.itemsPerPage = 5;

            component.loadPage(3);

            expect(adminCustomerService.getCustomers).toHaveBeenCalledWith({
                page: 3,
                limit: 5
            });
        });

        it('should handle error when loading page fails', () => {
            const errorResponse = { error: { error: 'Server error' } };
            adminCustomerService.getCustomers.and.returnValue(throwError(errorResponse));

            component.loadPage(2);

            expect(component.error).toBe('No se pudieron cargar los clientes.');
            expect(notificationService.showError).toHaveBeenCalledWith(
                'No se pudieron cargar los clientes.',
                'Error'
            );
            expect(component.currentPage).toBe(2);
        }); it('should update isLoading state during pagination', async () => {
            const subject = new Subject<PaginatedAdminCustomersResponse>();
            adminCustomerService.getCustomers.and.returnValue(subject.asObservable());

            expect(component.isLoading).toBe(false);

            component.loadPage(2);

            expect(component.isLoading).toBe(true);

            const page2Response: PaginatedAdminCustomersResponse = {
                customers: mockCustomers.slice(10, 20),
                total: 35
            };

            subject.next(page2Response);
            subject.complete();

            expect(component.isLoading).toBe(false);
        }); it('should handle different response formats correctly', () => {
            // Test structured response format (expected)
            const structuredResponse: PaginatedAdminCustomersResponse = {
                customers: mockCustomers.slice(0, 10),
                total: 35
            };
            adminCustomerService.getCustomers.and.returnValue(of(structuredResponse));

            component.loadCustomers();

            expect(component.customers).toEqual(structuredResponse.customers);
            expect(component.totalItems).toBe(35);
        });

        it('should handle empty results on pagination', () => {
            const emptyResponse: PaginatedAdminCustomersResponse = {
                customers: [],
                total: 0
            };
            adminCustomerService.getCustomers.and.returnValue(of(emptyResponse));

            component.loadPage(1);

            expect(component.customers).toEqual([]);
            expect(component.totalItems).toBe(0);
        });

        it('should reset error state when loading new page', () => {
            component.error = 'Previous error';

            component.loadPage(2);

            expect(component.error).toBeNull();
        }); it('should handle service error', () => {
            const errorResponse = { error: { message: 'Server error' } };
            adminCustomerService.getCustomers.and.returnValue(throwError(errorResponse));

            component.loadCustomers();

            expect(component.customers).toEqual([]);
            expect(component.totalItems).toBe(0);
            expect(component.error).toBe('No se pudieron cargar los clientes.');
            expect(notificationService.showError).toHaveBeenCalledWith(
                'No se pudieron cargar los clientes.',
                'Error'
            );
        });

        it('should calculate correct pagination parameters for different pages', () => {
            // Test page 1
            component.currentPage = 1;
            component.loadCustomers();
            expect(adminCustomerService.getCustomers).toHaveBeenCalledWith({ page: 1, limit: 10 });

            // Test page 4
            component.currentPage = 4;
            component.loadCustomers();
            expect(adminCustomerService.getCustomers).toHaveBeenCalledWith({ page: 4, limit: 10 });

            // Test with different itemsPerPage
            component.itemsPerPage = 15;
            component.currentPage = 2;
            component.loadCustomers();
            expect(adminCustomerService.getCustomers).toHaveBeenCalledWith({ page: 2, limit: 15 });
        });
    });
    describe('Integration with Delete Functionality', () => {
        beforeEach(() => {
            adminCustomerService.getCustomers.and.returnValue(of(mockPaginatedResponse));
            adminCustomerService.deleteCustomer.and.returnValue(of(mockCustomer));
        });

        it('should reload customers after successful deletion', () => {
            fixture.detectChanges();
            adminCustomerService.getCustomers.calls.reset();

            component.confirmDelete('cust-1');

            expect(adminCustomerService.deleteCustomer).toHaveBeenCalledWith('cust-1');
            expect(adminCustomerService.getCustomers).toHaveBeenCalled(); // Should reload
        });

        it('should maintain current page when deleting customers', () => {
            component.currentPage = 3;
            fixture.detectChanges();

            component.confirmDelete('cust-1');

            expect(component.currentPage).toBe(3);
        });

        it('should show warning for customers with user accounts', () => {
            const customerWithUser = { ...mockCustomer, userId: 'user-123' };

            component.openDeleteConfirmation(customerWithUser);

            expect(notificationService.showWarning).toHaveBeenCalledWith(
                'No se pueden eliminar clientes que son usuarios registrados. Elimina la cuenta de usuario primero.',
                'Acción No Permitida'
            );
            expect(modalService.open).not.toHaveBeenCalled();
        });
    });
});
