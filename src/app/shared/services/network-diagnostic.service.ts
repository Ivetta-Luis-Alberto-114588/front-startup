// src/app/shared/services/network-diagnostic.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NetworkDiagnosticService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Test básico de conectividad
    testConnectivity(): Observable<any> {
        console.log('[NetworkDiagnostic] Testing connectivity to:', this.apiUrl);
        return this.http.get(`${this.apiUrl}/api`);
    }

    // Test específico del endpoint de login con OPTIONS (preflight)
    testLoginEndpoint(): Observable<any> {
        console.log('[NetworkDiagnostic] Testing login endpoint:', `${this.apiUrl}/api/auth/login`);

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });

        return this.http.options(`${this.apiUrl}/api/auth/login`, { headers });
    }

    // Test de login real con datos de prueba
    testLogin(): Observable<any> {
        console.log('[NetworkDiagnostic] Testing real login:', `${this.apiUrl}/api/auth/login`);

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });

        const testData = {
            email: 'laivetta@gmail.com',
            password: '123456'
        };

        return this.http.post(`${this.apiUrl}/api/auth/login`, testData, { headers });
    }

    // Analizar headers de rate limiting
    private analyzeRateLimitHeaders(headers: any): void {
        const rateLimitInfo = {
            limit: headers?.get('ratelimit-limit') || headers?.get('x-ratelimit-limit'),
            remaining: headers?.get('ratelimit-remaining') || headers?.get('x-ratelimit-remaining'),
            reset: headers?.get('ratelimit-reset') || headers?.get('x-ratelimit-reset'),
            retryAfter: headers?.get('retry-after'),
            policy: headers?.get('ratelimit-policy')
        };

        console.log('📊 Rate Limit Info:', rateLimitInfo);

        if (rateLimitInfo.reset) {
            const resetDate = new Date(parseInt(rateLimitInfo.reset) * 1000);
            console.log('⏰ Rate limit se resetea en:', resetDate.toLocaleString());
        }

        if (rateLimitInfo.retryAfter) {
            console.log('⏳ Retry después de:', rateLimitInfo.retryAfter, 'segundos');
        }
    }

    // Test de múltiples peticiones para analizar rate limiting
    testRateLimiting(): void {
        console.log('=== TEST DE RATE LIMITING ===');
        const testData = {
            email: 'laivetta@gmail.com',
            password: '123456'
        };

        // Hacer múltiples peticiones con delay para evitar problemas
        for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
                console.log(`[RateLimit Test] Petición ${i}/3`);
                this.http.post(`${this.apiUrl}/api/auth/login`, testData).subscribe({
                    next: (response) => {
                        console.log(`✅ Petición ${i} exitosa:`, response);
                    },
                    error: (error) => {
                        console.error(`❌ Petición ${i} falló:`, {
                            status: error.status,
                            statusText: error.statusText,
                            error: error.error
                        });
                        this.analyzeRateLimitHeaders(error.headers);
                    }
                });
            }, (i - 1) * 2000); // 2 segundos entre peticiones
        }
    }

    // Diagnóstico completo mejorado
    runFullDiagnostic(): void {
        console.log('=== INICIANDO DIAGNÓSTICO COMPLETO ===');
        console.log('Environment:', environment);
        console.log('API URL:', this.apiUrl);

        // Test 1: Conectividad básica
        this.testConnectivity().subscribe({
            next: (response) => {
                console.log('✅ Test 1 - Conectividad básica: EXITOSO', response);
            },
            error: (error) => {
                console.error('❌ Test 1 - Conectividad básica: FALLÓ', error);
            }
        });

        // Test 2: Preflight request
        this.testLoginEndpoint().subscribe({
            next: (response) => {
                console.log('✅ Test 2 - Preflight login: EXITOSO', response);
            },
            error: (error) => {
                console.log('⚠️ Test 2 - Preflight login: FALLÓ (puede ser normal)', error);
            }
        });

        // Test 3: Login real
        this.testLogin().subscribe({
            next: (response) => {
                console.log('✅ Test 3 - Login real: EXITOSO', response);
            },
            error: (error) => {
                console.error('❌ Test 3 - Login real: FALLÓ', error);
            }
        });
    }
}
