# Fecha · Calendario de pagos

Organizador de pagos con React, TypeScript y Vite. Supabase proporciona las cuentas, el almacenamiento en la nube y las políticas que aíslan los pagos de cada usuario.
Cada cuenta también puede elegir modo claro u oscuro, temas de color, foto de perfil y una imagen de fondo privada.

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm ci
Copy-Item .env.example .env.local
# Añade la URL y la clave publicable de tu proyecto Supabase a .env.local
npm run dev
```

## Conectar Supabase

1. Crea un proyecto en Supabase y copia su URL y su clave publicable (anon/public).
2. En **SQL Editor**, ejecuta [`supabase/schema.sql`](supabase/schema.sql). Esto crea las tablas y activa RLS para que cada cuenta solo consulte y modifique sus propios pagos.
3. Para habilitar **Administración → Usuarios**, ejecuta también [`supabase/admin_users.sql`](supabase/admin_users.sql). Las funciones validan el rol admin en el servidor, muestran solo el directorio y permiten cambiar roles; nunca devuelven pagos.
4. Ejecuta [`supabase/profile_media.sql`](supabase/profile_media.sql) para crear el bucket privado que guarda fotos de perfil e imágenes de fondo con acceso restringido a cada cuenta.
5. En **Authentication → URL Configuration**, usa `https://mariopjt.github.io/Demo-calendario-de-dinero-/` como Site URL y añade `https://mariopjt.github.io/Demo-calendario-de-dinero-/**` a Redirect URLs.
6. En el repositorio, abre **Settings → Secrets and variables → Actions** y crea estos repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Ejecuta **Actions → Publicar en GitHub Pages → Run workflow** para publicar la app.
8. Crea tu cuenta desde la aplicación. Luego, en SQL Editor, promuévela a administradora con la última instrucción comentada en `supabase/schema.sql`, sustituyendo el correo.

En la pantalla de inicio de sesión, **¿Olvidaste tu contraseña?** envía un enlace de recuperación al correo de la cuenta. El enlace vuelve a la app para guardar una contraseña nueva. Supabase debe tener habilitados los correos de autenticación y la URL de la app en la lista de redirecciones; la entrega del correo depende de la configuración de correo del proyecto.

Sin los dos secrets, GitHub Actions compila el proyecto pero omite la publicación. Los valores van en la configuración segura del repositorio y nunca en el código.

## Comandos

- `npm run dev`: servidor local de desarrollo.
- `npm run build`: comprobación de TypeScript y compilación de producción.
- `npm run preview`: vista previa local de la compilación.
