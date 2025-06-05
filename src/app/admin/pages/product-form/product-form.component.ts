// src/app/admin/pages/product-form/product-form.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminProductService, ProductFormData } from '../../services/admin-product.service';
import { AdminCategoryService } from '../../services/admin-category.service';
import { AdminUnitService } from '../../services/admin-unit.service';
import { AdminTagService } from '../../services/admin-tag.service'; // Importar servicio de tags
import { NotificationService } from 'src/app/shared/services/notification.service';
import { CameraService } from 'src/app/shared/services/camera.service'; // Importar servicio de cámara
import { IProduct } from 'src/app/features/products/model/iproduct';
import { ICategory } from 'src/app/features/products/model/icategory';
import { IUnit } from 'src/app/features/products/model/iunit';
import { ITag } from 'src/app/features/products/model/itag'; // Importar interfaz de tag
import { PaginationDto } from 'src/app/shared/dtos/pagination.dto';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit, OnDestroy {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  isLoading = false; // Carga general (datos producto + dependencias)
  isLoadingCategories = false;
  isLoadingUnits = false;
  isLoadingTags = false; // Flag para tags
  isSubmitting = false;
  error: string | null = null;

  // Datos para los selects
  categories: ICategory[] = [];
  units: IUnit[] = [];
  availableTags: ITag[] = []; // Para el selector de tags

  // Manejo de imagen
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  existingImageUrl: string | null = null; // Para mostrar la imagen actual en modo edición
  removeCurrentImage = false; // Flag para indicar si se debe eliminar la imagen actual

  // Camera functionality
  showCameraModal = false;
  isMobileDevice = false;
  isCameraAvailable = false;

  private routeSub: Subscription | null = null;
  private dataSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private adminProductService: AdminProductService,
    private adminCategoryService: AdminCategoryService,
    private adminUnitService: AdminUnitService,
    private adminTagService: AdminTagService, // Inyectar servicio de tags
    private notificationService: NotificationService,
    private cameraService: CameraService, // Inyectar servicio de cámara
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      category: [null, [Validators.required]], // ID de categoría
      unit: [null, [Validators.required]],     // ID de unidad
      taxRate: [21, [Validators.required, Validators.min(0), Validators.max(100)]],
      isActive: [true],
      tags: [[]] // Array para los nombres/IDs de tags seleccionados
      // No incluimos imgUrl o imageFile aquí, se manejan por separado
    });
  }

  ngOnInit(): void {
    this.isLoading = true; // Iniciar carga general
    this.initializeCameraCapabilities(); // Verificar capacidades de cámara
    this.loadDependencies(); // Cargar categorías, unidades y tags

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.productId = params.get('id');
      this.isEditMode = !!this.productId;

      if (this.isEditMode && this.productId) {
        this.loadProductData(this.productId); // Carga los datos del producto (esto pondrá isLoading = false al final)
      } else {
        this.isLoading = false; // Terminar carga general si es nuevo producto
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  loadDependencies(): void {
    this.isLoadingCategories = true;
    this.isLoadingUnits = true;
    this.isLoadingTags = true;
    const pagination: PaginationDto = { page: 1, limit: 1000 }; // Cargar "todos"

    this.dataSub = forkJoin({
      categories: this.adminCategoryService.getCategories(pagination).pipe(catchError(() => of([]))), // Manejar error individual
      units: this.adminUnitService.getUnits(pagination).pipe(catchError(() => of([]))),
      tags: this.adminTagService.getTags(pagination).pipe(catchError(() => of([]))) // Cargar tags
    })
      .pipe(finalize(() => {
        this.isLoadingCategories = false;
        this.isLoadingUnits = false;
        this.isLoadingTags = false;
        // Finalizar carga general solo si no estamos en modo edición (porque loadProductData lo hará)
        if (!this.isEditMode) this.isLoading = false;
      }))
      .subscribe({
        next: ({ categories, units, tags }) => {
          this.categories = categories.sort((a, b) => a.name.localeCompare(b.name));
          this.units = units.sort((a, b) => a.name.localeCompare(b.name));
          this.availableTags = tags.filter(t => t.isActive).sort((a, b) => a.name.localeCompare(b.name)); // Filtrar activas y ordenar
        },
        error: (err) => {
          this.notificationService.showError('Error al cargar datos necesarios (categorías, unidades o tags).', 'Error');
          this.error = 'No se pudieron cargar todos los datos necesarios.';
          // No finalizar isLoading aquí si estamos en modo edición
          if (!this.isEditMode) this.isLoading = false;
        }
      });
  }


  loadProductData(id: string): void {
    // isLoading ya está en true desde ngOnInit
    this.adminProductService.getProductById(id)
      .pipe(finalize(() => this.isLoading = false)) // Finalizar carga general aquí
      .subscribe({
        next: (product) => {
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category?.id, // Asignar ID
            unit: product.unit?.id,         // Asignar ID
            taxRate: product.taxRate,
            isActive: product.isActive,
            tags: product.tags || [] // Asignar tags existentes
          });
          this.existingImageUrl = product.imgUrl || null; // Guardar URL existente
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.error || `No se pudo cargar el producto (Status: ${err.status}).`;
          this.notificationService.showError(this.error ?? "Unknown Error", 'Error');
          if (err.status === 404) {
            this.router.navigate(['/admin/products']);
          }
        }
      });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      // Validar tipo de archivo (opcional pero recomendado)
      if (!file.type.startsWith('image/')) {
        this.notificationService.showError('Por favor, selecciona un archivo de imagen.', 'Archivo Inválido');
        this.selectedFile = null;
        this.imagePreview = null;
        element.value = ''; // Limpiar el input
        return;
      }
      this.selectedFile = file;
      this.removeCurrentImage = false; // Si selecciona nuevo, no queremos borrar explícitamente

      // Generar vista previa
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.imagePreview = null;
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.removeCurrentImage = true; // Marcar para indicar que se quiere borrar la existente
    // Limpiar el input de archivo si es posible (puede ser complejo dependiendo del navegador)
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }


  onSubmit(): void {
    if (this.productForm.invalid || this.isSubmitting) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    // Construir el objeto ProductFormData
    const formData: ProductFormData = {
      name: this.productForm.value.name,
      description: this.productForm.value.description,
      price: this.productForm.value.price,
      stock: this.productForm.value.stock,
      category: this.productForm.value.category,
      unit: this.productForm.value.unit,
      taxRate: this.productForm.value.taxRate,
      isActive: this.productForm.value.isActive,
      tags: this.productForm.value.tags || [],
      // Si se marcó para remover y no hay archivo nuevo, enviar imgUrl vacía
      imgUrl: (this.removeCurrentImage && !this.selectedFile) ? '' : undefined
    };


    let action$: Observable<IProduct>;

    if (this.isEditMode && this.productId) {
      // Pasar el archivo seleccionado (puede ser null si no se cambió o se removió)
      action$ = this.adminProductService.updateProduct(this.productId, formData, this.selectedFile);
    } else {
      // Pasar el archivo seleccionado (puede ser null)
      action$ = this.adminProductService.createProduct(formData, this.selectedFile || undefined);
    }

    action$.pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (savedProduct) => {
          const message = this.isEditMode
            ? `Producto "${savedProduct.name}" actualizado.`
            : `Producto "${savedProduct.name}" creado.`;
          this.notificationService.showSuccess(message, 'Éxito');
          this.router.navigate(['/admin/products']); // Volver a la lista
        },
        error: (err: HttpErrorResponse) => {
          if (err.error && typeof err.error.error === 'string') {
            this.error = err.error.error;
          } else {
            this.error = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} el producto. Intente de nuevo.`;
          }
          this.notificationService.showError(this.error ?? "Unknown error", 'Error');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/products']); // Volver a la lista de productos
  }

  // Getters para acceso fácil en la plantilla
  get name() { return this.productForm.get('name'); }
  get description() { return this.productForm.get('description'); }
  get price() { return this.productForm.get('price'); }
  get stock() { return this.productForm.get('stock'); }
  get category() { return this.productForm.get('category'); }
  get unit() { return this.productForm.get('unit'); }
  get taxRate() { return this.productForm.get('taxRate'); }
  get isActive() { return this.productForm.get('isActive'); }
  get tags() { return this.productForm.get('tags'); }

  // Getter para calcular precio con IVA dinámicamente
  get calculatedPriceWithTax(): number {
    const priceVal = this.productForm.get('price')?.value ?? 0;
    const taxRateVal = this.productForm.get('taxRate')?.value ?? 0;
    if (typeof priceVal === 'number' && typeof taxRateVal === 'number') {
      return Math.round(priceVal * (1 + taxRateVal / 100) * 100) / 100;
    }
    return 0;
  }

  async initializeCameraCapabilities(): Promise<void> {
    this.isMobileDevice = this.cameraService.isMobileDevice();
    try {
      this.isCameraAvailable = await this.cameraService.isCameraAvailable();
    } catch (error) {
      this.isCameraAvailable = false;
    }
  }

  openFileSelector(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  openCamera(): void {
    this.showCameraModal = true;
  }

  onPhotoTaken(file: File): void {
    this.selectedFile = file;
    this.removeCurrentImage = false;

    // Generar vista previa
    const reader = new FileReader();
    reader.onload = e => this.imagePreview = reader.result;
    reader.readAsDataURL(file);

    this.showCameraModal = false;
    this.notificationService.showSuccess('Foto capturada exitosamente', 'Éxito');
  }

  onCameraModalClosed(): void {
    this.showCameraModal = false;
  }
}