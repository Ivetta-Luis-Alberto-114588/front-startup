import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminUserService, PaginatedAdminUsersResponse, UpdateAdminUserData } from './admin-user.service';
import { RoleService } from 'src/app/shared/services/role.service';
import { IUser } from 'src/app/shared/models/iuser';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { environment } from 'src/environments/environment';
import { of, throwError } from 'rxjs';

describe('AdminUserService', () => {
    let service: AdminUserService;
    let httpMock: HttpTestingController;
    let roleService: jasmine.SpyObj<RoleService>;
    let baseUrl: string;

    // Mock data
    const mockUser: IUser = {
        id: 'user123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        roles: ['USER_ROLE'],
        img: 'avatar.jpg',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        __v: 0
    };

    const mockAdmin: IUser = {
        id: 'admin456',
        name: 'Jane Admin',
        email: 'jane.admin@example.com',
        roles: ['USER_ROLE', 'ADMIN_ROLE'],
        img: 'admin-avatar.jpg',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        __v: 0
    };

    const mockUsers: IUser[] = [mockUser, mockAdmin];

    const mockPaginatedResponse: PaginatedAdminUsersResponse = {
        total: 2,
        users: mockUsers
    };

    beforeEach(() => {
        const roleServiceSpy = jasmine.createSpyObj('RoleService', ['canUpdate', 'canDelete', 'isSuperAdmin']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AdminUserService,
                { provide: RoleService, useValue: roleServiceSpy }
            ]
        });

        service = TestBed.inject(AdminUserService);
        httpMock = TestBed.inject(HttpTestingController);
        roleService = TestBed.inject(RoleService) as jasmine.SpyObj<RoleService>;
        baseUrl = `${environment.apiUrl}/api/admin/users`;

        // Por defecto, configuramos permisos como true para los tests
        roleService.canUpdate.and.returnValue(of(true));
        roleService.canDelete.and.returnValue(of(true));
        roleService.isSuperAdmin.and.returnValue(of(true));
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getUsers', () => {
        it('should retrieve users with pagination', () => {
            // Arrange
            const pagination: PaginationDto = { page: 1, limit: 10 };

            // Act
            service.getUsers(pagination).subscribe(response => {
                expect(response).toEqual([mockPaginatedResponse]);
                expect(response[0].total).toBe(2);
                expect(response[0].users.length).toBe(2);
                expect(response[0].users[0].email).toBe('john.doe@example.com');
                expect(response[0].users[1].roles).toContain('ADMIN_ROLE');
            });

            // Assert
            const req = httpMock.expectOne(request => {
                return request.url === baseUrl &&
                    request.method === 'GET' &&
                    request.params.get('page') === '1' &&
                    request.params.get('limit') === '10';
            });

            req.flush([mockPaginatedResponse]);
        });

        it('should handle different pagination parameters', () => {
            // Arrange
            const pagination: PaginationDto = { page: 3, limit: 25 };

            // Act
            service.getUsers(pagination).subscribe(response => {
                expect(response).toBeDefined();
            });

            // Assert
            const req = httpMock.expectOne(request => {
                return request.url === baseUrl &&
                    request.method === 'GET' &&
                    request.params.get('page') === '3' &&
                    request.params.get('limit') === '25';
            });

            req.flush([{ total: 0, users: [] }]);
        });

        it('should handle empty users list', () => {
            // Arrange
            const pagination: PaginationDto = { page: 1, limit: 10 };
            const emptyResponse: PaginatedAdminUsersResponse = { total: 0, users: [] };

            // Act
            service.getUsers(pagination).subscribe(response => {
                expect(response[0].total).toBe(0);
                expect(response[0].users).toEqual([]);
            });

            // Assert
            const req = httpMock.expectOne(request => {
                return request.url === baseUrl &&
                    request.method === 'GET';
            });

            req.flush([emptyResponse]);
        });

        it('should handle large pagination numbers', () => {
            // Arrange
            const pagination: PaginationDto = { page: 999, limit: 1000 };

            // Act
            service.getUsers(pagination).subscribe(response => {
                expect(response).toBeDefined();
            });

            // Assert
            const req = httpMock.expectOne(request => {
                return request.params.get('page') === '999' &&
                    request.params.get('limit') === '1000';
            });

            req.flush([{ total: 0, users: [] }]);
        });
    });

    describe('getUserById', () => {
        it('should retrieve a specific user by ID', () => {
            // Arrange
            const userId = 'user123';

            // Act
            service.getUserById(userId).subscribe(user => {
                expect(user).toEqual(mockUser);
                expect(user.id).toBe(userId);
                expect(user.name).toBe('John Doe');
                expect(user.email).toBe('john.doe@example.com');
                expect(user.roles).toEqual(['USER_ROLE']);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            expect(req.request.method).toBe('GET');

            req.flush(mockUser);
        });

        it('should handle admin user retrieval', () => {
            // Arrange
            const adminId = 'admin456';

            // Act
            service.getUserById(adminId).subscribe(user => {
                expect(user).toEqual(mockAdmin);
                expect(user.roles).toContain('ADMIN_ROLE');
                expect(user.roles).toContain('USER_ROLE');
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${adminId}`);
            expect(req.request.method).toBe('GET');

            req.flush(mockAdmin);
        });

        it('should handle user not found (404)', () => {
            // Arrange
            const userId = 'nonexistent';
            let errorResponse: any;

            // Act
            service.getUserById(userId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });

            expect(errorResponse.status).toBe(404);
        });

        it('should handle empty or invalid user ID', () => {
            // Arrange
            const invalidId = '';

            // Act
            service.getUserById(invalidId).subscribe({
                next: (user) => {
                    // This might succeed with an empty response or fail - depends on backend
                    expect(user).toBeDefined();
                }
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/`);
            req.flush(null);
        });
    });

    describe('updateUser', () => {
        it('should update user roles successfully', () => {
            // Arrange
            const userId = 'user123';
            const updateData: UpdateAdminUserData = {
                roles: ['USER_ROLE', 'ADMIN_ROLE']
            };
            const updatedUser: IUser = {
                ...mockUser,
                roles: ['USER_ROLE', 'ADMIN_ROLE'],
                updatedAt: '2023-12-01T00:00:00.000Z'
            };

            // Act
            service.updateUser(userId, updateData).subscribe(user => {
                expect(user).toEqual(updatedUser);
                expect(user.roles).toContain('ADMIN_ROLE');
                expect(user.roles).toContain('USER_ROLE');
                expect(user.updatedAt).not.toBe(mockUser.updatedAt);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(updateData);

            req.flush(updatedUser);
        });

        it('should update user name', () => {
            // Arrange
            const userId = 'user123';
            const updateData: UpdateAdminUserData = {
                name: 'John Updated'
            };
            const updatedUser: IUser = {
                ...mockUser,
                name: 'John Updated',
                updatedAt: '2023-12-01T00:00:00.000Z'
            };

            // Act
            service.updateUser(userId, updateData).subscribe(user => {
                expect(user.name).toBe('John Updated');
                expect(user.email).toBe(mockUser.email); // Should remain unchanged
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(updateData);

            req.flush(updatedUser);
        });

        it('should update user active status', () => {
            // Arrange
            const userId = 'user123';
            const updateData: UpdateAdminUserData = {
                isActive: false
            };
            const updatedUser: IUser = {
                ...mockUser,
                updatedAt: '2023-12-01T00:00:00.000Z'
            };

            // Act
            service.updateUser(userId, updateData).subscribe(user => {
                expect(user).toEqual(updatedUser);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(updateData);

            req.flush(updatedUser);
        });

        it('should update multiple fields at once', () => {
            // Arrange
            const userId = 'user123';
            const updateData: UpdateAdminUserData = {
                name: 'John Admin',
                roles: ['USER_ROLE', 'ADMIN_ROLE'],
                isActive: true
            };
            const updatedUser: IUser = {
                ...mockUser,
                name: 'John Admin',
                roles: ['USER_ROLE', 'ADMIN_ROLE'],
                updatedAt: '2023-12-01T00:00:00.000Z'
            };

            // Act
            service.updateUser(userId, updateData).subscribe(user => {
                expect(user.name).toBe('John Admin');
                expect(user.roles).toEqual(['USER_ROLE', 'ADMIN_ROLE']);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            expect(req.request.body).toEqual(updateData);

            req.flush(updatedUser);
        });

        it('should handle update with empty data', () => {
            // Arrange
            const userId = 'user123';
            const updateData: UpdateAdminUserData = {};

            // Act
            service.updateUser(userId, updateData).subscribe(user => {
                expect(user).toEqual(mockUser); // Should return unchanged user
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            expect(req.request.body).toEqual({});

            req.flush(mockUser);
        });

        it('should handle validation errors (400)', () => {
            // Arrange
            const userId = 'user123';
            const invalidData: UpdateAdminUserData = {
                roles: ['INVALID_ROLE']
            };
            let errorResponse: any;

            // Act
            service.updateUser(userId, invalidData).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            req.flush({
                message: 'Invalid role specified',
                errors: ['INVALID_ROLE is not a valid role']
            }, { status: 400, statusText: 'Bad Request' });

            expect(errorResponse.status).toBe(400);
        });

        it('should handle user not found during update (404)', () => {
            // Arrange
            const userId = 'nonexistent';
            const updateData: UpdateAdminUserData = { name: 'New Name' };
            let errorResponse: any;

            // Act
            service.updateUser(userId, updateData).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });

            expect(errorResponse.status).toBe(404);
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', () => {
            // Arrange
            const userId = 'user123';

            // Act
            service.deleteUser(userId).subscribe(deletedUser => {
                expect(deletedUser).toEqual(mockUser);
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            expect(req.request.method).toBe('DELETE');

            req.flush(mockUser);
        });

        it('should handle user not found during deletion (404)', () => {
            // Arrange
            const userId = 'nonexistent';
            let errorResponse: any;

            // Act
            service.deleteUser(userId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });

            expect(errorResponse.status).toBe(404);
        });

        it('should handle forbidden deletion (403) - cannot delete admin', () => {
            // Arrange
            const adminId = 'admin456';
            let errorResponse: any;

            // Act
            service.deleteUser(adminId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${adminId}`);
            req.flush({
                message: 'Cannot delete admin user'
            }, { status: 403, statusText: 'Forbidden' });

            expect(errorResponse.status).toBe(403);
        });

        it('should handle deletion of user with dependencies (409)', () => {
            // Arrange
            const userId = 'user-with-orders';
            let errorResponse: any;

            // Act
            service.deleteUser(userId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            req.flush({
                message: 'Cannot delete user with existing orders',
                conflictType: 'HAS_ORDERS'
            }, { status: 409, statusText: 'Conflict' });

            expect(errorResponse.status).toBe(409);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle network errors gracefully', () => {
            // Arrange
            const pagination: PaginationDto = { page: 1, limit: 10 };
            let errorResponse: any;

            // Act
            service.getUsers(pagination).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(request => {
                return request.url === baseUrl &&
                    request.method === 'GET';
            });
            req.error(new ErrorEvent('Network error'));

            expect(errorResponse).toBeTruthy();
        });

        it('should handle server errors (500)', () => {
            // Arrange
            const userId = 'user123';
            let errorResponse: any;

            // Act
            service.getUserById(userId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });

            expect(errorResponse.status).toBe(500);
        });

        it('should handle timeout errors', () => {
            // Arrange
            const userId = 'user123';
            let errorResponse: any;

            // Act
            service.getUserById(userId).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/${userId}`);
            req.error(new ErrorEvent('Timeout'), { status: 0, statusText: 'Timeout' });

            expect(errorResponse).toBeTruthy();
        });

        it('should handle malformed JSON responses', () => {
            // Arrange
            const pagination: PaginationDto = { page: 1, limit: 10 };
            let errorResponse: any;

            // Act
            service.getUsers(pagination).subscribe({
                next: () => fail('Should have failed'),
                error: (error) => errorResponse = error
            });

            // Assert
            const req = httpMock.expectOne(request => request.url === baseUrl);
            req.error(new ErrorEvent('Parse error'), { status: 0, statusText: 'Parse Error' });

            expect(errorResponse).toBeTruthy();
        });
    });

    describe('Permission Control Tests', () => {
        describe('Update Permissions', () => {
            it('should allow update when user has SUPER_ADMIN_ROLE', () => {
                // Arrange
                roleService.canUpdate.and.returnValue(of(true));
                roleService.isSuperAdmin.and.returnValue(of(true));

                const userId = 'user123';
                const updateData: UpdateAdminUserData = {
                    name: 'Updated Name'
                };
                const updatedUser: IUser = {
                    ...mockUser,
                    name: 'Updated Name',
                    updatedAt: '2023-12-01T00:00:00.000Z'
                };

                // Act
                service.updateUser(userId, updateData).subscribe(user => {
                    expect(user).toEqual(updatedUser);
                    expect(user.name).toBe('Updated Name');
                });

                // Assert
                const req = httpMock.expectOne(`${baseUrl}/${userId}`);
                expect(req.request.method).toBe('PUT');
                req.flush(updatedUser);
            });

            it('should deny update when user does not have SUPER_ADMIN_ROLE', () => {
                // Arrange
                roleService.canUpdate.and.returnValue(of(false));
                roleService.isSuperAdmin.and.returnValue(of(false));

                const userId = 'user123';
                const updateData: UpdateAdminUserData = {
                    name: 'Updated Name'
                };
                let errorResponse: any;

                // Act - El servicio verifica permisos antes de hacer la llamada HTTP
                service.updateUser(userId, updateData).subscribe({
                    next: () => fail('Should have failed due to insufficient permissions'),
                    error: (error) => errorResponse = error
                });

                // Assert - No debería hacer llamada HTTP ya que el servicio verifica permisos primero
                httpMock.expectNone(`${baseUrl}/${userId}`);
                expect(errorResponse.message).toContain('No tienes permisos para actualizar usuarios');
            });

            it('should handle role verification error during update', () => {
                // Arrange
                roleService.canUpdate.and.returnValue(throwError(() => new Error('Role verification failed')));
                roleService.isSuperAdmin.and.returnValue(of(false));

                const userId = 'user123';
                const updateData: UpdateAdminUserData = {
                    roles: ['USER_ROLE', 'ADMIN_ROLE']
                };
                let errorResponse: any;

                // Act
                service.updateUser(userId, updateData).subscribe({
                    next: () => fail('Should have failed'),
                    error: (error) => errorResponse = error
                });

                // Assert - No debería hacer llamada HTTP debido al error en verificación de roles
                httpMock.expectNone(`${baseUrl}/${userId}`);
                expect(errorResponse.message).toBe('Role verification failed');
            });
        });

        describe('Delete Permissions', () => {
            it('should allow delete when user has SUPER_ADMIN_ROLE', () => {
                // Arrange
                roleService.canDelete.and.returnValue(of(true));
                roleService.isSuperAdmin.and.returnValue(of(true));

                const userId = 'user123';

                // Act
                service.deleteUser(userId).subscribe(deletedUser => {
                    expect(deletedUser).toEqual(mockUser);
                });

                // Assert
                const req = httpMock.expectOne(`${baseUrl}/${userId}`);
                expect(req.request.method).toBe('DELETE');
                req.flush(mockUser);
            });

            it('should deny delete when user does not have SUPER_ADMIN_ROLE', () => {
                // Arrange
                roleService.canDelete.and.returnValue(of(false));
                roleService.isSuperAdmin.and.returnValue(of(false));

                const userId = 'user123';
                let errorResponse: any;

                // Act
                service.deleteUser(userId).subscribe({
                    next: () => fail('Should have failed due to insufficient permissions'),
                    error: (error) => errorResponse = error
                });

                // Assert - No debería hacer llamada HTTP ya que el servicio verifica permisos primero
                httpMock.expectNone(`${baseUrl}/${userId}`);
                expect(errorResponse.message).toContain('No tienes permisos para eliminar usuarios');
            });

            it('should handle role verification error during delete', () => {
                // Arrange
                roleService.canDelete.and.returnValue(throwError(() => new Error('Role verification failed')));
                roleService.isSuperAdmin.and.returnValue(of(false));

                const userId = 'user123';
                let errorResponse: any;

                // Act
                service.deleteUser(userId).subscribe({
                    next: () => fail('Should have failed'),
                    error: (error) => errorResponse = error
                });

                // Assert - No debería hacer llamada HTTP debido al error en verificación de roles
                httpMock.expectNone(`${baseUrl}/${userId}`);
                expect(errorResponse.message).toBe('Role verification failed');
            });

            it('should prevent deletion of another SUPER_ADMIN user', () => {
                // Arrange
                roleService.canDelete.and.returnValue(of(true));
                roleService.isSuperAdmin.and.returnValue(of(true));

                const superAdminId = 'super-admin-456';
                let errorResponse: any;

                // Act
                service.deleteUser(superAdminId).subscribe({
                    next: () => fail('Should have failed'),
                    error: (error) => errorResponse = error
                });

                // Assert
                const req = httpMock.expectOne(`${baseUrl}/${superAdminId}`);
                req.flush({
                    message: 'Cannot delete another SUPER_ADMIN user',
                    conflictType: 'SUPER_ADMIN_PROTECTION'
                }, { status: 409, statusText: 'Conflict' });

                expect(errorResponse.status).toBe(409);
            });
        });

        describe('Combined Permission Scenarios', () => {
            it('should verify SUPER_ADMIN role for both update and delete operations', () => {
                // Arrange
                roleService.canUpdate.and.returnValue(of(true));
                roleService.canDelete.and.returnValue(of(true));
                roleService.isSuperAdmin.and.returnValue(of(true));

                const userId = 'user123';
                const updateData: UpdateAdminUserData = {
                    roles: ['USER_ROLE', 'ADMIN_ROLE']
                };

                // Act & Assert - Update
                service.updateUser(userId, updateData).subscribe(user => {
                    expect(user).toBeDefined();
                });

                const updateReq = httpMock.expectOne(`${baseUrl}/${userId}`);
                expect(updateReq.request.method).toBe('PUT');
                updateReq.flush({ ...mockUser, roles: ['USER_ROLE', 'ADMIN_ROLE'] });

                // Act & Assert - Delete
                service.deleteUser(userId).subscribe(deletedUser => {
                    expect(deletedUser).toBeDefined();
                });

                const deleteReq = httpMock.expectOne(`${baseUrl}/${userId}`);
                expect(deleteReq.request.method).toBe('DELETE');
                deleteReq.flush(mockUser);

                // Verify that permission checks were called
                expect(roleService.canUpdate).toHaveBeenCalled();
                expect(roleService.canDelete).toHaveBeenCalled();
                // Note: isSuperAdmin may not be called directly by the service if it only uses canUpdate/canDelete
            });

            it('should handle mixed permission scenarios (can update but cannot delete)', () => {
                // Arrange
                roleService.canUpdate.and.returnValue(of(true));
                roleService.canDelete.and.returnValue(of(false));
                roleService.isSuperAdmin.and.returnValue(of(false));

                const userId = 'user123';
                const updateData: UpdateAdminUserData = {
                    name: 'Updated Name'
                };
                let deleteErrorResponse: any;

                // Act & Assert - Update (should work)
                service.updateUser(userId, updateData).subscribe(user => {
                    expect(user.name).toBe('Updated Name');
                });

                const updateReq = httpMock.expectOne(`${baseUrl}/${userId}`);
                updateReq.flush({ ...mockUser, name: 'Updated Name' });

                // Act & Assert - Delete (should fail at permission level)
                service.deleteUser(userId).subscribe({
                    next: () => fail('Should have failed'),
                    error: (error) => deleteErrorResponse = error
                });

                // No debería hacer llamada HTTP para delete ya que fallan los permisos
                httpMock.expectNone(`${baseUrl}/${userId}`);
                expect(deleteErrorResponse.message).toContain('No tienes permisos para eliminar usuarios');
            });
        });
    });

    describe('Data Validation and Edge Cases', () => {
        it('should handle users with minimal required fields only', () => {
            // Arrange
            const minimalUser: IUser = {
                id: 'minimal-user',
                name: 'Minimal User',
                email: 'minimal@example.com',
                roles: ['USER_ROLE']
                // No img, createdAt, updatedAt, __v
            };
            const pagination: PaginationDto = { page: 1, limit: 10 };

            // Act
            service.getUsers(pagination).subscribe(response => {
                expect(response[0].users[0]).toEqual(minimalUser);
                expect(response[0].users[0].img).toBeUndefined();
                expect(response[0].users[0].createdAt).toBeUndefined();
            });

            // Assert
            const req = httpMock.expectOne(request => request.url === baseUrl);
            req.flush([{ total: 1, users: [minimalUser] }]);
        });

        it('should handle users with multiple roles', () => {
            // Arrange
            const superAdminUser: IUser = {
                id: 'super-admin',
                name: 'Super Admin',
                email: 'super@example.com',
                roles: ['USER_ROLE', 'ADMIN_ROLE', 'SUPER_ADMIN_ROLE'],
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-01T00:00:00.000Z'
            };      // Act
            service.getUserById('super-admin').subscribe(user => {
                expect(user.roles.length).toBe(3);
                expect(user.roles).toContain('SUPER_ADMIN_ROLE');
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/super-admin`);
            req.flush(superAdminUser);
        });

        it('should handle very large pagination limits', () => {
            // Arrange
            const pagination: PaginationDto = { page: 1, limit: 10000 };

            // Act
            service.getUsers(pagination).subscribe(response => {
                expect(response).toBeDefined();
            });

            // Assert
            const req = httpMock.expectOne(request => {
                return request.params.get('limit') === '10000';
            });

            req.flush([{ total: 50000, users: [] }]);
        });

        it('should handle zero and negative pagination values', () => {
            // Arrange
            const pagination: PaginationDto = { page: 0, limit: -5 };

            // Act
            service.getUsers(pagination).subscribe(response => {
                expect(response).toBeDefined();
            });

            // Assert
            const req = httpMock.expectOne(request => {
                return request.params.get('page') === '0' &&
                    request.params.get('limit') === '-5';
            });

            req.flush([{ total: 0, users: [] }]);
        });

        it('should handle special characters in user data', () => {
            // Arrange
            const specialUser: IUser = {
                id: 'special-chars',
                name: 'José María Ñoño',
                email: 'josé.maría@exámple.com',
                roles: ['USER_ROLE']
            };

            // Act
            service.getUserById('special-chars').subscribe(user => {
                expect(user.name).toBe('José María Ñoño');
                expect(user.email).toBe('josé.maría@exámple.com');
            });

            // Assert
            const req = httpMock.expectOne(`${baseUrl}/special-chars`);
            req.flush(specialUser);
        });
    });
});
