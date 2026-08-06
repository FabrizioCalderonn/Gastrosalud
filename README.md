# GastroSalud

Sitio web y panel administrativo para la clínica de la Dra. Angelica Salgado
(Gastroenterología, Endoscopía digestiva y Medicina interna — Santa Ana, El Salvador).

Construido con **Next.js (App Router) + TypeScript + Tailwind CSS v4 + Prisma**.

## Qué incluye

- **Sitio público** (`/`): landing con secciones de la doctora, servicios, seguros,
  preguntas frecuentes y blog.
- **Agenda de citas** (`/citas`): flujo de 3 pasos (fecha/hora → datos → confirmación),
  con disponibilidad real calculada contra la base de datos (no simulada).
- **Panel administrativo** (`/admin`): login con usuario/contraseña, lista de citas con
  filtros por fecha/estado/búsqueda, y cambio de estado (pendiente, confirmada,
  cancelada, completada).

El diseño original hecho con la herramienta de diseño de Claude quedó guardado en
`design-reference/` como referencia — ya no se usa en producción.

## Requisitos

- Node.js 20 o 22 (LTS). **Node muy nuevo o no-LTS puede causar que los binarios
  nativos de Next.js (SWC/Turbopack) fallen** — si `npm run dev` o `npm run build`
  se cierran solos sin error claro, lo primero a revisar es la versión de Node
  (`node -v`) y cambiar a una LTS con [nvm](https://github.com/nvm-sh/nvm).

## Cómo correrlo en local

```bash
npm install
cp .env.example .env   # si no existe ya un .env
```

Edita `.env` y define al menos:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="<genera uno con: openssl rand -base64 32>"
ADMIN_SEED_USERNAME="admin"
ADMIN_SEED_PASSWORD="<una contraseña segura>"
```

Crea la base de datos y el usuario administrador inicial:

```bash
npm run db:migrate   # crea las tablas (SQLite local) y siembra el admin
```

Levanta el servidor:

```bash
npm run dev
```

- Sitio: http://localhost:3000
- Agenda: http://localhost:3000/citas
- Panel admin: http://localhost:3000/admin/login (usuario/contraseña de `ADMIN_SEED_*`)

Si cambias `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD` después de la primera vez,
vuelve a correr `npm run db:seed` para actualizar la cuenta.

## Agregar fotos reales

Las fotos de la doctora y del blog están como marcadores de posición
(`src/components/PlaceholderPhoto.tsx`). Para reemplazarlas:

1. Coloca las imágenes en `public/images/`.
2. En `src/components/sections/Hero.tsx`, `Doctora.tsx` y `Blog.tsx`, cambia
   `<PlaceholderPhoto ... />` por `<Image src="/images/tu-foto.jpg" ... />`
   (usa el componente `next/image`, ya usado en el logo del header).

## Horarios y duración de citas

Definidos en `src/lib/schedule.ts`:

- Lunes a viernes: 8:00am–12:00pm y 2:00pm–5:00pm
- Sábados: 9:00am–1:00pm
- Domingos: cerrado
- Duración de cada cita: 30 minutos (`SLOT_DURATION_MINUTES`)

Cambia esos valores ahí si el horario real de la clínica cambia.

## Desplegar en Vercel

1. Sube este repositorio a GitHub y conéctalo en [vercel.com](https://vercel.com/new).
2. **Base de datos**: SQLite (`file:./dev.db`) funciona en local pero no en Vercel
   (las funciones serverless no conservan archivos entre ejecuciones). Antes de
   desplegar, crea una base Postgres gratuita — por ejemplo con
   [Neon](https://neon.tech) o el add-on de Vercel Postgres — y usa esa cadena de
   conexión como `DATABASE_URL` en las variables de entorno del proyecto en Vercel.
3. En `prisma/schema.prisma`, cambia el `provider` del datasource de `"sqlite"` a
   `"postgresql"`.
4. Corre `npx prisma migrate deploy` (o deja que se ejecute como parte del build)
   apuntando a la base de producción, y `npm run db:seed` una vez para crear el
   usuario administrador real.
5. Define en Vercel las variables `DATABASE_URL`, `SESSION_SECRET`,
   `ADMIN_SEED_USERNAME`, `ADMIN_SEED_PASSWORD`.

## Notas de seguridad

- Cambia `ADMIN_SEED_PASSWORD` antes de desplegar — el valor de ejemplo no es seguro.
- `SESSION_SECRET` debe ser un valor largo y aleatorio, distinto en cada entorno.
- El panel `/admin` está protegido por `src/middleware.ts`, que exige una sesión
  válida para cualquier ruta bajo `/admin` y `/api/admin` (excepto login).
