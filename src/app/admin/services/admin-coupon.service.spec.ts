import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminCouponService, CouponFormData, PaginatedCouponsResponse } from './admin-coupon.service';
import { RoleService } from 'src/app/shared/services/role.service';
import { ICoupon, DiscountType } from 'src/app/shared/models/icoupon';
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';
import { environment } from 'src/environments/environment';
import { of } from 'rxjs';

describe('AdminCouponService', () => {
    let service: AdminCouponService;
    let httpMock: HttpTestingController;
    let roleService: jasmine.SpyObj<RoleService>;

    const baseUrl = `${environment.apiUrl}/api/admin/coupons`;
    
    const mockCoupon: ICoupon = {
        id: '1',
        code: 'TEST10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        description: 'Test coupon',
        isActive: true,
        validFrom: new Date('2023-01-01'),
        validUntil: new Date('2023-12-31'),
        minPurchaseAmount: 100,
        usageLimit: 50,
        timesUsed: 5,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
    };

    beforeEach(() => {
        const roleServiceSpy = jasmine.createSpyObj('RoleService', ['canUpdate', 'canDelete', 'isSuperAdmin']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AdminCouponService,
                { provide: RoleService, useValue: roleServiceSpy }
            ]
        });

        service = TestBed.inject(AdminCouponService);
        httpMock = TestBed.inject(HttpTestingController);
        roleService = TestBed.inject(RoleService) as jasmine.SpyObj<RoleService>;

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

    describe('getCoupons', () => {
        it('should retrieve coupons with pagination', () => {
            const pagination: PaginationDto = { page: 1, limit: 10 };

            service.getCoupons(pagination).subscribe(coupons => {
                expect(coupons).toEqual([mockCoupon]);
            });

            const req = httpMock.expectOne(request => {
                return request.url === baseUrl &&
                    request.method === 'GET' &&
                    request.params.get('page') === '1' &&
                    request.params.get('limit') === '10';
            });

            req.flush([mockCoupon]);
        });
    });

    describe('getCouponById', () => {
        it('should retrieve a coupon by ID', () => {
            const couponId = '1';

            service.getCouponById(couponId).subscribe(coupon => {
                expect(coupon).toEqual(mockCoupon);
            });

            const req = httpMock.expectOne(`${baseUrl}/${couponId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockCoupon);
        });
    });

    describe('createCoupon', () => {
        it('should create a new coupon', () => {
            const couponData: CouponFormData = {
                code: 'NEW10',
                discountType: 'percentage',
                discountValue: 10,
                description: 'New coupon',
                isActive: true
            };

            service.createCoupon(couponData).subscribe(coupon => {
                expect(coupon).toEqual(mockCoupon);
            });

            const req = httpMock.expectOne(baseUrl);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(couponData);
            req.flush(mockCoupon);
        });
    });

    describe('updateCoupon', () => {
        it('should update a coupon', () => {
            const couponId = '1';
            const updateData: Partial<CouponFormData> = { discountValue: 15 };

            service.updateCoupon(couponId, updateData).subscribe(coupon => {
                expect(coupon).toEqual(mockCoupon);
            });

            const req = httpMock.expectOne(`${baseUrl}/${couponId}`);
            expect(req.request.method).toBe('PUT');
            req.flush(mockCoupon);
        });
    });

    describe('deleteCoupon', () => {
        it('should delete a coupon', () => {
            const couponId = '1';

            service.deleteCoupon(couponId).subscribe(coupon => {
                expect(coupon).toEqual(mockCoupon);
            });

            const req = httpMock.expectOne(`${baseUrl}/${couponId}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(mockCoupon);
        });
    });
});
