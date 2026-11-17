# Julián Alba — Música para bodas

Landing page ficticia en español, creada con HTML, CSS, JavaScript, Vite y GSAP. Diseño adaptable a móviles y escritorio, fuentes y fotografías servidas localmente.

## Desarrollo

```sh
npm install
npm run dev
```

Abrir la dirección que indica Vite. Para generar la versión estática:

```sh
npm run build
npm run preview
```

La carpeta `dist/` contiene el sitio para cualquier hosting estático. Los archivos principales son `index.html`, `style.css` y `main.js`.

## Interacciones

- Animaciones GSAP y ScrollTrigger, respetando la preferencia de movimiento reducido.
- Menú móvil con navegación por teclado y cierre mediante Escape.
- Tres bocetos instrumentales originales sintetizados con Web Audio, activados solamente al pulsar reproducir. No son interpretaciones ni grabaciones reales del músico ficticio.
- Preguntas frecuentes desplegables.
- Formulario con validación nativa y confirmación de demostración. No envía, guarda ni transmite datos. Para producción se debe conectar un servicio de formularios y reemplazar la confirmación.

El nombre, las historias y la cita son ficticios. Las fotografías son ilustrativas de Unsplash:
- `guitar.jpg`: https://images.unsplash.com/photo-1525201548942-d8732f6617a0
- `wedding.jpg`: https://images.unsplash.com/photo-1519741497674-611481863552
- `celebration.jpg`: https://images.unsplash.com/photo-1511795409834-ef04bbd61622

## Verificación

```sh
npm test
```

Las pruebas usan Chromium de Playwright. Si no está instalado, ejecutar `npx playwright install chromium`. Cubren escritorio, móvil, reproducción de audio, formulario, navegación y preguntas frecuentes.
