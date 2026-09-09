# Piloto del equipo en el dominio principal

Autorizado por Marco para pruebas de 4–5 personas, no para operación definitiva.

- Respaldo de código previo: `8928b82086799fc8317ed1b4d8f42810c8593589`, sincronizado con GitHub.
- Deployment Vercel: `dpl_Gut7pu97cpnZAqz3GZCxzoceYf3b`, READY, mismo commit.
- URL: https://rhino-panel.vercel.app
- Se configuraron siete variables exclusivamente para el destino production de Vercel. Este nombre técnico no cambia el carácter de piloto.
- Base compartida deliberadamente con staging: `fzbpqgjrdreefontqmnf`, por autorización del usuario. No se copiaron registros, crearon cuentas, cambiaron contraseñas ni aplicaron nuevas migraciones en esta publicación.
- El acceso usa Supabase y contraseña, no las cuentas simuladas de localhost. La clave configurada en Vercel es publicable, no service_role.
- Rama de producción del proyecto no modificada: el despliegue se hizo explícitamente desde el commit autorizado de equipo.
- Vercel asignó también el alias de equipo al despliegue. No tratar ese alias como un entorno con datos independientes.

Pendientes conservados: prueba autenticada completa por rol, disponibilidad de la cuenta Aunor para los participantes, prueba completa de restauración y evaluación de fluidez del piloto. No usar como único registro de trabajos reales. El respaldo de código no restaura datos de Supabase.
