# Historial de Cambios (Changelog) - support-portal

Todos los cambios notables de este proyecto serán documentados en este archivo.

---

- [2026-11-16] feat(importaciones): cuentas RCV por defecto (venta y compra) en la importación de consignatarios y proveedores, y cuentas maestras adicionales (IVA Débito, IVA Crédito y Retención 2ª Categoría) con verificación, asociación a IVA GENERAL y asignación desde el plan de la empresa

- [2026-11-12] feat(importaciones): panel de progreso con anillo animado, barra, contadores en vivo, tiempo y tarjeta de resultado con Continuar al ejecutar una importación masiva

- [2026-11-12] feat(importaciones): vista compacta del asistente con tablero de avance (barra segmentada, filtros por estado y siguiente paso) y tabla con cabecera fija, filas expandibles y paginación

- [2026-11-12] feat(portal): RUT con formato (12.345.678-9) en las tablas de importación (consignatarios, proveedores, empleados y emisores), candidatas del diálogo, certificado SII, certificación SII y detalle de suscriptor

- [2026-11-11] feat(importaciones): importación masiva de emisores de honorarios desde SIGAD en el Portal Soporte (ISSUER_KIND, formato EMISORES_V1, ruta admin/issuer-import y paso Emisores del asistente)

- [2026-11-11] feat(importaciones): importación masiva de proveedores y empleados desde SIGAD en el Portal Soporte (ImportKind por rol, panel de fila reutilizado, barra de cuenta maestra, verificación de caracteres corregidos y zona de carga reutilizable)

- [2026-11-10] feat(portal): popup de confirmación estándar (ConfirmService), archivo de la sesión de importación con descarga y cursor pointer en la cabecera; reemplaza los confirm() nativos

- [2026-11-10] feat(importaciones): asistente de importaciones en /admin/imports/:companyId y botón "Importaciones" visible solo con módulo Aduana

- [2026-11-10] feat(consignatarios): vista de importación masiva desde SIGAD (carga, tabla de filas, diálogo de edición, ejecución y respaldo) y contenedor global de notificaciones

- [2026-10-22] fix(docker): fijar la imagen de construcción en node:24.22.1 (parche del boletín de seguridad de Node de octubre 2026) y agregar .dockerignore para no enviar node_modules/.angular/dist al contexto

- [2026-10-20] feat(suscriptores): tarjeta de capacidad con cupos (antes y después), extensión de plazo, badge de vencimiento y página de Vencimientos

- [2026-10-20] feat(suscripciones): cambio de plan del suscriptor desde el detalle y tramos por defecto obligatorios al crear un plan

- [2026-10-19] feat(devops): pipeline de QA con build en ECR y despliegue automático en el EC2 por SSM (OIDC) y URL de la API de QA en api-qa.qdoora.com

- [2026-10-09] fix(auth): la renovación de sesión ya no cierra la sesión cada hora y detecta pestañas duplicadas

- [2026-09-15] feat[core]: configuración de aduana para suscriptores e importación de plan de cuentas

- [2026-09-07] feat(sii): implementar certificacion de libros de compras y guias, resoluciones y emision de dtes de exportacion y despacho

- [2026-08-26] feat(sii): agregar envio y registro de casos para Libro de Ventas en certificacion asistida

- [2026-08-18] feat(sii): implementar módulo de certificación asistida para soporte y reemplazar cola de habilitación

- [2026-08-18] feat(sii): asistente de certificación operado por soporte, baja de la cola de habilitación y toggle de ambiente acotado a rollback

- [2026-08-16] feat(admin): incorporar selección de plan en alta de aduana y restringir planes con módulo aduana en alta general

- [2026-08-12] refactor(tickets): limpiar simulaciones y conectar servicio de tickets a endpoints reales de api

- [2026-08-05] feat(puc-sii): refactorizar auxiliar sin RUT en PUC y agregar módulo de gestión SII


- [2026-05-29] feat(clients): implementar registro de clientes con bento grid y refactorizar inputs a diseño premium tailwind

- [2026-05-26] refactor: reubicar modulo de puc-manager y componentes shared a la raiz de modules

- [2026-05-26] refactor(puc-manager): remover alerta de prueba y dependencias no utilizadas en formulario subtipo

- [2026-05-26] fix(alert): corregir alineacion y centrado de boton de cierre y refactorizar a alerta atomica segura

- [2026-05-25] style[puc]: ajustar estilos de dialogos, comportamiento de toggle y estructura responsiva

- [2026-05-25] feat(puc): implementar panel grid de plan de cuentas y corregir visualizacion de filtros con scroll

- [2026-05-25] feat(core): inicialización del portal de soporte y configuración de dependencias, layout y enrutamiento

- [2026-05-25] fix(styles): resolver incompatibilidades de apply con importantes y clases de colores personalizadas

- [2026-05-25] fix(styles): corregir definicion de colores de tema en tailwind v4 y ruta de referencia en default.scss

- [2026-05-25] fix(styles): mapear variables de color de soporte y configurar referencias relativas de estilos

- [2026-05-25] fix(navigation): migrar clases de opacidad de color a sintaxis de barra para tailwind v4

- [2026-05-25] fix(styles): agregar referencias de tailwind v4 y corregir directivas de pantalla en componentes del nucleo

- [2026-05-25] fix(navigation): agregar referencia de tailwind v4 en la apariencia de navegacion vertical

- [2026-05-25] fix(admin-puc): corregir directivas de estilos obsoletas de tailwind v4 en los dialogos

- [2026-05-25] feat(admin-puc): integrar gestor de plan único de cuentas (PUC) en el portal de soporte

- [2026-05-24] feat[subscribers]: agregar funcionalidad de forzar cambio de contraseña para suscriptores desde portal de soporte

- [2026-05-13] feat(nomina): implementar inspección de esquemas y confirmación de toggle

- [2026-05-11] feat(customs): intensificar alerta de exito en creacion de suscriptor aduana con notificacion glassmorphism

- [2026-05-05] feat(admin): implementar interfaz de Email Debugger con diseño Premium Bento y selectores reactivos

- [2026-05-04] feat(subscribers): botón de suspender cuenta con diálogo de confirmación premium

- [2026-05-04] refactor(services): parametrización de URLs de API para soporte multi-ambiente

- [2026-05-04] fix(deps): adición de dependencias faltantes (@angular/animations) para build de producción

- [2026-05-04] feat(env): implementación de sistema de ambientes (dev, qa, prod)

- [2026-05-04] feat(admin): implementacion de seleccion de agentes aduaneros y validacion reactiva

- [2026-04-30] feat[admin]: implementación de formulario compacto para creación de suscriptor aduana con señales y validación de RUT

- [2026-04-25] feat(security): implementar autenticación de soporte empresarial y endurecimiento de seguridad

- [2026-04-25] feat(auth): [security] extraer rol de usuario de los claims firmados del JWT (QD-01)

- [2026-04-22] feat(ui): modernizar el directorio de suscriptores con un panel forense y detalles premium
