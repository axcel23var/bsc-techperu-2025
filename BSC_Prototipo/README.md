# BSC — Prototipo interactivo de gestión estratégica

## Ejecutar
1. Descomprime `BSC_Prototipo.zip`.
2. Abre `index.html` con Chrome, Edge, Firefox o Safari.
3. Credenciales de demostración:
   - Administrador: `admin@demo.com` / `BSC2026!`
   - Gerente: `gerente@demo.com` / `BSC2026!`
   - Responsable: `responsable@demo.com` / `BSC2026!`

El proyecto usa HTML, CSS y JavaScript sin proceso de compilación. Chart.js se carga desde CDN para gráficos; si no hay conexión a Internet, la aplicación y los módulos CRUD siguen funcionando, pero los gráficos pueden no mostrarse.

## Estructura
- `index.html`: acceso y shell de la aplicación.
- `css/styles.css`: estilos responsivos.
- `js/app.js`: datos de demostración, lógica de negocio, navegación, formularios, persistencia y exportación.
- `html/`: carpeta reservada para ampliar pantallas HTML independientes si se requiere separar la SPA en páginas físicas.

## Módulos
Dashboard, mapa estratégico, objetivos, KPI, registro de mediciones, iniciativas, reportes y administración.

## Lógica de cumplimiento
- Mayor es mejor: `resultado / meta × 100`, limitado a 150% para la visualización.
- Menor es mejor: 100% cuando el resultado es igual o mejor que la meta; si la supera, `meta / resultado × 100`.
- Rango: 100% dentro del rango y disminución proporcional fuera de sus límites.
- Estados: cumplido ≥ 100%; alerta ≥ umbral de alerta; en riesgo ≥ umbral crítico; crítico por debajo del umbral crítico. Los umbrales son configurables en el KPI.
- Cumplimiento global: promedio ponderado de KPI con datos dentro de cada objetivo; promedio ponderado de objetivos dentro de cada perspectiva; perspectivas con peso igual (25%). KPI sin datos quedan excluidos del cálculo, no se cuentan como cumplidos.

## Persistencia y límites
- Los datos se guardan en `localStorage` y la sesión de acceso en `sessionStorage`.
- La autenticación es simulada y las contraseñas de demostración están definidas en el código. No usar para producción.
- No hay backend, base de datos multiusuario ni control de acceso de servidor.
- Exportación CSV y JSON se realiza localmente. Imprimir permite usar la opción “Guardar como PDF” del navegador.

## Validación técnica realizada
El JavaScript se verifica con `node --check`. Este proyecto está diseñado para abrirse desde `index.html`; no requiere servidor local.
