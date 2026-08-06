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
- **Notificaciones al paciente**: al confirmar o cancelar una cita se envía un correo
  automático (vía Resend). Además, cada cita tiene un botón "Enviar" que abre WhatsApp
  con un mensaje ya escrito (confirmación, cancelación o recordatorio según el estado)
  listo para enviar con un clic.

El diseño original hecho con la herramienta de diseño de Claude quedó guardado en
`design-reference/` como referencia — ya no se usa en producción.

## Requisitos

- Node.js (cualquier versión reciente sirve). Si alguna vez `npm run dev` o
  `npm run build` imprime "Ready" y el proceso se cierra solo sin error claro, es
  casi siempre un binario nativo de Next.js corrupto por una instalación
  interrumpida — se arregla con `rm -rf node_modules && npm install`.

## Cómo correrlo en local

```bash
npm install
cp .env.example .env   # si no existe ya un .env
```

Edita `.env` y define al menos:

```
DATABASE_URL="postgresql://usuario:password@host/basededatos?sslmode=require"
SESSION_SECRET="<genera uno con: openssl rand -base64 32>"
ADMIN_SEED_USERNAME="admin"
ADMIN_SEED_PASSWORD="<una contraseña segura>"
```

El proyecto usa Postgres (probado con [Neon](https://neon.tech)) tanto en local como en
producción — no SQLite — para que el mismo `schema.prisma` sirva en ambos entornos.

Crea las tablas y el usuario administrador inicial:

```bash
npm run db:migrate   # aplica las migraciones y siembra el admin
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

## Correo automático (Resend)

1. Crea una cuenta gratis en [resend.com](https://resend.com) y genera una API key.
2. Ponla en `.env` como `RESEND_API_KEY`.
3. Mientras no tengas un dominio verificado en Resend, deja
   `EMAIL_FROM="GastroSalud <onboarding@resend.dev>"` (su dirección de pruebas).
4. Cuando compres el dominio del sitio, agrégalo en Resend → Domains, pega los
   registros DNS que te dan (SPF/DKIM) en tu proveedor de dominio, y una vez
   verificado cambia `EMAIL_FROM` a algo como `"GastroSalud <citas@tudominio.com>"`.
5. Si `RESEND_API_KEY` no está configurado, la app sigue funcionando normal — solo
   no se envía el correo automático (se ve un aviso pequeño en el panel admin).

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
2. En el proyecto de Vercel, define las variables de entorno (Settings → Environment
   Variables):
   - `DATABASE_URL` — la misma cadena de conexión de Neon usada en local, o una base
     de Neon distinta para producción si prefieres separar datos de prueba y reales.
   - `SESSION_SECRET` — genera uno nuevo con `openssl rand -base64 32` (no reuses el
     de tu `.env` local).
   - `RESEND_API_KEY` y `EMAIL_FROM` — los mismos valores que usas en local, para que
     el correo de confirmación/cancelación funcione también en producción.
   - No hace falta poner `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD` en Vercel — esas
     solo las usa el script de seed, que corres una vez desde tu máquina (paso 3).
3. Antes (o después) del primer deploy, siembra el usuario administrador en la base de
   producción corriendo localmente `npm run db:seed` con el `DATABASE_URL` de
   producción en tu `.env`.
4. Haz el deploy (push a la rama conectada, o "Deploy" en el dashboard de Vercel).

## Notas de seguridad

- Cambia `ADMIN_SEED_PASSWORD` antes de desplegar — el valor de ejemplo no es seguro.
- `SESSION_SECRET` debe ser un valor largo y aleatorio, distinto en cada entorno.
- El panel `/admin` está protegido por `src/middleware.ts`, que exige una sesión
  válida para cualquier ruta bajo `/admin` y `/api/admin` (excepto login).
