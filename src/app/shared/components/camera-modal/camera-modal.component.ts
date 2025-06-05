import { Component, EventEmitter, Input, Output, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CameraService, CameraOptions } from '../../services/camera.service';

@Component({
  selector: 'app-camera-modal',
  templateUrl: './camera-modal.component.html',
  styleUrls: ['./camera-modal.component.scss']
})
export class CameraModalComponent implements OnDestroy {
  @Input() isOpen = false;
  @Output() photoTaken = new EventEmitter<File>();
  @Output() modalClosed = new EventEmitter<void>();

  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;

  isLoading = false;
  error: string | null = null;
  isCameraActive = false;
  currentFacingMode: 'user' | 'environment' = 'environment';
  canSwitchCamera = false;
  stream: MediaStream | null = null;

  constructor(private cameraService: CameraService) {}

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async openCamera(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      // Verificar si la cámara está disponible
      const cameraAvailable = await this.cameraService.isCameraAvailable();
      if (!cameraAvailable) {
        throw new Error('No se encontró ninguna cámara en el dispositivo');
      }

      // Abrir la cámara
      this.stream = await this.cameraService.openCamera({
        facingMode: this.currentFacingMode
      });

      // Configurar el elemento de video
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.play();
      }

      this.isCameraActive = true;
      this.canSwitchCamera = this.cameraService.isMobileDevice();
    } catch (error: any) {
      this.error = error.message || 'Error al acceder a la cámara';
      console.error('Camera error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.canSwitchCamera) return;

    this.isLoading = true;
    try {
      this.stream = await this.cameraService.switchCamera(this.currentFacingMode);
      this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
      
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
      }
    } catch (error: any) {
      this.error = error.message || 'Error al cambiar cámara';
    } finally {
      this.isLoading = false;
    }
  }
  async capturePhoto(): Promise<void> {
    if (!this.videoElement || !this.isCameraActive) {
      this.error = 'La cámara no está activa';
      return;
    }

    try {
      const video = this.videoElement.nativeElement;
      const photoFile = await this.cameraService.capturePhoto(video, { quality: 0.9 });
      
      // Emitir la foto capturada
      this.photoTaken.emit(photoFile);
      this.closeModal();
    } catch (error: any) {
      this.error = error.message || 'Error al capturar la foto';
    }
  }

  stopCamera(): void {
    this.cameraService.stopCamera();
    this.isCameraActive = false;
    this.stream = null;
  }

  closeModal(): void {
    this.stopCamera();
    this.error = null;
    this.modalClosed.emit();
  }

  // Método alternativo para dispositivos que no soportan WebRTC
  async useFileInput(): Promise<void> {
    try {
      const file = await this.cameraService.openFileInputWithCamera().toPromise();
      if (file) {
        this.photoTaken.emit(file);
        this.closeModal();
      }
    } catch (error: any) {
      this.error = error.message || 'Error al seleccionar imagen';
    }
  }

  get showWebRTCInterface(): boolean {
    return this.cameraService.isWebRTCSupported();
  }

  get isMobile(): boolean {
    return this.cameraService.isMobileDevice();
  }
}
