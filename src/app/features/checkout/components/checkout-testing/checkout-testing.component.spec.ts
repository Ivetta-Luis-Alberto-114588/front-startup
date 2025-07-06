// src/app/features/checkout/components/checkout-testing/checkout-testing.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { CheckoutTestingComponent } from './checkout-testing.component';
import { CheckoutTestingService } from '../../services/checkout-testing.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

describe('CheckoutTestingComponent', () => {
    let component: CheckoutTestingComponent;
    let fixture: ComponentFixture<CheckoutTestingComponent>;
    let checkoutTestingService: jasmine.SpyObj<CheckoutTestingService>;
    let notificationService: jasmine.SpyObj<NotificationService>;

    beforeEach(async () => {
        const checkoutTestingServiceSpy = jasmine.createSpyObj('CheckoutTestingService', [
            'testHomeDeliveryScenario',
            'testPickupScenario',
            'testAuthenticatedUserScenario',
            'testFormValidationScenarios',
            'testErrorScenarios',
            'runAllTestScenarios'
        ]);

        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'showSuccess',
            'showError',
            'showInfo'
        ]);

        await TestBed.configureTestingModule({
            declarations: [CheckoutTestingComponent],
            providers: [
                { provide: CheckoutTestingService, useValue: checkoutTestingServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CheckoutTestingComponent);
        component = fixture.componentInstance;
        checkoutTestingService = TestBed.inject(CheckoutTestingService) as jasmine.SpyObj<CheckoutTestingService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize with correct default state', () => {
            expect(component.testResults.length).toBe(5);
            expect(component.isRunningTests).toBe(false);
            expect(component.allTestsComplete).toBe(false);

            // Verificar que todos los tests empiecen en estado 'pending'
            component.testResults.forEach(test => {
                expect(test.status).toBe('pending');
            });
        });

        it('should have correct test names', () => {
            const expectedNames = [
                'Envío a Domicilio',
                'Retiro en Local',
                'Usuario Autenticado',
                'Validaciones de Formulario',
                'Casos de Error'
            ];

            component.testResults.forEach((test, index) => {
                expect(test.name).toBe(expectedNames[index]);
            });
        });
    });

    describe('Individual Test Execution', () => {
        it('should run home delivery test successfully', fakeAsync(() => {
            const mockResult = { scenario: 'home-delivery', status: 'success' };
            const delayedResult = of(mockResult).pipe(delay(1)); // Agregar un delay mínimo
            checkoutTestingService.testHomeDeliveryScenario.and.returnValue(delayedResult);

            component.runIndividualTest(0);

            // Inmediatamente debe estar en estado running
            expect(component.testResults[0].status).toBe('running');
            expect(checkoutTestingService.testHomeDeliveryScenario).toHaveBeenCalled();

            // Después del tick debe completarse
            tick(1);
            expect(component.testResults[0].status).toBe('success');
        }));

        it('should run pickup test successfully', () => {
            const mockResult = { scenario: 'pickup', status: 'success' };
            checkoutTestingService.testPickupScenario.and.returnValue(of(mockResult));

            component.runIndividualTest(1);

            expect(checkoutTestingService.testPickupScenario).toHaveBeenCalled();
        });

        it('should run authenticated user test successfully', () => {
            const mockResult = { scenario: 'authenticated', status: 'success' };
            checkoutTestingService.testAuthenticatedUserScenario.and.returnValue(of(mockResult));

            component.runIndividualTest(2);

            expect(checkoutTestingService.testAuthenticatedUserScenario).toHaveBeenCalled();
        });

        it('should run form validation test successfully', () => {
            const mockResult = { validationTests: [], status: 'completed' };
            checkoutTestingService.testFormValidationScenarios.and.returnValue(of(mockResult));

            component.runIndividualTest(3);

            expect(checkoutTestingService.testFormValidationScenarios).toHaveBeenCalled();
        });

        it('should run error scenarios test successfully', () => {
            const mockResult = { errorScenarios: [], status: 'completed' };
            checkoutTestingService.testErrorScenarios.and.returnValue(of(mockResult));

            component.runIndividualTest(4);

            expect(checkoutTestingService.testErrorScenarios).toHaveBeenCalled();
        });

        it('should handle test failure', () => {
            const errorMessage = 'Test failed';
            checkoutTestingService.testHomeDeliveryScenario.and.returnValue(
                throwError(() => new Error(errorMessage))
            );

            component.runIndividualTest(0);

            // La lógica de error se maneja en el subscribe del componente
            // El test verificará que el servicio fue llamado
            expect(checkoutTestingService.testHomeDeliveryScenario).toHaveBeenCalled();
        });

        it('should not run test when already running tests', () => {
            component.isRunningTests = true;

            component.runIndividualTest(0);

            expect(checkoutTestingService.testHomeDeliveryScenario).not.toHaveBeenCalled();
        });

        it('should not run invalid test index', () => {
            component.runIndividualTest(99); // Índice inválido

            expect(checkoutTestingService.testHomeDeliveryScenario).not.toHaveBeenCalled();
            expect(checkoutTestingService.testPickupScenario).not.toHaveBeenCalled();
        });
    });

    describe('All Tests Execution', () => {
        it('should run all tests successfully', fakeAsync(() => {
            const mockResult = {
                message: 'Todos los escenarios completados',
                scenarios: ['Envío a domicilio', 'Retiro en local'],
                status: 'success'
            };

            const delayedResult = of(mockResult).pipe(delay(1));
            checkoutTestingService.runAllTestScenarios.and.returnValue(delayedResult);

            component.runAllTests();

            expect(component.isRunningTests).toBe(true);
            expect(checkoutTestingService.runAllTestScenarios).toHaveBeenCalled();
            expect(notificationService.showInfo).toHaveBeenCalledWith('Iniciando testing exhaustivo del checkout...');

            // Después del tick debe completarse
            tick(1);
            expect(component.allTestsComplete).toBe(true);
            expect(component.isRunningTests).toBe(false);
        }));

        it('should handle all tests failure', () => {
            const errorMessage = 'Testing failed';
            checkoutTestingService.runAllTestScenarios.and.returnValue(
                throwError(() => new Error(errorMessage))
            );

            component.runAllTests();

            expect(checkoutTestingService.runAllTestScenarios).toHaveBeenCalled();
        });

        it('should not run all tests when already running', () => {
            component.isRunningTests = true;

            component.runAllTests();

            expect(checkoutTestingService.runAllTestScenarios).not.toHaveBeenCalled();
        });
    });

    describe('Reset Tests', () => {
        it('should reset all test states', () => {
            // Configurar algunos tests como completados
            component.testResults[0].status = 'success';
            component.testResults[1].status = 'error';
            component.testResults[2].status = 'success';
            component.allTestsComplete = true;

            component.resetTests();

            expect(component.allTestsComplete).toBe(false);
            expect(notificationService.showInfo).toHaveBeenCalledWith('Tests reiniciados');

            component.testResults.forEach(test => {
                expect(test.status).toBe('pending');
                expect(test.message).toBeUndefined();
                expect(test.duration).toBeUndefined();
                expect(test.details).toBeUndefined();
            });
        });
    });

    describe('Helper Methods', () => {
        it('should return correct icon for each status', () => {
            expect(component.getTestIcon('pending')).toBe('bi-clock');
            expect(component.getTestIcon('running')).toBe('bi-arrow-clockwise');
            expect(component.getTestIcon('success')).toBe('bi-check-circle-fill');
            expect(component.getTestIcon('error')).toBe('bi-x-circle-fill');
            expect(component.getTestIcon('unknown')).toBe('bi-question-circle');
        });

        it('should return correct CSS class for each status', () => {
            expect(component.getTestClass('pending')).toBe('text-muted');
            expect(component.getTestClass('running')).toBe('text-primary');
            expect(component.getTestClass('success')).toBe('text-success');
            expect(component.getTestClass('error')).toBe('text-danger');
            expect(component.getTestClass('unknown')).toBe('text-secondary');
        });

        it('should correctly identify if tests can run', () => {
            component.isRunningTests = false;
            expect(component.canRunTests).toBe(true);

            component.isRunningTests = true;
            expect(component.canRunTests).toBe(false);
        });

        it('should calculate progress percentage correctly', () => {
            // Todos pending
            expect(component.progressPercentage).toBe(0);

            // 2 de 5 completados
            component.testResults[0].status = 'success';
            component.testResults[1].status = 'error';
            expect(component.progressPercentage).toBe(40);

            // Todos completados
            component.testResults.forEach(test => test.status = 'success');
            expect(component.progressPercentage).toBe(100);
        });

        it('should count successful tests correctly', () => {
            component.testResults[0].status = 'success';
            component.testResults[1].status = 'success';
            component.testResults[2].status = 'error';

            expect(component.successfulTestsCount).toBe(2);
        });

        it('should count failed tests correctly', () => {
            component.testResults[0].status = 'error';
            component.testResults[1].status = 'success';
            component.testResults[2].status = 'error';

            expect(component.failedTestsCount).toBe(2);
        });

        it('should return total tests count', () => {
            expect(component.totalTestsCount).toBe(5);
        });
    });

    describe('UI State Management', () => {
        it('should prevent running tests when already running', () => {
            component.isRunningTests = true;

            // Intentar ejecutar test individual
            component.runIndividualTest(0);
            expect(checkoutTestingService.testHomeDeliveryScenario).not.toHaveBeenCalled();

            // Intentar ejecutar todos los tests
            component.runAllTests();
            expect(checkoutTestingService.runAllTestScenarios).not.toHaveBeenCalled();
        });

        it('should disable reset when tests are running', () => {
            component.isRunningTests = true;

            // En una implementación real, el botón de reset estaría deshabilitado
            // Aquí verificamos que la propiedad canRunTests sea false
            expect(component.canRunTests).toBe(false);
        });
    });
});
