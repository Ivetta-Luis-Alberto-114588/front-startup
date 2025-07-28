

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TelegramNotificationService } from './telegram-notification.service';
import { environment } from 'src/environments/environment';

describe('TelegramNotificationService', () => {
    let service: TelegramNotificationService;
    let httpMock: HttpTestingController;
    const telegramApiUrl = `${environment.apiUrl}/api/admin/telegram/send-notification`;

    beforeEach(() => {
        // Mock localStorage token
        spyOn(localStorage, 'getItem').and.callFake((key: string) => {
            if (key === 'token') return 'mock-token';
            return null;
        });

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TelegramNotificationService]
        });
        service = TestBed.inject(TelegramNotificationService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('debe enviar mensaje directo a Telegram correctamente (Observable)', () => {
        const mensaje = 'Mensaje de prueba';
        service.sendMessageObservable(mensaje).subscribe(resp => {
            expect(resp.success).toBeTrue();
        });
        const req = httpMock.expectOne(telegramApiUrl);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ message: mensaje });
        expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
        req.flush({ success: true });
    });
});
