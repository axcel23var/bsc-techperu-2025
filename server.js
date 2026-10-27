const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data_techperu.json');
const PUBLIC_DIR = path.join(__dirname, 'BSC_Prototipo');

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(PUBLIC_DIR));

// Helper: Cargar datos desde JSON
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    require('./etl.js');
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

// Helper: Guardar datos a JSON
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper: Calcular cumplimiento y semáforo individual
function computeKpiCompliance(kpi, currentValue = kpi.current) {
  if (currentValue === null || currentValue === undefined || currentValue === "") {
    return { pct: null, status: 'SIN DATOS', statusKey: 'neutral', statusLabel: 'Sin datos' };
  }

  const current = Number(currentValue);
  const target = Number(kpi.target);
  let pct = 0;

  if (target === 0) return { pct: 0, status: 'CRÍTICO', statusKey: 'bad', statusLabel: '❌ CRÍTICO' };

  if (kpi.direction === 'inverso' || kpi.direction === 'menor') {
    pct = current > 0 ? (target / current) * 100 : 0;
  } else {
    pct = (current / target) * 100;
  }
  pct = Number(pct.toFixed(1));

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

  return { pct, status, statusKey, statusLabel };
}

// Helper: Generar KPIs evaluados según horizonte estratégico (2025, 2026, 2027, 2028)
function getKpisForPeriod(data, period = "2025") {
  const pStr = String(period || "2025");
  if (pStr === "2025") {
    return data.kpis.map(k => {
      const comp = computeKpiCompliance(k, k.current);
      return {
        ...k,
        pct: comp.pct,
        status: comp.status,
        statusKey: comp.statusKey,
        statusLabel: comp.statusLabel
      };
    });
  }

  const yearDiff = Math.max(1, parseInt(pStr, 10) - 2025);
  return data.kpis.map(k => {
    const isInverse = k.direction === 'inverso' || k.direction === 'menor';
    let target = k.target;
    let current = k.current;

    if (isInverse) {
      target = Number((k.target * Math.pow(0.96, yearDiff)).toFixed(2));
      const targetPct = Math.min(100, (k.pct || 85) + (yearDiff === 1 ? 5.2 : yearDiff === 2 ? 9.2 : 12.8));
      current = Number(((target * 100) / targetPct).toFixed(2));
    } else {
      if (k.unit === '%') {
        target = Math.min(100, Number((k.target + yearDiff * 1.5).toFixed(1)));
        const targetPct = Math.min(100, (k.pct || 85) + (yearDiff === 1 ? 5.2 : yearDiff === 2 ? 9.2 : 12.8));
        current = Number(((target * targetPct) / 100).toFixed(1));
      } else {
        target = Number((k.target * Math.pow(1.07, yearDiff)).toFixed(2));
        const targetPct = Math.min(102, (k.pct || 85) + (yearDiff === 1 ? 5.0 : yearDiff === 2 ? 9.0 : 12.5));
        current = Number(((target * targetPct) / 100).toFixed(2));
      }
    }

    const comp = computeKpiCompliance({ ...k, target }, current);

    // Mediciones mensuales proyectadas para el año
    const projMonths = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const baseVal = k.current;
    const measurements = projMonths.map((m, idx) => {
      const progressFactor = (idx + 1) / 12;
      const monthVal = isInverse
        ? Number((baseVal - (baseVal - current) * progressFactor).toFixed(2))
        : Number((baseVal + (current - baseVal) * progressFactor).toFixed(2));
      return {
        id: `M-${k.id}-${pStr}-${m}`,
        period: `${pStr}-${m}`,
        date: `${pStr}-${m}-28`,
        value: monthVal,
        notes: `Proyección estratégica ${pStr} (${idx + 1}/12)`,
        responsible: k.owner
      };
    });

    return {
      ...k,
      target,
      current,
      pct: comp.pct,
      status: comp.status,
      statusKey: comp.statusKey,
      statusLabel: comp.statusLabel,
      measurements
    };
  });
}

// Helper: Calcular resumen de Dashboard con soporte multi-período
function computeDashboard(data, period = "2025") {
  const pStr = String(period || "2025");
  const kpis = getKpisForPeriod(data, pStr);
  const validKpis = kpis.filter(k => k.pct !== null && k.pct !== undefined);
  const totalKpis = kpis.length;

  let sumPct = 0;
  let logrados = 0;
  let enRiesgo = 0;
  let criticos = 0;

  validKpis.forEach(k => {
    sumPct += k.pct;
    if (k.pct >= 90) logrados++;
    else if (k.pct >= 75) enRiesgo++;
    else criticos++;
  });

  const globalIndex = validKpis.length > 0 ? Number((sumPct / validKpis.length).toFixed(1)) : 0;

  let globalStatus = 'LOGRADO';
  let globalStatusKey = 'good';
  if (globalIndex >= 90) {
    globalStatus = 'LOGRADO';
    globalStatusKey = 'good';
  } else if (globalIndex >= 75) {
    globalStatus = 'EN RIESGO';
    globalStatusKey = 'warn';
  } else {
    globalStatus = 'CRÍTICO';
    globalStatusKey = 'bad';
  }

  // Desglose por las 4 perspectivas (25% cada una)
  const perspectivasList = Object.entries(data.perspectivas || {}).map(([key, p]) => {
    const pKpis = kpis.filter(k => k.perspective === key);
    const pObjs = (data.objectives || []).filter(o => o.perspective === key);
    const pValid = pKpis.filter(k => k.pct !== null && k.pct !== undefined);
    const pSum = pValid.reduce((acc, k) => acc + k.pct, 0);
    const pPct = pValid.length > 0 ? Number((pSum / pValid.length).toFixed(1)) : 0;

    let pStatus = 'LOGRADO';
    let pStatusKey = 'good';
    if (pPct >= 90) {
      pStatus = 'LOGRADO';
      pStatusKey = 'good';
    } else if (pPct >= 75) {
      pStatus = 'EN RIESGO';
      pStatusKey = 'warn';
    } else {
      pStatus = 'CRÍTICO';
      pStatusKey = 'bad';
    }

    return {
      key,
      label: p.label,
      color: p.color,
      soft: p.soft,
      weight: p.weight || 25,
      objectivesCount: pObjs.length,
      count: pKpis.length,
      pct: pPct,
      status: pStatus,
      statusKey: pStatusKey
    };
  });

  // KPIs que requieren atención prioritaria (ordenados de menor a mayor cumplimiento)
  const criticalKpis = [...kpis]
    .filter(k => k.pct !== null && k.pct < 90)
    .sort((a, b) => (a.pct || 0) - (b.pct || 0));

  // Tendencia mensual histórica o proyectada
  let months = [];
  let trendLabels = [];
  let trendValues = [];

  if (pStr === "2025") {
    months = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10"];
    trendLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct"];
    trendValues = [76.5, 78.2, 80.1, 81.8, 83.2, 84.5, 85.1, 85.7, 86.0, 86.3];
  } else {
    trendLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
    months = trendLabels.map((_, i) => `${pStr}-${String(i + 1).padStart(2, '0')}`);
    if (pStr === "2026") {
      trendValues = [86.8, 87.3, 87.8, 88.3, 88.8, 89.4, 89.9, 90.3, 90.6, 90.9, 91.1, 91.2];
    } else if (pStr === "2027") {
      trendValues = [91.5, 91.8, 92.2, 92.6, 93.0, 93.3, 93.6, 93.8, 94.0, 94.1, 94.2, 94.3];
    } else {
      trendValues = [94.6, 94.9, 95.1, 95.4, 95.7, 95.9, 96.1, 96.2, 96.3, 96.4, 96.5, 96.5];
    }
  }

  return {
    organizacion: data.organizacion || "TechPeru S.A.C.",
    periodo: pStr,
    globalIndex,
    globalStatus,
    globalStatusKey,
    logrados,
    enRiesgo,
    criticos,
    totalKpis,
    totalObjetivos: (data.objectives || []).length,
    totalIniciativas: (data.initiatives || []).length,
    perspectivas: perspectivasList,
    criticalKpis,
    trend: {
      labels: trendLabels,
      months,
      values: trendValues
    }
  };
}

// ==========================================
// ENDPOINTS REST
// ==========================================

// 1. GET /api/config
app.get('/api/config', (req, res) => {
  try {
    const data = loadData();
    const areas = [...new Set(data.kpis.map(k => k.area).concat(data.users.map(u => u.area)))].filter(Boolean);
    const responsables = data.users.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      area: u.area,
      email: u.email
    }));

    res.json({
      organizacion: data.organizacion || "TechPeru S.A.C.",
      periodo: data.periodo || "2025",
      periodosDisponibles: [
        { id: "2025", label: "2025 (Periodo Base / En curso)" },
        { id: "2026", label: "2026 (Proyección Mediano Plazo)" },
        { id: "2027", label: "2027 (Proyección Mediano Plazo)" },
        { id: "2028", label: "2028 (Visión Largo Plazo)" }
      ],
      periodos: ["2025", "2026", "2027", "2028"],
      perspectivas: data.perspectivas,
      areas,
      responsables,
      users: data.users.map(({ password, ...u }) => u)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener configuración", details: error.message });
  }
});

// 2. GET /api/objetivos (Soporta query ?period=YYYY)
app.get('/api/objetivos', (req, res) => {
  try {
    const data = loadData();
    const period = req.query.period || data.periodo || "2025";
    const kpisForYear = getKpisForPeriod(data, period);

    const objetivosConKpis = data.objectives.map(obj => {
      const kpisAsociados = kpisForYear.filter(k => k.objectiveId === obj.id);
      const kpisValid = kpisAsociados.filter(k => k.pct !== null && k.pct !== undefined);
      const avgPct = kpisValid.length > 0
        ? Number((kpisValid.reduce((a, b) => a + b.pct, 0) / kpisValid.length).toFixed(1))
        : null;

      let status = 'LOGRADO';
      let statusKey = 'good';
      if (avgPct === null) {
        status = 'SIN DATOS';
        statusKey = 'neutral';
      } else if (avgPct >= 90) {
        status = 'LOGRADO';
        statusKey = 'good';
      } else if (avgPct >= 75) {
        status = 'EN RIESGO';
        statusKey = 'warn';
      } else {
        status = 'CRÍTICO';
        statusKey = 'bad';
      }

      return {
        ...obj,
        kpiCount: kpisAsociados.length,
        avgCompliance: avgPct,
        statusLabel: status,
        statusKey
      };
    });

    res.json(objetivosConKpis);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener objetivos", details: error.message });
  }
});

// 2.1 POST /api/objetivos (Crear o Actualizar Objetivo)
app.post('/api/objetivos', (req, res) => {
  try {
    const data = loadData();
    const { id, name, perspective, description, owner, priority, weight, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "El nombre del objetivo es obligatorio." });
    }
    if (!perspective) {
      return res.status(400).json({ error: "La perspectiva es obligatoria." });
    }

    const perspLetter = perspective === 'financiera' ? 'F' : perspective === 'clientes' ? 'C' : perspective === 'procesos' ? 'P' : 'A';
    let targetId = id ? id.trim() : "";
    let isEditing = false;

    if (targetId) {
      const existingIdx = data.objectives.findIndex(o => o.id === targetId);
      if (existingIdx >= 0) {
        isEditing = true;
        data.objectives[existingIdx] = {
          ...data.objectives[existingIdx],
          name: name.trim(),
          perspective,
          description: (description || "").trim(),
          owner: owner || data.objectives[existingIdx].owner || "Responsable por asignar",
          priority: priority || data.objectives[existingIdx].priority || "Alta",
          weight: Number(weight) || data.objectives[existingIdx].weight || 20,
          status: status || data.objectives[existingIdx].status || "Activo"
        };
      }
    }

    if (!isEditing) {
      if (!targetId) {
        const samePersp = data.objectives.filter(o => o.perspective === perspective);
        const nums = samePersp.map(o => {
          const m = o.id.match(/\d+/);
          return m ? parseInt(m[0], 10) : 0;
        });
        const nextNum = (nums.length > 0 ? Math.max(...nums) : samePersp.length) + 1;
        targetId = `OBJ-${perspLetter}${nextNum}`;
      }

      const newObj = {
        id: targetId,
        name: name.trim(),
        perspective,
        description: (description || "").trim(),
        owner: owner || "Responsable por asignar",
        priority: priority || "Alta",
        weight: Number(weight) || 20,
        status: status || "Activo",
        created: new Date().toISOString().slice(0, 10)
      };
      data.objectives.push(newObj);
    }

    if (!data.audit) data.audit = [];
    data.audit.unshift({
      id: "AUD-" + String(Date.now()).slice(-8),
      date: new Date().toISOString(),
      user: owner || "Usuario",
      action: isEditing ? "Edición de Objetivo" : "Creación de Objetivo",
      entity: `${targetId} · ${name}`,
      detail: `Objetivo ${targetId} en perspectiva ${perspective}`
    });

    saveData(data);

    const savedObj = data.objectives.find(o => o.id === targetId);
    res.json({
      success: true,
      message: isEditing ? "Objetivo actualizado con éxito." : "Objetivo creado con éxito.",
      objective: savedObj,
      dashboard: computeDashboard(data)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar objetivo", details: error.message });
  }
});

// 2.2 DELETE /api/objetivos/:id
app.delete('/api/objetivos/:id', (req, res) => {
  try {
    const data = loadData();
    const id = req.params.id;
    const idx = data.objectives.findIndex(o => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Objetivo no encontrado" });
    }

    const deleted = data.objectives.splice(idx, 1)[0];
    // Desvincular KPIs asociados
    data.kpis.forEach(k => {
      if (k.objectiveId === id) k.objectiveId = "";
    });

    if (!data.audit) data.audit = [];
    data.audit.unshift({
      id: "AUD-" + String(Date.now()).slice(-8),
      date: new Date().toISOString(),
      user: "Administrador",
      action: "Eliminación de Objetivo",
      entity: `${deleted.id} · ${deleted.name}`,
      detail: `Se eliminó el objetivo ${deleted.id}`
    });

    saveData(data);
    res.json({ success: true, message: "Objetivo eliminado", deleted });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar objetivo", details: error.message });
  }
});

// 2.3 POST /api/objetivos/:id/asociar-kpis
app.post('/api/objetivos/:id/asociar-kpis', (req, res) => {
  try {
    const data = loadData();
    const objId = req.params.id;
    const obj = (data.objectives || []).find(o => o.id === objId);
    if (!obj) {
      return res.status(404).json({ error: `Objetivo ${objId} no encontrado.` });
    }

    const { kpiIds } = req.body;
    if (!Array.isArray(kpiIds) || kpiIds.length === 0) {
      return res.status(400).json({ error: "Debe proporcionar una lista de kpiIds a asociar." });
    }

    let modified = 0;
    (data.kpis || []).forEach(k => {
      if (kpiIds.includes(k.id)) {
        k.objectiveId = objId;
        if (obj.perspective) k.perspective = obj.perspective;
        modified++;
      }
    });

    if (!data.audit) data.audit = [];
    data.audit.unshift({
      id: "AUD-" + String(Date.now()).slice(-8),
      date: new Date().toISOString(),
      user: obj.owner || "Administrador",
      action: "Asociación de KPIs",
      entity: `${obj.id} · ${obj.name}`,
      detail: `Se asociaron ${modified} KPI(s) (${kpiIds.join(", ")}) al objetivo ${objId}`
    });

    saveData(data);
    res.json({
      success: true,
      message: `${modified} KPI(s) asociados con éxito al objetivo ${objId}.`,
      objectiveId: objId,
      kpiIds,
      dashboard: computeDashboard(data)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al asociar KPIs", details: error.message });
  }
});

// 2.4 POST /api/objetivos/:id/asociar-iniciativas
app.post('/api/objetivos/:id/asociar-iniciativas', (req, res) => {
  try {
    const data = loadData();
    const objId = req.params.id;
    const obj = (data.objectives || []).find(o => o.id === objId);
    if (!obj) {
      return res.status(404).json({ error: `Objetivo ${objId} no encontrado.` });
    }

    const { initiativeIds } = req.body;
    if (!Array.isArray(initiativeIds) || initiativeIds.length === 0) {
      return res.status(400).json({ error: "Debe proporcionar una lista de initiativeIds a asociar." });
    }

    if (!data.iniciativas) data.iniciativas = data.initiatives || [];
    let modified = 0;
    data.iniciativas.forEach(i => {
      if (initiativeIds.includes(i.id)) {
        i.objectiveId = objId;
        modified++;
      }
    });
    data.initiatives = data.iniciativas;

    if (!data.audit) data.audit = [];
    data.audit.unshift({
      id: "AUD-" + String(Date.now()).slice(-8),
      date: new Date().toISOString(),
      user: obj.owner || "Administrador",
      action: "Asociación de Iniciativas",
      entity: `${obj.id} · ${obj.name}`,
      detail: `Se asociaron ${modified} iniciativa(s) (${initiativeIds.join(", ")}) al objetivo ${objId}`
    });

    saveData(data);
    res.json({
      success: true,
      message: `${modified} iniciativa(s) asociadas con éxito al objetivo ${objId}.`,
      objectiveId: objId,
      initiativeIds
    });
  } catch (error) {
    res.status(500).json({ error: "Error al asociar iniciativas", details: error.message });
  }
});

// 3. GET /api/kpis (Soporta query ?period=YYYY)
app.get('/api/kpis', (req, res) => {
  try {
    const data = loadData();
    const period = req.query.period || data.periodo || "2025";
    const kpisActualizados = getKpisForPeriod(data, period);
    res.json(kpisActualizados);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener KPIs", details: error.message });
  }
});

// 3.1 POST /api/kpis (Crear o Editar Parámetros de KPI)
app.post('/api/kpis', (req, res) => {
  try {
    const data = loadData();
    const kData = req.body;
    let targetId = kData.id ? kData.id.trim() : "";
    let isEditing = false;

    if (targetId) {
      const idx = data.kpis.findIndex(k => k.id === targetId);
      if (idx >= 0) {
        isEditing = true;
        const currentVal = kData.current !== undefined && kData.current !== null && kData.current !== ""
          ? Number(kData.current)
          : data.kpis[idx].current;
        const comp = computeKpiCompliance({ ...data.kpis[idx], ...kData }, currentVal);
        data.kpis[idx] = {
          ...data.kpis[idx],
          ...kData,
          current: currentVal,
          target: Number(kData.target),
          pct: comp.pct,
          status: comp.status,
          statusKey: comp.statusKey,
          statusLabel: comp.statusLabel
        };
      }
    }

    if (!isEditing) {
      const maxIdNum = data.kpis.reduce((max, k) => {
        const m = k.id.match(/\d+/);
        return m ? Math.max(max, parseInt(m[0], 10)) : max;
      }, 0);
      targetId = `KPI-${String(maxIdNum + 1).padStart(2, '0')}`;
      const targetNum = Number(kData.target) || 100;
      const currentNum = kData.current !== undefined && kData.current !== null && kData.current !== "" ? Number(kData.current) : null;
      const comp = computeKpiCompliance({ ...kData, target: targetNum }, currentNum);

      const newKpi = {
        id: targetId,
        name: kData.name.trim(),
        perspective: kData.perspective,
        objectiveId: kData.objectiveId || "",
        unit: kData.unit || "%",
        formula: kData.formula || (kData.direction === "inverso" ? "(Meta / Real) × 100" : "(Real / Meta) × 100"),
        baseline: Number(kData.baseline) || 0,
        target: targetNum,
        current: currentNum,
        direction: kData.direction || "directo",
        pct: comp.pct,
        status: comp.status,
        statusKey: comp.statusKey,
        statusLabel: comp.statusLabel,
        frequency: kData.frequency || "Mensual",
        owner: kData.owner || "Responsable por asignar",
        area: kData.area || "General",
        weight: Number(kData.weight) || 1,
        alertAt: 75,
        criticalAt: 75,
        analysis: kData.analysis || "",
        measurements: []
      };
      data.kpis.push(newKpi);
    }

    if (!data.audit) data.audit = [];
    data.audit.unshift({
      id: "AUD-" + String(Date.now()).slice(-8),
      date: new Date().toISOString(),
      user: kData.owner || "Usuario",
      action: isEditing ? "Edición de KPI" : "Creación de KPI",
      entity: `${targetId} · ${kData.name}`,
      detail: `Parámetros actualizados para ${targetId}`
    });

    saveData(data);
    res.json({
      success: true,
      message: isEditing ? "KPI actualizado con éxito" : "KPI creado con éxito",
      kpi: data.kpis.find(k => k.id === targetId),
      dashboard: computeDashboard(data)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar KPI", details: error.message });
  }
});

// 4. GET /api/dashboard (Soporta query ?period=YYYY)
app.get('/api/dashboard', (req, res) => {
  try {
    const data = loadData();
    const period = req.query.period || data.periodo || "2025";
    const dashboard = computeDashboard(data, period);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: "Error al calcular dashboard", details: error.message });
  }
});

// 5. POST /api/mediciones (Registrar nueva medición y recalcular)
app.post('/api/mediciones', (req, res) => {
  try {
    const { kpiId, period, date, value, notes, responsible } = req.body;

    if (!kpiId || value === undefined || value === null || value === "") {
      return res.status(400).json({ error: "Parámetros requeridos: kpiId y value numérico." });
    }

    const numValue = Number(value);
    if (!Number.isFinite(numValue)) {
      return res.status(400).json({ error: "El valor de la medición debe ser numérico." });
    }

    const data = loadData();
    const kpi = data.kpis.find(k => k.id === kpiId);

    if (!kpi) {
      return res.status(404).json({ error: `KPI con ID '${kpiId}' no encontrado.` });
    }

    const medPeriod = period || new Date().toISOString().slice(0, 7);
    const medDate = date || new Date().toISOString().slice(0, 10);
    const medResponsible = responsible || kpi.owner;
    const medNotes = notes || "Medición registrada en sistema";

    if (!kpi.measurements) kpi.measurements = [];
    const existingIndex = kpi.measurements.findIndex(m => m.period === medPeriod);
    const medId = `M-${kpi.id}-${medPeriod}`;

    const newMeasurement = {
      id: medId,
      period: medPeriod,
      date: medDate,
      value: numValue,
      notes: medNotes,
      responsible: medResponsible
    };

    if (existingIndex >= 0) {
      kpi.measurements[existingIndex] = newMeasurement;
    } else {
      kpi.measurements.push(newMeasurement);
    }

    kpi.measurements.sort((a, b) => a.period.localeCompare(b.period) || a.date.localeCompare(b.date));
    kpi.current = numValue;

    const comp = computeKpiCompliance(kpi, numValue);
    kpi.pct = comp.pct;
    kpi.status = comp.status;
    kpi.statusKey = comp.statusKey;
    kpi.statusLabel = comp.statusLabel;

    if (!data.audit) data.audit = [];
    data.audit.unshift({
      id: "AUD-" + String(Date.now()).slice(-8),
      date: new Date().toISOString(),
      user: medResponsible,
      action: "Registro de Medición",
      entity: `${kpi.id} · ${kpi.name}`,
      detail: `Período ${medPeriod}: ${numValue} ${kpi.unit} (${comp.pct}% · ${comp.statusLabel})`
    });

    saveData(data);

    res.json({
      success: true,
      message: `Medición registrada con éxito para ${kpi.id}`,
      kpi,
      measurement: newMeasurement,
      dashboard: computeDashboard(data)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar medición", details: error.message });
  }
});

// 6. POST /api/reset (Restablecer a valores iniciales oficiales)
app.post('/api/reset', (req, res) => {
  try {
    delete require.cache[require.resolve('./etl.js')];
    require('./etl.js');
    const resetData = loadData();
    res.json({
      success: true,
      message: "Datos restablecidos con éxito a los 20 Objetivos y 52 KPIs oficiales de TechPeru SAC.",
      dashboard: computeDashboard(resetData)
    });
  } catch (error) {
    res.status(500).json({ error: "Error al restablecer datos", details: error.message });
  }
});

// ==========================================
// ENDPOINTS DE INICIATIVAS ESTRATÉGICAS
// ==========================================

// GET /api/iniciativas
app.get('/api/iniciativas', (req, res) => {
  try {
    const data = loadData();
    const list = data.iniciativas || data.initiatives || [];
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener iniciativas", details: error.message });
  }
});

// POST /api/iniciativas
// Recibe { name, objectiveId, leader, budget, progress, status, startDate, endDate }, valida, genera ID único (INI-XX), guarda en 'data_techperu.json' y responde 201.
app.post('/api/iniciativas', (req, res) => {
  try {
    const data = loadData();
    if (!data.iniciativas) data.iniciativas = data.initiatives || [];
    if (!data.initiatives) data.initiatives = data.iniciativas;

    const { name, objectiveId, leader, budget, progress, status, startDate, endDate, owner, start, end, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "El nombre de la iniciativa es obligatorio." });
    }
    if (!objectiveId || !objectiveId.trim()) {
      return res.status(400).json({ error: "El objetivo estratégico asociado es obligatorio." });
    }

    // Generar ID único (INI-XX) calculando el número máximo actual
    const maxIdNum = (data.iniciativas || []).reduce((max, item) => {
      const m = String(item.id || "").match(/\d+/);
      return m ? Math.max(max, parseInt(m[0], 10)) : max;
    }, 0);
    const generatedId = `INI-${String(maxIdNum + 1).padStart(2, '0')}`;

    const effectiveLeader = leader || owner || "Responsable";
    const effectiveStart = startDate || start || new Date().toISOString().split('T')[0];
    const effectiveEnd = endDate || end || "";
    const effectiveBudget = Number(budget) || 0;
    const effectiveProgress = Math.min(100, Math.max(0, Number(progress) || 0));
    const effectiveStatus = status || "En progreso";

    let area = "Operaciones y Calidad";
    const obj = (data.objectives || []).find(o => o.id === objectiveId.trim());
    if (obj && obj.perspective) {
      const pers = data.perspectivas?.[obj.perspective];
      if (pers && pers.defaultArea) area = pers.defaultArea;
    }

    const newInitiative = {
      id: generatedId,
      name: name.trim(),
      objectiveId: objectiveId.trim(),
      leader: effectiveLeader,
      owner: effectiveLeader,
      area: area,
      budget: effectiveBudget,
      progress: effectiveProgress,
      status: effectiveStatus,
      startDate: effectiveStart,
      endDate: effectiveEnd,
      start: effectiveStart,
      end: effectiveEnd,
      description: description || `Iniciativa estratégica para ${objectiveId.trim()} en TechPeru SAC.`
    };

    data.iniciativas.push(newInitiative);
    data.initiatives = data.iniciativas;

    if (!data.audit) data.audit = [];
    data.audit.unshift({
      id: "AUD-" + String(Date.now()).slice(-8),
      date: new Date().toISOString(),
      user: effectiveLeader,
      action: "Creación de Iniciativa",
      entity: `${newInitiative.id} · ${newInitiative.name}`,
      detail: `Iniciativa asignada a ${newInitiative.objectiveId} con presupuesto S/ ${newInitiative.budget}`
    });

    saveData(data);
    res.status(201).json({
      success: true,
      message: "Iniciativa creada con éxito.",
      initiative: newInitiative
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear iniciativa", details: error.message });
  }
});

// PUT /api/iniciativas/:id
// Permite actualizar el avance (%), presupuesto o estado de una iniciativa y persiste en 'data_techperu.json'.
app.put('/api/iniciativas/:id', (req, res) => {
  try {
    const data = loadData();
    if (!data.iniciativas) data.iniciativas = data.initiatives || [];
    if (!data.initiatives) data.initiatives = data.iniciativas;

    const targetId = req.params.id;
    const idx = data.iniciativas.findIndex(i => i.id === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: `Iniciativa con ID ${targetId} no encontrada.` });
    }

    const current = data.iniciativas[idx];
    const updates = req.body;

    const updated = {
      ...current,
      ...updates,
      id: current.id
    };

    if (updates.budget !== undefined) updated.budget = Number(updates.budget) || 0;
    if (updates.progress !== undefined) updated.progress = Math.min(100, Math.max(0, Number(updates.progress) || 0));
    if (updates.status !== undefined) updated.status = updates.status;
    if (updates.leader) { updated.leader = updates.leader; updated.owner = updates.leader; }
    if (updates.owner) { updated.owner = updates.owner; updated.leader = updates.owner; }
    if (updates.startDate) { updated.startDate = updates.startDate; updated.start = updates.startDate; }
    if (updates.endDate) { updated.endDate = updates.endDate; updated.end = updates.endDate; }

    data.iniciativas[idx] = updated;
    data.initiatives = data.iniciativas;

    if (!data.audit) data.audit = [];
    data.audit.unshift({
      id: "AUD-" + String(Date.now()).slice(-8),
      date: new Date().toISOString(),
      user: updated.leader || "Responsable",
      action: "Actualización de Iniciativa",
      entity: `${updated.id} · ${updated.name}`,
      detail: `Estado: ${updated.status}, Avance: ${updated.progress}%, Presupuesto: S/ ${updated.budget}`
    });

    saveData(data);
    res.json({
      success: true,
      message: "Iniciativa actualizada con éxito.",
      initiative: updated
    });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar iniciativa", details: error.message });
  }
});

app.get('/api/audit', (req, res) => {
  try {
    const data = loadData();
    res.json(data.audit || []);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener auditoría", details: error.message });
  }
});

// Fallback para Express 5 SPA: Usar app.use en vez de app.get('*')
app.use((req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor BSC TechPeru SAC 2025 activo en puerto ${PORT}`);
  console.log(`📡 URL Local: http://localhost:${PORT}`);
  console.log(`📊 Endpoints REST:`);
  console.log(`   - GET/POST /api/objetivos (20 objetivos)`);
  console.log(`   - GET/POST /api/kpis (52 KPIs)`);
  console.log(`   - GET      /api/dashboard`);
  console.log(`   - POST     /api/mediciones`);
  console.log(`   - POST     /api/reset`);
  console.log(`=======================================================`);
});
