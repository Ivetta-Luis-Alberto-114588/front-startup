import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number; // 0-1
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private stream: MediaStream | null = null;

  constructor() { }

  /**
   * Detecta si el dispositivo es móvil
   */
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Verifica si la cámara está disponible en el dispositivo
   */
  async isCameraAvailable(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  }

  /**
   * Abre la cámara y retorna el stream de video
   */
  async openCamera(options: CameraOptions = {}): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'environment', // Cámara trasera por defecto
          width: { ideal: options.width || 1920 },
          height: { ideal: options.height || 1080 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }
  /**
   * Captura una foto del stream de video
   */
  capturePhoto(videoElement: HTMLVideoElement, options: CameraOptions = {}): Promise<File> {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('No se pudo crear el contexto del canvas');
    }

    // Configurar dimensiones del canvas
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convertir a blob y luego a File
    return new Promise<File>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().getTime();
          const file = new File([blob], `camera-photo-${timestamp}.jpg`, {
            type: 'image/jpeg',
            lastModified: timestamp
          });
          resolve(file);
        } else {
          reject(new Error('No se pudo crear la imagen'));
        }
      }, 'image/jpeg', options.quality || 0.9);
    });
  }

  /**
   * Detiene el stream de la cámara
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Cambia entre cámara frontal y trasera (solo en móviles)
   */
  async switchCamera(currentFacingMode: 'user' | 'environment'): Promise<MediaStream> {
    this.stopCamera();
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    return this.openCamera({ facingMode: newFacingMode });
  }
  /**
   * Método alternativo para dispositivos que soportan el input file con capture
   */
  openFileInputWithCamera(): Observable<File> {
    const subject = new Subject<File>();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    // En dispositivos móviles, esto abrirá opciones de cámara/galería
    if (this.isMobileDevice()) {
      // Usar setAttribute para evitar conflictos de tipos
      input.setAttribute('capture', 'environment');
    }

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        subject.next(file);
      }
      subject.complete();
    };

    input.oncancel = () => {
      subject.complete();
    };

    // Trigger click
    input.click();

    return subject.asObservable();
  }

  /**
   * Verifica si el navegador soporta la API de cámara
   */
  isWebRTCSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}
