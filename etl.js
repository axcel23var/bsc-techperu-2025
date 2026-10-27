const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const excelFile = path.join(__dirname, 'BSC_TechPeru_Ampliado_2025.xlsx');
if (!fs.existsSync(excelFile)) {
  console.error('No se encontró el archivo Excel:', excelFile);
  process.exit(1);
}

const wb = xlsx.readFile(excelFile);

const perspectivesMeta = {
  financiera: {
    id: "financiera",
    label: "Financiera",
    color: "#3478e5",
    soft: "#edf4ff",
    weight: 25,
    sheetName: "💰 Financiera",
    defaultOwner: "Patricia Ramos",
    defaultArea: "Finanzas y Contabilidad"
  },
  clientes: {
    id: "clientes",
    label: "Clientes",
    color: "#18a875",
    soft: "#eaf8f1",
    weight: 25,
    sheetName: "👥 Clientes",
    defaultOwner: "Jorge Salcedo",
    defaultArea: "Gerencia Comercial"
  },
  procesos: {
    id: "procesos",
    label: "Procesos internos",
    color: "#e99a2d",
    soft: "#fff5e6",
    weight: 25,
    sheetName: "🔧 Procesos",
    defaultOwner: "María Valdivia",
    defaultArea: "Operaciones y Calidad"
  },
  aprendizaje: {
    id: "aprendizaje",
    label: "Aprendizaje y crecimiento",
    color: "#8b6bd6",
    soft: "#f2edff",
    weight: 25,
    sheetName: "📚 Aprendizaje",
    defaultOwner: "Lucía Paredes",
    defaultArea: "Gestión del Talento Humano"
  }
};

const users = [
  { id: "u1", name: "Carlos Mendoza", email: "admin@demo.com", role: "Administrador", area: "Gerencia General", password: "BSC2026!" },
  { id: "u2", name: "Patricia Ramos", email: "gerente@demo.com", role: "Gerente", area: "Finanzas y Contabilidad", password: "BSC2026!" },
  { id: "u3", name: "Jorge Salcedo", email: "jorge.salcedo@techperu.com", role: "Gerente", area: "Gerencia Comercial", password: "BSC2026!" },
  { id: "u4", name: "María Valdivia", email: "responsable@demo.com", role: "Responsable de indicadores", area: "Operaciones y Calidad", password: "BSC2026!" },
  { id: "u5", name: "Andrés Castro", email: "andres.castro@techperu.com", role: "Gerente", area: "Innovación y Desarrollo", password: "BSC2026!" },
  { id: "u6", name: "Elena Morales", email: "elena.morales@techperu.com", role: "Responsable de indicadores", area: "Logística y Compras", password: "BSC2026!" },
  { id: "u7", name: "Lucía Paredes", email: "lucia.paredes@techperu.com", role: "Gerente", area: "Gestión del Talento Humano", password: "BSC2026!" },
  { id: "u8", name: "Diego Herrera", email: "diego.herrera@techperu.com", role: "Responsable de indicadores", area: "Tecnología y TI", password: "BSC2026!" }
];

const objectiveDescriptions = {
  "OBJ-F1": "Mejorar la rentabilidad del negocio optimizando el rendimiento sobre el capital y márgenes operativos.",
  "OBJ-F2": "Impulsar el crecimiento sostenido de las ventas mediante expansión comercial y diversificación de productos.",
  "OBJ-F3": "Aumentar la eficiencia en el uso de recursos operativos, reduciendo costos unitarios y gastos de adquisición.",
  "OBJ-F4": "Optimizar la liquidez corriente y agilizar los días de cobro para maximizar la eficiencia del capital de trabajo.",
  "OBJ-F5": "Maximizar la rentabilidad en la unidad de soluciones Cloud y elevar el valor de vida del cliente corporativo.",

  "OBJ-C1": "Brindar una experiencia superior y consistente que maximice la satisfacción y resuelva quejas con agilidad.",
  "OBJ-C2": "Fidelizar a la cartera actual de clientes incrementando la recompra y reduciendo la tasa de abandono (churn).",
  "OBJ-C3": "Captar nuevos segmentos de mercado e incrementar la cuota de participación con costos de adquisición eficientes.",
  "OBJ-C4": "Fortalecer la autogestión de clientes B2B mediante plataformas digitales y reducir tiempos de cotización.",
  "OBJ-C5": "Consolidar alianzas a largo plazo asegurando la renovación contractual y fomentando la venta cruzada.",

  "OBJ-P1": "Asegurar la excelencia operativa, reduciendo tiempos de entrega y tasas de defectos en productos y servicios.",
  "OBJ-P2": "Acelerar el ciclo de desarrollo e introducción de soluciones innovadoras que generen nuevos flujos de ingresos.",
  "OBJ-P3": "Garantizar una cadena de suministro ágil y confiable con alto cumplimiento de entregas y control de inventarios.",
  "OBJ-P4": "Garantizar alta disponibilidad en servicios tecnológicos corporativos y rápida mitigación de incidentes.",
  "OBJ-P5": "Acelerar la rotación del inventario de hardware tecnológico y optimizar los tiempos de resolución de garantías RMA.",

  "OBJ-A1": "Capacitar y certificar a los colaboradores en competencias estratégicas y planes de desarrollo profesional.",
  "OBJ-A2": "Fomentar un clima organizacional de alta motivación, sentido de pertenencia y baja rotación laboral.",
  "OBJ-A3": "Consolidar una cultura de mejora continua e innovación que traduzca ideas de empleados en proyectos activos.",
  "OBJ-A4": "Acreditar a ingenieros y consultores en certificaciones oficiales e incrementar la inversión por colaborador.",
  "OBJ-A5": "Retener al talento especializado crítico y consolidar la base del conocimiento corporativo (KMS)."
};

const kpiStaffMapping = {
  // Financiera
  "ROE – Retorno sobre Patrimonio": { owner: "Patricia Ramos", area: "Finanzas y Contabilidad" },
  "Margen EBITDA": { owner: "Patricia Ramos", area: "Finanzas y Contabilidad" },
  "Utilidad Neta Anual": { owner: "Patricia Ramos", area: "Finanzas y Contabilidad" },
  "Crecimiento de Ventas YoY": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Ingresos Totales Anuales": { owner: "Patricia Ramos", area: "Finanzas y Contabilidad" },
  "Ingresos por Nuevos Productos": { owner: "Andrés Castro", area: "Innovación y Desarrollo" },
  "Ratio Costo Operativo / Ingreso": { owner: "Patricia Ramos", area: "Finanzas y Contabilidad" },
  "Costo de Adquisición de Cliente (CAC)": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Retorno sobre Activos (ROA)": { owner: "Patricia Ramos", area: "Finanzas y Contabilidad" },

  // Clientes
  "NPS – Net Promoter Score": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "CSAT – Satisfacción post-venta": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Tiempo de Resolución de Quejas": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Tasa de Retención de Clientes": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Tasa de Recompra (Repeat Purchase)": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Churn Rate (Tasa de Abandono)": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Nuevos Clientes Adquiridos": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Cuota de Mercado": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },
  "Costo por Lead Calificado": { owner: "Jorge Salcedo", area: "Gerencia Comercial" },

  // Procesos
  "Tiempo Promedio de Entrega al Cliente": { owner: "María Valdivia", area: "Operaciones y Calidad" },
  "Tasa de Defectos / Reclamos": { owner: "María Valdivia", area: "Operaciones y Calidad" },
  "Productividad por Empleado": { owner: "María Valdivia", area: "Operaciones y Calidad" },
  "N° Lanzamientos de Nuevos Productos": { owner: "Andrés Castro", area: "Innovación y Desarrollo" },
  "Time-to-Market (lanzamiento)": { owner: "Andrés Castro", area: "Innovación y Desarrollo" },
  "% Ingresos de Productos < 2 años": { owner: "Andrés Castro", area: "Innovación y Desarrollo" },
  "On-Time Delivery de Proveedores (OTD)": { owner: "Elena Morales", area: "Logística y Compras" },
  "N° Incidencias con Proveedores": { owner: "Elena Morales", area: "Logística y Compras" },
  "Costo de Inventario sobre Ventas": { owner: "Elena Morales", area: "Logística y Compras" },

  // Aprendizaje
  "Horas de Capacitación por Empleado": { owner: "Lucía Paredes", area: "Gestión del Talento Humano" },
  "% Empleados con Plan de Desarrollo": { owner: "Lucía Paredes", area: "Gestión del Talento Humano" },
  "Índice de Competencias Clave Cubiertas": { owner: "Lucía Paredes", area: "Gestión del Talento Humano" },
  "Índice de Satisfacción del Empleado": { owner: "Lucía Paredes", area: "Gestión del Talento Humano" },
  "Rotación de Personal (Turnover)": { owner: "Lucía Paredes", area: "Gestión del Talento Humano" },
  "% Empleados con Evaluación Desempeño": { owner: "Lucía Paredes", area: "Gestión del Talento Humano" },
  "Proyectos de Mejora Continua Activos": { owner: "María Valdivia", area: "Operaciones y Calidad" },
  "% Presupuesto I+D sobre Ingresos": { owner: "Andrés Castro", area: "Innovación y Desarrollo" },
  "Ideas Implementadas de Empleados": { owner: "Diego Herrera", area: "Tecnología y TI" }
};

const months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10"];

const objectivesMap = new Map();
const kpis = [];

let kpiCounter = 1;

// 1. Extraer los 12 Objetivos y 36 KPIs oficiales del Excel
for (const [perspKey, persp] of Object.entries(perspectivesMeta)) {
  const sheet = wb.Sheets[persp.sheetName];
  if (!sheet) continue;
  const range = xlsx.utils.decode_range(sheet['!ref']);
  let currentObjId = null;

  for (let r = 2; r <= range.e.r; r++) {
    const objCell = sheet[xlsx.utils.encode_cell({ r, c: 1 })];
    const kpiCell = sheet[xlsx.utils.encode_cell({ r, c: 2 })];
    const unitCell = sheet[xlsx.utils.encode_cell({ r, c: 3 })];
    const metaCell = sheet[xlsx.utils.encode_cell({ r, c: 4 })];
    const realCell = sheet[xlsx.utils.encode_cell({ r, c: 5 })];
    const pctCell = sheet[xlsx.utils.encode_cell({ r, c: 6 })];
    const stateCell = sheet[xlsx.utils.encode_cell({ r, c: 7 })];
    const actionCell = sheet[xlsx.utils.encode_cell({ r, c: 8 })];

    if (objCell && objCell.v && String(objCell.v).trim().startsWith('OBJ-')) {
      const fullObjStr = String(objCell.v).trim();
      const parts = fullObjStr.split(':');
      currentObjId = parts[0].trim();
      const objName = parts.slice(1).join(':').trim();

      if (!objectivesMap.has(currentObjId)) {
        objectivesMap.set(currentObjId, {
          id: currentObjId,
          name: objName,
          perspective: perspKey,
          description: objectiveDescriptions[currentObjId] || `Objetivo estratégico de la perspectiva ${persp.label}.`,
          owner: persp.defaultOwner,
          priority: "Alta",
          weight: 20,
          status: 'Activo',
          created: '2025-01-02'
        });
      }
    }

    if (kpiCell && kpiCell.v && String(kpiCell.v).trim()) {
      const kpiName = String(kpiCell.v).trim();
      const unit = unitCell ? String(unitCell.v).trim() : '%';
      const meta = metaCell ? Number(metaCell.v) : 0;
      const real = realCell ? Number(realCell.v) : 0;
      const formula = pctCell ? String(pctCell.f || '') : '';
      const roundMatch = formula.match(/ROUND\(([A-Z0-9]+)\/([A-Z0-9]+)/i);
      const isInverse = Boolean(roundMatch && roundMatch[1].startsWith('E') && roundMatch[2].startsWith('F'));
      const direction = isInverse ? 'inverso' : 'directo';

      let pct = pctCell && pctCell.v !== undefined ? Number(Number(pctCell.v).toFixed(1)) : null;
      if (pct === null) {
        const rawPct = isInverse ? (real > 0 ? (meta / real * 100) : 0) : (meta > 0 ? (real / meta * 100) : 0);
        pct = Number(rawPct.toFixed(1));
      }

      let status = 'LOGRADO';
      let statusKey = 'good';
      let statusLabel = '✅ LOGRADO';
      if (pct >= 90) {
        status = 'LOGRADO';
        statusKey = 'good';
        statusLabel = '✅ LOGRADO';
      } else if (pct >= 75) {
        status = 'EN RIESGO';
        statusKey = 'warn';
        statusLabel = '⚠️ EN RIESGO';
      } else {
        status = 'CRÍTICO';
        statusKey = 'bad';
        statusLabel = '❌ CRÍTICO';
      }

      const staff = kpiStaffMapping[kpiName] || { owner: persp.defaultOwner, area: persp.defaultArea };
      const kpiId = `KPI-${String(kpiCounter).padStart(2, '0')}`;
      kpiCounter++;

      const baseline = isInverse ? Number((meta * 1.25).toFixed(2)) : Number((meta * 0.75).toFixed(2));
      const measurements = months.map((m, idx) => {
        const step = (idx + 1) / months.length;
        let v;
        if (isInverse) {
          v = Number((baseline - (baseline - real) * step + (idx % 2 === 0 ? 0.05 * real : -0.03 * real)).toFixed(2));
        } else {
          v = Number((baseline + (real - baseline) * step + (idx % 2 === 0 ? -0.02 * real : 0.03 * real)).toFixed(2));
        }
        if (idx === months.length - 1) v = real;
        return {
          id: `M-${kpiId}-${m}`,
          period: m,
          date: `${m}-28`,
          value: v,
          notes: idx === months.length - 1 ? (actionCell ? String(actionCell.v).trim() : "Cierre acumulado 2025") : "Medición mensual de seguimiento",
          responsible: staff.owner
        };
      });

      kpis.push({
        id: kpiId,
        name: kpiName,
        perspective: perspKey,
        objectiveId: currentObjId,
        unit: unit,
        formula: isInverse ? `(Meta / Real) × 100` : `(Real / Meta) × 100`,
        baseline: baseline,
        target: meta,
        current: real,
        direction: direction,
        pct: pct,
        status: status,
        statusKey: statusKey,
        statusLabel: statusLabel,
        frequency: "Mensual",
        owner: staff.owner,
        area: staff.area,
        weight: 1,
        alertAt: 75,
        criticalAt: 75,
        analysis: actionCell ? String(actionCell.v).trim() : "",
        measurements: measurements
      });
    }
  }
}

// 2. Definir los 8 nuevos objetivos para completar exactamente 5 por perspectiva (20 en total)
const newObjectivesDefs = [
  // Financiera (OBJ-F4, OBJ-F5)
  {
    id: "OBJ-F4",
    name: "Optimizar la Liquidez y Gestión del Capital de Trabajo",
    perspective: "financiera",
    owner: "Patricia Ramos",
    area: "Finanzas y Contabilidad",
    priority: "Alta",
    weight: 20,
    kpis: [
      {
        name: "DSO – Días de Cobro Pendientes",
        unit: "días",
        target: 45,
        current: 48,
        direction: "inverso",
        analysis: "DSO en 48 días vs meta de 45 días (93.8% cumplimiento). Reforzar seguimiento de cuentas por cobrar y facturación preventiva."
      },
      {
        name: "Ratio de Liquidez Corriente",
        unit: "ratio",
        target: 1.6,
        current: 1.5,
        direction: "directo",
        analysis: "Liquidez corriente en 1.5 vs meta de 1.6 (93.8% cumplimiento). Mantiene solvencia operativa de corto plazo adecuada."
      }
    ]
  },
  {
    id: "OBJ-F5",
    name: "Maximizar la Rentabilidad de Servicios Cloud y Consultoría",
    perspective: "financiera",
    owner: "Patricia Ramos",
    area: "Finanzas y Contabilidad",
    priority: "Alta",
    weight: 20,
    kpis: [
      {
        name: "Margen Bruto en Servicios Cloud",
        unit: "%",
        target: 32,
        current: 29.5,
        direction: "directo",
        analysis: "Margen bruto en 29.5% frente a meta de 32% (92.2% cumplimiento). Optimizar consumo de instancias e infraestructura reservada."
      },
      {
        name: "LTV Corporativo (Valor del Cliente)",
        unit: "S/ k",
        target: 85,
        current: 82,
        direction: "directo",
        analysis: "LTV en S/ 82k frente a meta de S/ 85k (96.5% cumplimiento). Incentivar contratos multianuales de servicios administrados."
      }
    ]
  },

  // Clientes (OBJ-C4, OBJ-C5)
  {
    id: "OBJ-C4",
    name: "Fortalecer la Experiencia Digital y Autogestión B2B",
    perspective: "clientes",
    owner: "Jorge Salcedo",
    area: "Gerencia Comercial",
    priority: "Alta",
    weight: 20,
    kpis: [
      {
        name: "Adopción del Portal B2B",
        unit: "%",
        target: 65,
        current: 58,
        direction: "directo",
        analysis: "Adopción de portal en 58% vs meta de 65% (89.2% - En Riesgo). Capacitar a compradores corporativos y habilitar cotizador exprés."
      },
      {
        name: "FRT – Tiempo de Respuesta en Cotizaciones",
        unit: "hrs",
        target: 2.0,
        current: 2.4,
        direction: "inverso",
        analysis: "Tiempo de primera respuesta en 2.4h vs meta de 2.0h (83.3% - En Riesgo). Estandarizar catálogo de precios y SLAs comerciales."
      }
    ]
  },
  {
    id: "OBJ-C5",
    name: "Consolidar Alianzas Estratégicas y Cuentas Clave",
    perspective: "clientes",
    owner: "Jorge Salcedo",
    area: "Gerencia Comercial",
    priority: "Alta",
    weight: 20,
    kpis: [
      {
        name: "Tasa de Renovación de Contratos Anuales",
        unit: "%",
        target: 92,
        current: 89,
        direction: "directo",
        analysis: "Renovación en 89% vs meta de 92% (96.7% cumplimiento). Implementar revisiones trimestrales de valor con cuentas Enterprise."
      },
      {
        name: "Venta Cruzada en Cuentas Top (Cross-Sell)",
        unit: "%",
        target: 28,
        current: 24,
        direction: "directo",
        analysis: "Venta cruzada en 24% vs meta de 28% (85.7% - En Riesgo). Ofrecer paquetes de ciberseguridad y servicios cloud complementarios."
      }
    ]
  },

  // Procesos Internos (OBJ-P4, OBJ-P5)
  {
    id: "OBJ-P4",
    name: "Asegurar la Continuidad Operativa y Ciberseguridad TI",
    perspective: "procesos",
    owner: "María Valdivia",
    area: "Operaciones y Calidad",
    priority: "Alta",
    weight: 20,
    kpis: [
      {
        name: "Disponibilidad de Servicios TI (Uptime SLA)",
        unit: "%",
        target: 99.8,
        current: 99.6,
        direction: "directo",
        analysis: "Uptime en 99.6% vs meta de 99.8% (99.8% cumplimiento). Alta estabilidad garantizada con arquitectura redundante."
      },
      {
        name: "MTTR – Tiempo Promedio de Resolución de Incidentes TI",
        unit: "hrs",
        target: 1.5,
        current: 1.8,
        direction: "inverso",
        analysis: "MTTR en 1.8h vs meta de 1.5h (83.3% - En Riesgo). Automatizar playbooks de diagnóstico y escalamiento en NOC/SOC."
      }
    ]
  },
  {
    id: "OBJ-P5",
    name: "Optimizar la Cadena de Suministro y Gestión de Garantías RMA",
    perspective: "procesos",
    owner: "Elena Morales",
    area: "Logística y Compras",
    priority: "Media",
    weight: 20,
    kpis: [
      {
        name: "Rotación de Inventario de Hardware",
        unit: "veces",
        target: 6.0,
        current: 5.2,
        direction: "directo",
        analysis: "Rotación en 5.2 vs meta de 6.0 veces/año (86.7% - En Riesgo). Mejorar la previsión de demanda en modelos de alta rotación."
      },
      {
        name: "Tiempo de Gestión de Garantías (RMA)",
        unit: "días",
        target: 5.0,
        current: 6.2,
        direction: "inverso",
        analysis: "Tiempo de RMA en 6.2 días frente a 5.0 días meta (80.6% - En Riesgo). Acordar canal prioritario con mayoristas oficiales."
      }
    ]
  },

  // Aprendizaje y Crecimiento (OBJ-A4, OBJ-A5)
  {
    id: "OBJ-A4",
    name: "Desarrollar Especialización Técnica y Certificaciones Oficiales",
    perspective: "aprendizaje",
    owner: "Lucía Paredes",
    area: "Gestión del Talento Humano",
    priority: "Alta",
    weight: 20,
    kpis: [
      {
        name: "Especialistas TI con Certificación Vigente",
        unit: "%",
        target: 75,
        current: 68,
        direction: "directo",
        analysis: "68% certificados frente a meta de 75% (90.7% cumplimiento). Subsidiar vouchers de certificación en AWS, Azure y Fortinet."
      },
      {
        name: "Inversión Anual en Formación por Colaborador",
        unit: "S/",
        target: 1800,
        current: 1650,
        direction: "directo",
        analysis: "Inversión en S/ 1,650 vs meta de S/ 1,800 (91.7% cumplimiento). Asignar remanente a laboratorios y bootcamps prácticos."
      }
    ]
  },
  {
    id: "OBJ-A5",
    name: "Fortalecer la Retención de Talento Crítico y Base del Conocimiento",
    perspective: "aprendizaje",
    owner: "Lucía Paredes",
    area: "Gestión del Talento Humano",
    priority: "Alta",
    weight: 20,
    kpis: [
      {
        name: "Tasa de Retención de Talento Clave",
        unit: "%",
        target: 95,
        current: 91,
        direction: "directo",
        analysis: "Retención en 91% vs meta de 95% (95.8% cumplimiento). Fomentar planes de carrera técnica y flexibilidad híbrida."
      },
      {
        name: "Cobertura de Documentación en KMS (Base del Conocimiento)",
        unit: "%",
        target: 85,
        current: 80,
        direction: "directo",
        analysis: "Cobertura en 80% vs meta de 85% (94.1% cumplimiento). Asegurar que toda arquitectura de proyectos quede documentada en el KMS."
      }
    ]
  }
];

// Integrar los 8 nuevos objetivos y sus 16 KPIs
newObjectivesDefs.forEach(objDef => {
  objectivesMap.set(objDef.id, {
    id: objDef.id,
    name: objDef.name,
    perspective: objDef.perspective,
    description: objectiveDescriptions[objDef.id] || `Objetivo estratégico de ${objDef.perspective}.`,
    owner: objDef.owner,
    priority: objDef.priority,
    weight: objDef.weight,
    status: 'Activo',
    created: '2025-01-05'
  });

  objDef.kpis.forEach(kDef => {
    const kpiId = `KPI-${String(kpiCounter).padStart(2, '0')}`;
    kpiCounter++;

    const isInverse = kDef.direction === "inverso";
    const rawPct = isInverse ? (kDef.current > 0 ? (kDef.target / kDef.current * 100) : 0) : (kDef.target > 0 ? (kDef.current / kDef.target * 100) : 0);
    const pct = Number(rawPct.toFixed(1));

    let status = 'LOGRADO';
    let statusKey = 'good';
    let statusLabel = '✅ LOGRADO';
    if (pct >= 90) {
      status = 'LOGRADO';
      statusKey = 'good';
      statusLabel = '✅ LOGRADO';
    } else if (pct >= 75) {
      status = 'EN RIESGO';
      statusKey = 'warn';
      statusLabel = '⚠️ EN RIESGO';
    } else {
      status = 'CRÍTICO';
      statusKey = 'bad';
      statusLabel = '❌ CRÍTICO';
    }

    const baseline = isInverse ? Number((kDef.target * 1.25).toFixed(2)) : Number((kDef.target * 0.75).toFixed(2));
    const measurements = months.map((m, idx) => {
      const step = (idx + 1) / months.length;
      let v;
      if (isInverse) {
        v = Number((baseline - (baseline - kDef.current) * step + (idx % 2 === 0 ? 0.04 * kDef.current : -0.02 * kDef.current)).toFixed(2));
      } else {
        v = Number((baseline + (kDef.current - baseline) * step + (idx % 2 === 0 ? -0.02 * kDef.current : 0.03 * kDef.current)).toFixed(2));
      }
      if (idx === months.length - 1) v = kDef.current;
      return {
        id: `M-${kpiId}-${m}`,
        period: m,
        date: `${m}-28`,
        value: v,
        notes: idx === months.length - 1 ? kDef.analysis : "Medición mensual de seguimiento",
        responsible: objDef.owner
      };
    });

    kpis.push({
      id: kpiId,
      name: kDef.name,
      perspective: objDef.perspective,
      objectiveId: objDef.id,
      unit: kDef.unit,
      formula: isInverse ? `(Meta / Real) × 100` : `(Real / Meta) × 100`,
      baseline: baseline,
      target: kDef.target,
      current: kDef.current,
      direction: kDef.direction,
      pct: pct,
      status: status,
      statusKey: statusKey,
      statusLabel: statusLabel,
      frequency: "Mensual",
      owner: objDef.owner,
      area: objDef.area,
      weight: 1,
      alertAt: 75,
      criticalAt: 75,
      analysis: kDef.analysis,
      measurements: measurements
    });
  });
});

const objectives = Array.from(objectivesMap.values());

const initiatives = [
  {
    id: "INI-01",
    name: "Optimización de Estructura de Capital y Refinanciamiento",
    objectiveId: "OBJ-F1",
    kpiId: "KPI-01",
    owner: "Patricia Ramos",
    area: "Finanzas y Contabilidad",
    start: "2025-01-15",
    end: "2025-11-30",
    budget: 65000,
    progress: 85,
    status: "En ejecución",
    description: "Revisar la deuda corporativa y reducir gastos financieros para proteger ROE y EBITDA."
  },
  {
    id: "INI-02",
    name: "Pipeline Comercial 2.0 y Campaña de Cross-Selling",
    objectiveId: "OBJ-F2",
    kpiId: "KPI-04",
    owner: "Jorge Salcedo",
    area: "Gerencia Comercial",
    start: "2025-02-01",
    end: "2025-12-15",
    budget: 95000,
    progress: 75,
    status: "En ejecución",
    description: "Impulsar ventas YoY mediante programas de venta cruzada y captación en cuentas corporativas."
  },
  {
    id: "INI-03",
    name: "Plan de Eficiencia Operativa y Control de Costos (Opex)",
    objectiveId: "OBJ-F3",
    kpiId: "KPI-07",
    owner: "Patricia Ramos",
    area: "Finanzas y Contabilidad",
    start: "2025-03-01",
    end: "2025-10-31",
    budget: 45000,
    progress: 90,
    status: "En ejecución",
    description: "Reducción de costos operativos y optimización del costo de adquisición de clientes."
  },
  {
    id: "INI-04",
    name: "Gestión Integral de Cobranza y Optimización de Capital de Trabajo",
    objectiveId: "OBJ-F4",
    kpiId: "KPI-37",
    owner: "Patricia Ramos",
    area: "Finanzas y Contabilidad",
    start: "2025-02-01",
    end: "2025-11-30",
    budget: 35000,
    progress: 70,
    status: "En ejecución",
    description: "Reducir el DSO a 45 días mediante recordatorios automatizados y acuerdos de pronto pago."
  },
  {
    id: "INI-05",
    name: "Centro de Excelencia Cloud y Empaquetamiento de Servicios",
    objectiveId: "OBJ-F5",
    kpiId: "KPI-39",
    owner: "Patricia Ramos",
    area: "Finanzas y Contabilidad",
    start: "2025-03-15",
    end: "2025-12-31",
    budget: 80000,
    progress: 60,
    status: "En ejecución",
    description: "Elevar margen bruto al 32% y fidelizar clientes corporativos con contratos de alto valor LTV."
  },
  {
    id: "INI-06",
    name: "Mesa de Ayuda Nivel 2 y Resolución Ágil de Reclamos",
    objectiveId: "OBJ-C1",
    kpiId: "KPI-12",
    owner: "Jorge Salcedo",
    area: "Gerencia Comercial",
    start: "2025-02-15",
    end: "2025-09-30",
    budget: 40000,
    progress: 70,
    status: "En ejecución",
    description: "Disminuir el tiempo de resolución de quejas a menos de 2 días y elevar el NPS a 65 pts."
  },
  {
    id: "INI-07",
    name: "Portal de Autoservicio y Cotizaciones B2B Automatizadas",
    objectiveId: "OBJ-C4",
    kpiId: "KPI-41",
    owner: "Jorge Salcedo",
    area: "Gerencia Comercial",
    start: "2025-04-01",
    end: "2025-11-30",
    budget: 50000,
    progress: 65,
    status: "En ejecución",
    description: "Elevar la adopción del portal al 65% y reducir el tiempo de primera respuesta a 2.0 horas."
  },
  {
    id: "INI-08",
    name: "Programa de Fidelización B2B y Gestión de Cuentas Clave",
    objectiveId: "OBJ-C5",
    kpiId: "KPI-43",
    owner: "Jorge Salcedo",
    area: "Gerencia Comercial",
    start: "2025-03-15",
    end: "2025-12-20",
    budget: 55000,
    progress: 60,
    status: "En ejecución",
    description: "Garantizar el 92% de renovación y acelerar la venta cruzada en el segmento Enterprise."
  },
  {
    id: "INI-09",
    name: "Estandarización y Control de Calidad en Almacén / Despacho",
    objectiveId: "OBJ-P1",
    kpiId: "KPI-20",
    owner: "María Valdivia",
    area: "Operaciones y Calidad",
    start: "2025-01-10",
    end: "2025-08-31",
    budget: 50000,
    progress: 80,
    status: "En ejecución",
    description: "Reducir la tasa de defectos del 2.8% al 2.0% e implementar control de calidad por etapas."
  },
  {
    id: "INI-10",
    name: "Centro de Operaciones de Ciberseguridad (SOC) y Monitoreo SLA",
    objectiveId: "OBJ-P4",
    kpiId: "KPI-45",
    owner: "María Valdivia",
    area: "Operaciones y Calidad",
    start: "2025-02-01",
    end: "2025-12-15",
    budget: 90000,
    progress: 75,
    status: "En ejecución",
    description: "Garantizar 99.8% de disponibilidad y reducir MTTR ante incidentes a menos de 1.5 horas."
  },
  {
    id: "INI-11",
    name: "Modernización Logística JIT y Gestión Ágil de Garantías RMA",
    objectiveId: "OBJ-P5",
    kpiId: "KPI-48",
    owner: "Elena Morales",
    area: "Logística y Compras",
    start: "2025-03-01",
    end: "2025-10-31",
    budget: 40000,
    progress: 55,
    status: "En ejecución",
    description: "Elevar la rotación a 6.0 veces y acelerar el retorno de garantías RMA con fabricantes a 5 días."
  },
  {
    id: "INI-12",
    name: "Academia Corporativa TechPeru y Certificaciones Oficiales",
    objectiveId: "OBJ-A4",
    kpiId: "KPI-49",
    owner: "Lucía Paredes",
    area: "Gestión del Talento Humano",
    start: "2025-01-15",
    end: "2025-11-30",
    budget: 70000,
    progress: 80,
    status: "En ejecución",
    description: "Alcanzar 75% de ingenieros certificados e invertir S/ 1,800 por colaborador."
  },
  {
    id: "INI-13",
    name: "Gestión del Conocimiento KMS y Retención del Talento Crítico",
    objectiveId: "OBJ-A5",
    kpiId: "KPI-51",
    owner: "Lucía Paredes",
    area: "Gestión del Talento Humano",
    start: "2025-02-15",
    end: "2025-12-15",
    budget: 45000,
    progress: 65,
    status: "En ejecución",
    description: "Fidelizar el 95% del talento clave y asegurar cobertura del 85% de procesos en el KMS."
  }
];

const dataTechPeru = {
  organizacion: "TechPeru S.A.C.",
  periodo: "2025",
  perspectivas: perspectivesMeta,
  objectives: objectives,
  kpis: kpis,
  initiatives: initiatives,
  users: users,
  audit: [
    {
      id: "AUD-001",
      date: new Date().toISOString(),
      user: "Sistema ETL",
      action: "Expansión Oficial",
      entity: "TechPeru SAC 2025",
      detail: "Se cargaron exitosamente los 20 Objetivos Estratégicos (5 por perspectiva) y 52 KPIs oficiales."
    }
  ]
};

const outputPath = path.join(__dirname, 'data_techperu.json');
fs.writeFileSync(outputPath, JSON.stringify(dataTechPeru, null, 2), 'utf-8');
console.log(`data_techperu.json generado exitosamente en: ${outputPath}`);
console.log(`- Organización: ${dataTechPeru.organizacion} (${dataTechPeru.periodo})`);
console.log(`- Objetivos totales: ${objectives.length} (5 por cada una de las 4 perspectivas)`);
console.log(`- KPIs totales: ${kpis.length}`);

// Validacion de calculos
const logrados = kpis.filter(k => k.status === 'LOGRADO').length;
const riesgo = kpis.filter(k => k.status === 'EN RIESGO').length;
const criticos = kpis.filter(k => k.status === 'CRÍTICO').length;
const globalAvg = Number((kpis.reduce((acc, k) => acc + k.pct, 0) / kpis.length).toFixed(1));

console.log(`- Resumen Global: Índice ${globalAvg}%, ${logrados} Logrados, ${riesgo} En Riesgo, ${criticos} Críticos`);
