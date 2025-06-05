# Funcionalidad de Cámara para Productos

## Descripción
Se ha implementado la funcionalidad de captura de imágenes con la cámara del dispositivo móvil para la creación y edición de productos en la aplicación Angular.

## Características Implementadas

### 🚀 Funcionalidades Principales
- **Captura de fotos con cámara**: Los usuarios pueden tomar fotos directamente desde la cámara del dispositivo
- **Detección automática de dispositivo móvil**: La aplicación detecta si es un dispositivo móvil para mostrar opciones relevantes
- **Cambio de cámara**: En dispositivos móviles, permite alternar entre cámara frontal y trasera
- **Interfaz adaptativa**: Diferentes interfaces según las capacidades del dispositivo
- **Fallback para navegadores sin WebRTC**: Opción alternativa para seleccionar desde galería

### 📱 Componentes Creados

#### 1. CameraService (`src/app/shared/services/camera.service.ts`)
Servicio principal que maneja:
- Detección de dispositivos móviles
- Verificación de disponibilidad de cámara
- Apertura y control de stream de cámara
- Captura de fotos
- Cambio entre cámaras frontal/trasera
- Fallback para input file con capture

#### 2. CameraModalComponent (`src/app/shared/components/camera-modal/`)
Componente modal que proporciona:
- Interfaz de usuario para la cámara
- Controles para capturar fotos
- Botón para alternar cámaras (móviles)
- Estados de carga y error
- Vista previa del video en tiempo real

### 🔧 Integración en ProductForm

El componente `ProductFormComponent` ahora incluye:
- Botones para seleccionar imagen desde archivos o cámara
- Detección automática de capacidades del dispositivo
- Integración seamless con el formulario existente
- Manejo de vista previa de imágenes capturadas

## 🎯 Uso de la Funcionalidad

### Para Usuarios en Dispositivos Móviles:
1. Al crear/editar un producto, verán dos opciones:
   - "Seleccionar desde archivos"
   - "Tomar foto con cámara"
2. Al seleccionar "Tomar foto con cámara":
   - Se abrirá un modal con la interfaz de cámara
   - Pueden alternar entre cámara frontal/trasera
   - Pueden capturar la foto con el botón central
   - La foto se integrará automáticamente al formulario

### Para Usuarios en Desktop:
1. Si tienen cámara web disponible, verán la opción de cámara
2. Si no tienen cámara, solo verán la opción de seleccionar archivos
3. La interfaz se adapta automáticamente

## 🛠️ Configuración Técnica

### Permisos Requeridos
- **Camera**: Para acceder a la cámara del dispositivo
- **Media**: Para capturar fotos

### Compatibilidad
- **Navegadores compatibles**: Chrome, Firefox, Safari, Edge (últimas versiones)
- **Dispositivos**: iOS, Android, Desktop con cámara web
- **Fallback**: Input file con atributo capture para dispositivos que no soportan WebRTC

### Tipos de Archivo
- **Formatos soportados**: JPEG, PNG, GIF, WebP
- **Calidad**: Configurable (por defecto 90%)
- **Resolución**: Se adapta a las capacidades del dispositivo

## 📚 Archivos Modificados/Creados

### Nuevos Archivos:
- `src/app/shared/services/camera.service.ts`
- `src/app/shared/components/camera-modal/camera-modal.component.ts`
- `src/app/shared/components/camera-modal/camera-modal.component.html`
- `src/app/shared/components/camera-modal/camera-modal.component.scss`
- `src/app/shared/types/camera.d.ts`

### Archivos Modificados:
- `src/app/shared/shared.module.ts` - Agregado CameraModalComponent
- `src/app/admin/pages/product-form/product-form.component.ts` - Integración de cámara
- `src/app/admin/pages/product-form/product-form.component.html` - Nueva UI para cámara

## 🚨 Consideraciones de Seguridad

- La aplicación solicita permisos de cámara solo cuando es necesario
- Las fotos se procesan localmente en el dispositivo
- No se almacenan automáticamente en el dispositivo
- Los permisos se pueden revocar en cualquier momento desde la configuración del navegador

## 🔍 Resolución de Problemas

### Problema: "No se pudo acceder a la cámara"
**Solución**: Verificar que:
- Los permisos de cámara estén habilitados para el sitio web
- No haya otras aplicaciones usando la cámara
- El navegador sea compatible con WebRTC

### Problema: "Cámara no disponible"
**Solución**: 
- En móviles, usar el botón "Seleccionar desde galería"
- En desktop, verificar que haya una cámara web conectada

### Problema: La calidad de la imagen es baja
**Solución**: 
- La resolución se adapta automáticamente al dispositivo
- En dispositivos de alta gama, la calidad será mejor automáticamente

## 🎉 Beneficios para el Usuario

1. **Experiencia móvil mejorada**: Captura directa desde cámara
2. **Flujo simplificado**: Menos pasos para agregar imágenes
3. **Mejor calidad**: Fotos tomadas directamente vs subidas desde galería
4. **Interfaz intuitiva**: Controles familiares de cámara
5. **Compatibilidad universal**: Funciona en todos los dispositivos

Esta implementación mejora significativamente la experiencia de usuario en dispositivos móviles, haciendo que la gestión de productos sea más rápida y eficiente.
