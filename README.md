# Barcode Reader PWA

Aplicación web PWA para leer códigos de barras EAN-13 con la cámara trasera del móvil.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite. La cámara funciona en `localhost`; desde otro dispositivo usa HTTPS.

## Generar la versión de producción

```bash
npm run build
npm run preview
```

## Publicar en Netlify

1. Sube este repositorio a GitHub.
2. En Netlify: **Add new site > Import an existing project**.
3. Netlify detectará `netlify.toml` y ejecutará `npm run build`.
4. Abre la URL HTTPS desde el móvil y permite el acceso a la cámara.

## Lectura

- Intenta usar primero `BarcodeDetector` del navegador para reducir latencia.
- Si no está disponible o no admite EAN-13, usa `html5-qrcode` como fallback.
- El resultado se copia al portapapeles cuando el navegador lo permite.
- Guarda un historial local de las últimas lecturas.


## Ajuste específico para iPhone / Safari

La ruta fallback selecciona preferentemente una cámara trasera por `deviceId`, evita cámaras ultra gran angular cuando el navegador publica etiquetas, limita el análisis a EAN-13, usa 10 fps y relación 4:3. Safari puede seguir teniendo limitaciones de enfoque o de WebKit que no se pueden eliminar completamente desde una PWA.
