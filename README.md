# Control de mesas 2026

Aplicación web para registrar y dar seguimiento a miembros de mesa por coordinador. Permite editar nombre, DNI, celular, estado de contacto, observaciones y verificación; importar y exportar Excel; abrir mensajes de WhatsApp y generar informes PDF.

Producción: <https://coordinador-mesa-onpe-2026.vercel.app>

## Requisitos para ejecutarla

- Node.js 20 o superior.
- Una conexión a internet para la sincronización inicial con Firestore.

No se requiere `GEMINI_API_KEY` ni otro archivo `.env` para iniciar esta versión.

```bash
npm install
npm run dev
```

Vite inicia el sitio en `http://localhost:3000`.

Comandos disponibles:

```bash
npm run lint    # comprobación de tipos TypeScript
npm run build   # compilación de producción
npm run preview # sirve la compilación local
```

## Flujo de uso

1. Abra la aplicación e ingrese su DNI.
2. Si el DNI no tiene un perfil registrado, complete nombre, mesas asignadas, celular opcional y PIN.
3. La aplicación crea nueve cargos vacíos por cada mesa indicada: presidente, secretario, tercer miembro y seis suplentes.
4. Complete los datos de cada miembro desde las tarjetas o desde la tabla.
5. Los cambios se guardan localmente de inmediato y se sincronizan con Firestore cuando hay conexión.
6. Use el seguro global `PROTEGIDO / EDITAR` para impedir o permitir cambios accidentales en el navegador actual.

En aperturas posteriores en el mismo navegador se pide el PIN guardado localmente. El perfil se lee primero desde `localStorage`; la actualización desde Firestore se realiza en segundo plano.

## Datos y rutas en Firestore

La aplicación usa un único proyecto y una única base Firestore. No crea una base física por cada coordinador.

Cada coordinador se organiza por DNI en estas rutas:

```text
coordinadores/{dni}/config/perfil
coordinadores/{dni}/miembros/{memberId}
```

`perfil` contiene el nombre, DNI, celular, PIN y mesas asignadas. Cada documento de `miembros` contiene un cargo de una mesa.

Además, el navegador guarda dos copias locales:

```text
onpe_coord_v4                         # perfil usado para el acceso rápido
onpe_members_data_backup_{dni}        # última lista de miembros del coordinador
```

La caché persistente de Firestore también conserva escrituras pendientes para enviarlas al recuperar la conexión.

### Limitación de seguridad actual

El PIN se verifica en el navegador y las reglas actuales de `firestore.rules` permiten lectura y escritura sin autenticación de Firebase. Por ello, las rutas por DNI separan los datos en la estructura de la aplicación, pero **no son un mecanismo de privacidad o autorización fuerte**. Para uso con datos sensibles o varios usuarios no confiables debe implementarse Firebase Authentication y reglas que validen el usuario autenticado antes de publicar.

## Excel: descargar, llenar y volver a subir

El botón **Plantilla Excel** genera un archivo con dos hojas:

- `Control de Mesas`: filas de los miembros.
- `Resumen y Estadísticas`: conteos por mesa.

La hoja `Control de Mesas` tiene estas columnas:

| Columna | Uso |
| --- | --- |
| Mesa | Identifica la mesa. |
| Cargo / condición | Identifica el cargo dentro de la mesa. |
| Nombre completo | Nombre y apellidos. |
| DNI | Documento del miembro. |
| Celular | Teléfono del miembro. |
| Contactar por WhatsApp | Enlace generado por el archivo. |
| Estado de contacto | Pendiente, Confirmado, No responde o Número incorrecto. |
| Observaciones | Nota libre. |
| Verificado | Sí o No. |

Para importar:

1. Descargue la plantilla desde la aplicación.
2. Complete o modifique las filas.
3. No cambie las columnas **Mesa** y **Cargo / condición** si desea que una fila actualice el cargo correcto.
4. Pulse **Subir Excel** y seleccione un archivo `.xlsx` o `.xls`.

La importación exige que existan las columnas Mesa y Cargo. Busca una coincidencia por mesa y cargo, y actualiza únicamente esa fila. Las filas de la aplicación que no estén en el archivo no se eliminan.

## PDF

**Informe PDF** genera un archivo con los datos actuales.

- Si está seleccionada una mesa, se genera una página A4 para esa mesa.
- Si está seleccionado `Todas`, se genera una página A4 independiente para cada mesa.
- Cada página incluye coordinador, DNI, contacto, métricas de la mesa, tabla de miembros, firma y numeración.

## WhatsApp

El botón **Enviar WhatsApp** aparece cuando el celular tiene al menos nueve dígitos válidos. Abre WhatsApp Business cuando el dispositivo lo soporta; en escritorio abre WhatsApp Web. El mensaje usa el nombre, DNI y celular del coordinador que inició sesión.

## Estructura principal

```text
src/
  App.tsx                         estado, sincronización y acciones principales
  components/AuthGate.tsx         registro, DNI y PIN local
  components/MobileCardList.tsx   edición en tarjetas
  components/MesaTable.tsx        edición en tabla
  components/QuickRestoreModal.tsx importación de Excel
  firebase.ts                     inicialización y rutas de Firestore
  utils/excelImport.ts            lectura de archivos Excel
  utils/excelExport.ts            generación de plantilla Excel
  utils/pdfExport.ts              generación del informe PDF
firestore.rules                   reglas activas de Firestore
firebase-applet-config.json       configuración pública del proyecto Firebase
```

## Verificación antes de publicar

Ejecute al menos:

```bash
npm run lint
npm run build
```

En producción, Vercel ejecuta `vite build`. Compruebe además estos casos manualmente: crear un perfil nuevo, editar un miembro, recargar, importar la plantilla descargada y descargar un PDF con más de una mesa.
