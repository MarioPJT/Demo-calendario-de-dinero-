# Fecha · Calendario de pagos

Organizador de pagos construido con React, TypeScript y Vite. Node.js se usa para instalar las dependencias y ejecutar el servidor de desarrollo y la compilación.

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm ci
npm run dev
```

## Publicar automáticamente en GitHub Pages

1. Sube este proyecto a un repositorio de GitHub con rama `main` o `master`.
2. En el repositorio, abre **Settings → Pages** y selecciona **GitHub Actions** como origen de publicación.
3. Cada `push` a `main` o `master` compilará y publicará la web. También puedes iniciar la publicación manualmente en **Actions → Publicar en GitHub Pages → Run workflow**.

La compilación se guarda en `dist/` y no es necesario subir esa carpeta al repositorio.

## Comandos

- `npm run dev`: servidor local de desarrollo.
- `npm run build`: comprobación de TypeScript y compilación de producción.
- `npm run preview`: vista previa local de la compilación.
