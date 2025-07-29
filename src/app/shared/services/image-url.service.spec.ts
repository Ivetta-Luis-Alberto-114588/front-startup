// src/app/shared/services/image-url.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ImageUrlService } from './image-url.service';
import { environment } from 'src/environments/environment';

describe('ImageUrlService', () => {
    let service: ImageUrlService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ImageUrlService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getProductImageUrl', () => {
        it('should return placeholder when imgUrl is null or undefined', () => {
            expect(service.getProductImageUrl(null as any)).toBe('assets/placeholder.png');
            expect(service.getProductImageUrl(undefined)).toBe('assets/placeholder.png');
            expect(service.getProductImageUrl('')).toBe('assets/placeholder.png');
        });

        it('should return the same URL when it is already absolute', () => {
            const absoluteUrl = 'https://example.com/image.jpg';
            expect(service.getProductImageUrl(absoluteUrl)).toBe(absoluteUrl);

            const httpUrl = 'http://example.com/image.jpg';
            expect(service.getProductImageUrl(httpUrl)).toBe(httpUrl);
        });

        it('should prepend backend URL when imgUrl starts with /', () => {
            const relativeUrl = '/uploads/product1.jpg';
            const expected = `${environment.apiUrl}${relativeUrl}`;
            expect(service.getProductImageUrl(relativeUrl)).toBe(expected);
        });

        it('should construct URL with /uploads/ prefix when imgUrl has no slash', () => {
            const filename = 'product1.jpg';
            const expected = `${environment.apiUrl}/uploads/${filename}`;
            expect(service.getProductImageUrl(filename)).toBe(expected);
        });
    });

    describe('getPlaceholderUrl', () => {
        it('should return the default placeholder URL', () => {
            expect(service.getPlaceholderUrl()).toBe('assets/placeholder.png');
        });
    });

    describe('isValidImageUrl', () => {
        it('should return true for valid URLs', () => {
            expect(service.isValidImageUrl('https://example.com/image.jpg')).toBe(true);
            expect(service.isValidImageUrl('http://example.com/image.jpg')).toBe(true);
        });

        it('should return false for invalid URLs', () => {
            expect(service.isValidImageUrl('invalid-url')).toBe(false);
            expect(service.isValidImageUrl('')).toBe(false);
        });
    });
});
