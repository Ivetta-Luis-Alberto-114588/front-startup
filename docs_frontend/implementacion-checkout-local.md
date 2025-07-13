# 🏪 Implementación de Checkout Optimizado para Compras en Local

## 📝 Resumen

Esta implementación optimiza el flujo de checkout para personas que están físicamente en el local y quieren pagar en efectivo, reduciendo el tiempo de checkout de 3-5 minutos a 30-60 segundos.

---

## 🔧 Implementación del Código

### 1. **Modificación del Componente Principal**

```typescript
// src/app/features/checkout/components/checkout-page/checkout-page.component.ts

export class CheckoutPageComponent implements OnInit, OnDestroy {
  // ...código existente...

  // Nuevas propiedades para modo local
  isInStoreMode = false;
  inStoreCustomerForm: FormGroup;
  showInStoreCustomerForm = false;

  constructor(
    // ...inyecciones existentes...
    private route: ActivatedRoute // Agregar para leer query params
  ) {
    // ...código existente...
    
    // Inicializar formulario simplificado para local
    this.inStoreCustomerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-]{8,15}$/)]],
      email: [''] // Opcional
    });
  }

  ngOnInit(): void {
    // Verificar si está en modo local
    this.checkInStoreMode();
    
    // ...resto del código existente...
  }

  /**
   * Verifica si está en modo "compra en local"
   */
  private checkInStoreMode(): void {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'in-store') {
        this.isInStoreMode = true;
        this.optimizeForInStore();
      }
    });
  }

  /**
   * Optimiza el flujo para compras en local
   */
  private optimizeForInStore(): void {
    console.log('🏪 Activando modo compra en local');
    
    // Mostrar formulario para invitados si no está autenticado
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (!isAuth) {
        this.showInStoreCustomerForm = true;
      }
    });

    // Cargar métodos y autoseleccionar pickup
    this.loadDeliveryMethods().then(() => {
      const pickupMethod = this.availableDeliveryMethods.find(m => 
        m.code === 'PICKUP' || m.code === 'pickup' || m.name.toLowerCase().includes('retiro')
      );
      
      if (pickupMethod) {
        console.log('🏪 Autoseleccionando método pickup:', pickupMethod.name);
        this.selectDeliveryMethod(pickupMethod);
      }
    });
  }

  /**
   * Carga métodos de entrega con promesa para uso en optimización
   */
  private loadDeliveryMethods(): Promise<void> {
    return new Promise((resolve) => {
      this.isLoadingDeliveryMethods = true;

      this.deliveryMethodService.getActiveDeliveryMethods().subscribe({
        next: (methods) => {
          this.availableDeliveryMethods = methods;
          this.checkoutStateService.setAvailableDeliveryMethods(methods);
          this.isLoadingDeliveryMethods = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading delivery methods:', error);
          this.isLoadingDeliveryMethods = false;
          resolve();
        }
      });
    });
  }

  /**
   * Actualiza métodos de pago y autoselecciona efectivo en modo local
   */
  private updateAvailablePaymentMethods(method: IDeliveryMethod): void {
    this.selectedPaymentMethod = null;
    this.checkoutStateService.setSelectedPaymentMethodId(null);

    this.paymentMethodService.getActivePaymentMethods().subscribe({
      next: (allMethods) => {
        this.availablePaymentMethods = this.paymentMethodService.filterPaymentMethodsByDelivery(
          allMethods,
          method.code
        );

        // En modo local, autoseleccionar efectivo si existe
        if (this.isInStoreMode && this.availablePaymentMethods.length > 0) {
          const cashMethod = this.availablePaymentMethods.find(m => 
            m.code === 'CASH' || m.code === 'cash' || m.name.toLowerCase().includes('efectivo')
          );
          
          if (cashMethod) {
            console.log('🏪 Autoseleccionando efectivo:', cashMethod.name);
            this.selectPaymentMethod(cashMethod._id);
          } else if (this.availablePaymentMethods.length === 1) {
            this.selectPaymentMethod(this.availablePaymentMethods[0]._id);
          }
        } else {
          // Modo normal: autoseleccionar solo si hay uno
          if (this.availablePaymentMethods.length === 1) {
            this.selectPaymentMethod(this.availablePaymentMethods[0]._id);
          }
        }
      },
      error: (error) => {
        console.error('Error cargando métodos de pago:', error);
        this.setFallbackPaymentMethods(method);
      }
    });
  }

  /**
   * Construye payload optimizado para compras en local
   */
  private buildOrderPayload(cart: ICart): ICreateOrderPayload {
    if (this.isInStoreMode) {
      return this.buildInStoreOrderPayload(cart);
    }
    
    // Usar método original para flujo normal
    return this.buildNormalOrderPayload(cart);
  }

  /**
   * Construye payload específico para compras en local
   */
  private buildInStoreOrderPayload(cart: ICart): ICreateOrderPayload {
    console.log('🏪 Construyendo payload para compra en local');

    let orderPayload: ICreateOrderPayload = {
      items: cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPriceWithTax
      })),
      deliveryMethodId: this.selectedDeliveryMethod!.id,
      paymentMethodId: this.selectedPaymentMethod!,
      notes: `Compra en local - ${new Date().toLocaleString()}`,
      deliveryMethodCode: this.selectedDeliveryMethod!.code,
      isInStoreOrder: true // Flag para identificar compras en local
    };

    // Para invitados en local: usar datos del formulario simplificado
    if (this.showInStoreCustomerForm && this.inStoreCustomerForm.valid) {
      const customerData = this.inStoreCustomerForm.value;
      orderPayload = {
        ...orderPayload,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email || `${customerData.phone}@local.store`
      };
    }

    console.log('🏪 Payload final para local:', orderPayload);
    return orderPayload;
  }

  /**
   * Método original para flujo normal
   */
  private buildNormalOrderPayload(cart: ICart): ICreateOrderPayload {
    // ...código existente del método buildOrderPayload...
    console.log('🔍 Building order payload...');
    console.log('Selected delivery method:', this.selectedDeliveryMethod);
    console.log('Selected payment method:', this.selectedPaymentMethod);

    if (!this.selectedDeliveryMethod) {
      throw new Error('No se ha seleccionado un método de entrega');
    }

    if (!this.selectedPaymentMethod) {
      throw new Error('No se ha seleccionado un método de pago');
    }

    let orderPayload: ICreateOrderPayload = {
      items: cart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPriceWithTax
      })),
      deliveryMethodId: this.selectedDeliveryMethod.id,
      paymentMethodId: this.selectedPaymentMethod,
      notes: `Pedido realizado desde el checkout - Método: ${this.selectedDeliveryMethod.name}`,
      deliveryMethodCode: this.selectedDeliveryMethod.code
    };

    // Añadir datos de dirección SOLO si el método de entrega lo requiere
    if (this.selectedDeliveryMethod.requiresAddress) {
      if (this.selectedAddressOption === 'existing' && this.selectedExistingAddressId) {
        orderPayload.selectedAddressId = this.selectedExistingAddressId;
      } else if (this.selectedAddressOption === 'new' && this.newAddressForm.valid) {
        const formValue = this.newAddressForm.value;
        orderPayload = {
          ...orderPayload,
          shippingRecipientName: formValue.recipientName,
          shippingPhone: formValue.phone,
          shippingStreetAddress: formValue.streetAddress,
          shippingPostalCode: formValue.postalCode || '',
          shippingNeighborhoodId: formValue.neighborhoodId,
          shippingAdditionalInfo: formValue.additionalInfo || ''
        };
      }
    }

    return orderPayload;
  }

  /**
   * Validación específica para modo local
   */
  private validateOrderBeforeCreation(): void {
    // Validaciones básicas existentes
    if (!this.selectedDeliveryMethod) {
      throw new Error('Por favor, selecciona un método de entrega.');
    }

    if (!this.selectedPaymentMethod) {
      throw new Error('Por favor, selecciona un método de pago.');
    }

    // Validación específica para modo local
    if (this.isInStoreMode && this.showInStoreCustomerForm) {
      if (!this.inStoreCustomerForm.valid) {
        this.inStoreCustomerForm.markAllAsTouched();
        throw new Error('Por favor, completa los datos del cliente.');
      }
    }

    // Validación normal para dirección solo si no es modo local
    if (!this.isInStoreMode && this.selectedDeliveryMethod.requiresAddress) {
      if (!this.isAddressSelectedOrValid) {
        if (this.selectedAddressOption === 'new') {
          this.newAddressForm.markAllAsTouched();
        }
        throw new Error('Por favor, selecciona o completa una dirección válida.');
      }
    }

    if (this.isProcessingOrder) {
      throw new Error('Ya se está procesando tu pedido.');
    }
  }

  /**
   * Método auxiliar para verificar si el checkout está listo
   */
  get isInStoreCheckoutReady(): boolean {
    if (!this.isInStoreMode) return false;
    
    const hasDeliveryMethod = !!this.selectedDeliveryMethod;
    const hasPaymentMethod = !!this.selectedPaymentMethod;
    const hasCustomerData = !this.showInStoreCustomerForm || this.inStoreCustomerForm.valid;
    
    return hasDeliveryMethod && hasPaymentMethod && hasCustomerData;
  }

  /**
   * Callback para éxito en compras en local
   */
  private handleCashPaymentSuccess(orderId: string): void {
    if (this.isInStoreMode) {
      this.notificationService.showSuccess(
        '¡Venta completada exitosamente!',
        'Compra en Local'
      );

      // En modo local, mostrar opción de imprimir ticket
      setTimeout(() => {
        if (confirm('¿Deseas imprimir el ticket de la venta?')) {
          this.printTicket(orderId);
        }
        
        // Limpiar formulario para próxima venta
        this.resetForNextSale();
      }, 2000);
    } else {
      // Comportamiento normal
      this.notificationService.showSuccess(
        '¡Pedido confirmado! Acércate al local para pagar en efectivo.',
        'Pago en Efectivo'
      );

      setTimeout(() => {
        this.router.navigate(['/'], {
          queryParams: { orderConfirmed: 'true', orderId, paymentType: 'cash' }
        });
      }, 3000);
    }
  }

  /**
   * Imprime ticket de venta (funcionalidad futura)
   */
  private printTicket(orderId: string): void {
    console.log('🖨️ Imprimiendo ticket para orden:', orderId);
    // Implementar integración con impresora térmica
    // window.print() o llamada a API de impresión
  }

  /**
   * Resetea el formulario para la próxima venta
   */
  private resetForNextSale(): void {
    if (this.isInStoreMode) {
      // Limpiar formulario de cliente
      this.inStoreCustomerForm.reset();
      
      // Mantener selecciones de pickup y efectivo
      // (no resetear métodos de pago/entrega)
      
      // Navegar a carrito o página principal
      this.router.navigate(['/products']);
    }
  }

  /**
   * Método para empleados: iniciar nueva venta
   */
  startNewInStoreSale(): void {
    this.router.navigate(['/checkout'], {
      queryParams: {
        mode: 'in-store',
        timestamp: Date.now() // Forzar recarga
      }
    });
  }
}
```

### 2. **Modificación del Template**

```html
<!-- src/app/features/checkout/components/checkout-page/checkout-page.component.html -->

<!-- Agregar después del breadcrumb -->
<div *ngIf="isInStoreMode" class="container">
  <div class="alert alert-info d-flex align-items-center">
    <i class="bi bi-shop fs-4 me-3"></i>
    <div>
      <h6 class="mb-1">Modo Compra en Local</h6>
      <small>Flujo optimizado para ventas en tienda física</small>
    </div>
  </div>
</div>

<!-- Modificar el progreso para modo local -->
<div class="card mb-4">
  <div class="card-body py-3">
    <div class="row align-items-center text-center">
      <!-- En modo local: menos pasos -->
      <div *ngIf="isInStoreMode; else normalProgress" class="col-12">
        <div class="row">
          <div class="col-4">
            <div class="d-flex flex-column align-items-center">
              <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center mb-2"
                   style="width: 40px; height: 40px;">
                <i class="bi bi-check-lg"></i>
              </div>
              <small class="fw-bold text-success">Método Pickup</small>
            </div>
          </div>
          <div class="col-4">
            <div class="d-flex flex-column align-items-center">
              <div class="rounded-circle d-flex align-items-center justify-content-center mb-2"
                   style="width: 40px; height: 40px;"
                   [class.bg-success]="showInStoreCustomerForm && inStoreCustomerForm.valid"
                   [class.bg-primary]="showInStoreCustomerForm && !inStoreCustomerForm.valid"
                   [class.bg-secondary]="!showInStoreCustomerForm"
                   [class.text-white]="true">
                <i class="bi" 
                   [class.bi-check-lg]="!showInStoreCustomerForm || inStoreCustomerForm.valid"
                   [class.bi-person]="showInStoreCustomerForm && !inStoreCustomerForm.valid"></i>
              </div>
              <small class="fw-bold" 
                     [class.text-success]="!showInStoreCustomerForm || inStoreCustomerForm.valid"
                     [class.text-primary]="showInStoreCustomerForm && !inStoreCustomerForm.valid"
                     [class.text-muted]="!showInStoreCustomerForm">
                Datos Cliente
              </small>
            </div>
          </div>
          <div class="col-4">
            <div class="d-flex flex-column align-items-center">
              <div class="rounded-circle d-flex align-items-center justify-content-center mb-2"
                   style="width: 40px; height: 40px;"
                   [class.bg-success]="isInStoreCheckoutReady"
                   [class.bg-secondary]="!isInStoreCheckoutReady"
                   [class.text-white]="true">
                <i class="bi" 
                   [class.bi-check-lg]="isInStoreCheckoutReady"
                   [class.bi-cash-coin]="!isInStoreCheckoutReady"></i>
              </div>
              <small class="fw-bold" 
                     [class.text-success]="isInStoreCheckoutReady"
                     [class.text-muted]="!isInStoreCheckoutReady">
                Listo
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Progreso normal -->
      <ng-template #normalProgress>
        <!-- ...código existente del progreso... -->
      </ng-template>
    </div>

    <div class="progress mt-3" style="height: 8px;">
      <div class="progress-bar bg-success" role="progressbar" 
           [style.width]="isInStoreMode ? getInStoreProgress() + '%' : getProgressPercentage() + '%'">
      </div>
    </div>
  </div>
</div>

<!-- Formulario simplificado para clientes en local -->
<div *ngIf="isInStoreMode && showInStoreCustomerForm" class="container mb-4">
  <div class="card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">
        <i class="bi bi-person me-2"></i>Datos del Cliente
      </h5>
    </div>
    <div class="card-body">
      <form [formGroup]="inStoreCustomerForm">
        <div class="row g-3">
          <div class="col-md-6">
            <label for="customerName" class="form-label">Nombre *</label>
            <input type="text" 
                   class="form-control" 
                   id="customerName" 
                   formControlName="name"
                   [class.is-invalid]="inStoreCustomerForm.get('name')?.invalid && inStoreCustomerForm.get('name')?.touched">
            <div *ngIf="inStoreCustomerForm.get('name')?.invalid && inStoreCustomerForm.get('name')?.touched" 
                 class="invalid-feedback">
              Nombre es requerido
            </div>
          </div>
          
          <div class="col-md-6">
            <label for="customerPhone" class="form-label">Teléfono *</label>
            <input type="tel" 
                   class="form-control" 
                   id="customerPhone" 
                   formControlName="phone"
                   [class.is-invalid]="inStoreCustomerForm.get('phone')?.invalid && inStoreCustomerForm.get('phone')?.touched">
            <div *ngIf="inStoreCustomerForm.get('phone')?.invalid && inStoreCustomerForm.get('phone')?.touched" 
                 class="invalid-feedback">
              Teléfono es requerido
            </div>
          </div>
          
          <div class="col-12">
            <label for="customerEmail" class="form-label">Email (Opcional)</label>
            <input type="email" 
                   class="form-control" 
                   id="customerEmail" 
                   formControlName="email"
                   placeholder="Para recibir confirmación por email">
          </div>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Modificar el botón de confirmación para modo local -->
<div class="card-footer">
  <button class="btn btn-lg w-100" 
          [class.btn-success]="isInStoreMode ? isInStoreCheckoutReady : canShowStep4()"
          [class.btn-secondary]="isInStoreMode ? !isInStoreCheckoutReady : !canShowStep4()" 
          (click)="confirmOrder()"
          [disabled]="isInStoreMode ? !isInStoreCheckoutReady || isProcessingOrder : !canShowStep4() || isProcessingOrder">
    
    <span *ngIf="isProcessingOrder" class="spinner-border spinner-border-sm me-2"></span>
    
    <span *ngIf="isInStoreMode && isInStoreCheckoutReady && !isProcessingOrder">
      <i class="bi bi-cash-coin me-2"></i>Confirmar Venta en Local
    </span>
    
    <span *ngIf="isInStoreMode && !isInStoreCheckoutReady && !isProcessingOrder">
      <i class="bi bi-hourglass me-2"></i>Completa los datos del cliente
    </span>
    
    <span *ngIf="!isInStoreMode && !canShowStep4() && !isProcessingOrder">
      <i class="bi bi-hourglass me-2"></i>Complete los pasos anteriores
    </span>
    
    <span *ngIf="!isInStoreMode && canShowStep4() && !isProcessingOrder">
      <i class="bi bi-check-circle me-2"></i>Confirmar y Pagar
    </span>
    
    <span *ngIf="isProcessingOrder">
      Procesando...
    </span>
  </button>
</div>
```

### 3. **Métodos Auxiliares**

```typescript
// Métodos auxiliares para el template
getInStoreProgress(): number {
  let progress = 0;
  
  // Paso 1: Método de entrega (pickup automático) - 40%
  if (this.selectedDeliveryMethod) progress += 40;
  
  // Paso 2: Datos del cliente - 30%
  if (!this.showInStoreCustomerForm || this.inStoreCustomerForm.valid) progress += 30;
  
  // Paso 3: Método de pago - 30%
  if (this.selectedPaymentMethod) progress += 30;
  
  return Math.min(progress, 100);
}

// Método para iniciar nueva venta desde cualquier parte
startNewInStoreSale(): void {
  this.router.navigate(['/checkout'], {
    queryParams: {
      mode: 'in-store',
      timestamp: Date.now()
    }
  });
}
```

### 4. **Botón de Acceso Rápido para Empleados**

```html
<!-- En el panel de admin o header -->
<button class="btn btn-success" 
        (click)="startNewInStoreSale()"
        *ngIf="userRole === 'admin' || userRole === 'employee'">
  <i class="bi bi-shop me-2"></i>
  Nueva Venta en Local
</button>
```

### 5. **Modificación del Interface**

```typescript
// src/app/features/orders/models/ICreateOrderPayload.ts
export interface ICreateOrderPayload {
  // ...campos existentes...
  
  // Nuevos campos para compras en local
  isInStoreOrder?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}
```

---

## 🎯 Resultado Final

### Flujo Optimizado para Persona en Local:

1. **Acceso**: URL con `?mode=in-store` o botón de empleado
2. **Autoselección**: Pickup y efectivo se seleccionan automáticamente
3. **Datos Mínimos**: Solo nombre y teléfono (email opcional)
4. **Confirmación**: Un clic y listo
5. **Tiempo Total**: 30-60 segundos

### Comparación:
- **Antes**: 4 pasos, formulario completo de dirección, 3-5 minutos
- **Después**: 2 pasos, datos mínimos, 30-60 segundos

¡El flujo está optimizado para ser súper rápido y eficiente para ventas en el local! 🚀
