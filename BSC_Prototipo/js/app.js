(() => {
"use strict";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const API = {
  async getConfig() {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error("Error al consultar /api/config");
    return res.json();
  },
  async getObjetivos(period) {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    const res = await fetch(`/api/objetivos${q}`);
    if (!res.ok) throw new Error("Error al consultar /api/objetivos");
    return res.json();
  },
  async postObjetivo(payload) {
    const res = await fetch('/api/objetivos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteObjetivo(id) {
    const res = await fetch(`/api/objetivos/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  async getKpis(period) {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    const res = await fetch(`/api/kpis${q}`);
    if (!res.ok) throw new Error("Error al consultar /api/kpis");
    return res.json();
  },
  async postKpi(payload) {
    const res = await fetch('/api/kpis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async getDashboard(period) {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    const res = await fetch(`/api/dashboard${q}`);
    if (!res.ok) throw new Error("Error al consultar /api/dashboard");
    return res.json();
  },
  async postMedicion(payload) {
    const res = await fetch('/api/mediciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async resetData() {
    const res = await fetch('/api/reset', { method: 'POST' });
    return res.json();
  },
  async getIniciativas() {
    const res = await fetch('/api/iniciativas');
    if (!res.ok) return [];
    return res.json();
  },
  async postIniciativa(payload) {
    const res = await fetch('/api/iniciativas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async getAudit() {
    const res = await fetch('/api/audit');
    if (!res.ok) return [];
    return res.json();
  }
};

let perspectives = {
  financiera: { label: "Financiera", color: "#3478e5", soft: "#edf4ff", weight: 25 },
  clientes: { label: "Clientes", color: "#18a875", soft: "#eaf8f1", weight: 25 },
  procesos: { label: "Procesos internos", color: "#e99a2d", soft: "#fff5e6", weight: 25 },
  aprendizaje: { label: "Aprendizaje y crecimiento", color: "#8b6bd6", soft: "#f2edff", weight: 25 }
};

let users = [];
let state = {
  organizacion: "TechPeru S.A.C.",
  periodo: "2025",
  perspectivas: perspectives,
  objectives: [],
  kpis: [],
  initiatives: [],
  users: [],
  audit: [],
  dashboard: null
};

let currentUser = null;
let currentPage = "dashboard";
let charts = {};
let modalSubmit = null;

function updatePeriodBadges() {
  const p = state.periodo || "2025";
  const shortLabels = {
    "2025": "2025 (Base)",
    "2026": "2026 (Mediano Plazo)",
    "2027": "2027 (Mediano Plazo)",
    "2028": "2028 (Largo Plazo)"
  };

  const topBadge = $("#topPeriodBadge");
  if (topBadge) {
    topBadge.textContent = shortLabels[p] || `Período ${p}`;
    if (p === "2025") {
      topBadge.style.color = "#2563eb";
      topBadge.style.background = "#eff6ff";
      topBadge.style.borderColor = "#bfdbfe";
    } else if (p === "2026" || p === "2027") {
      topBadge.style.color = "#047857";
      topBadge.style.background = "#ecfdf5";
      topBadge.style.borderColor = "#a7f3d0";
    } else {
      topBadge.style.color = "#6366f1";
      topBadge.style.background = "#eef2ff";
      topBadge.style.borderColor = "#c7d2fe";
    }
  }

  const gPeriod = $("#globalPeriod");
  if (gPeriod && gPeriod.value !== p) {
    gPeriod.value = p;
  }

  const adminPeriod = $("#adminPeriodSelect");
  if (adminPeriod && adminPeriod.value !== p) {
    adminPeriod.value = p;
  }

  const footerPeriod = $("#footerPeriodText");
  if (footerPeriod) {
    footerPeriod.textContent = `Cuadro de Mando Integral Oficial · Periodo ${p}`;
  }
}

async function syncState(targetPeriod = state.periodo || "2025") {
  try {
    const [config, objetivos, kpisList, dash, inits, auditList] = await Promise.all([
      API.getConfig(),
      API.getObjetivos(targetPeriod),
      API.getKpis(targetPeriod),
      API.getDashboard(targetPeriod),
      API.getIniciativas(),
      API.getAudit()
    ]);

    if (config.perspectivas) perspectives = config.perspectivas;
    if (config.users) users = config.users;

    state = {
      organizacion: config.organizacion || "TechPeru S.A.C.",
      periodo: targetPeriod,
      perspectivas: perspectives,
      objectives: objetivos || [],
      kpis: kpisList || [],
      initiatives: inits || [],
      users: users || [],
      audit: auditList || [],
      dashboard: dash
    };

    const orgBrand = $("#orgBrandName");
    if (orgBrand) orgBrand.textContent = state.organizacion;
    const crumbOrg = $("#crumbOrg");
    if (crumbOrg) crumbOrg.textContent = state.organizacion;

    updatePeriodBadges();

    return state;
  } catch (err) {
    console.error("Error sincronizando estado desde el backend:", err);
    toast("No se pudo conectar con el servidor backend. Verifica que 'node server.js' esté activo.", "error");
    return null;
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function fmt(n, d = 1) {
  return n === null || n === undefined || n === "" ? "—" : Number(n).toLocaleString("es-PE", { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

function currency(n) {
  return "S/ " + Number(n || 0).toLocaleString("es-PE", { maximumFractionDigits: 0 });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function achievement(k, value = k.current) {
  if (value === null || value === undefined || value === "" || k.target === null || k.target === undefined) return null;
  const val = Number(value);
  const tgt = Number(k.target);
  if (tgt === 0) return 0;

  if (k.direction === "inverso" || k.direction === "menor") {
    if (val <= 0) return 0;
    return Number((tgt / val * 100).toFixed(1));
  }
  return Number((val / tgt * 100).toFixed(1));
}

function statusOf(k, value = k.current) {
  if (value === null || value === undefined || value === "") return { key: "neutral", label: "Sin datos", pct: null };
  const pct = achievement(k, Number(value));
  if (pct === null) return { key: "neutral", label: "Sin datos", pct: null };

  if (pct >= 90) return { key: "good", label: "✅ LOGRADO", pct };
  if (pct >= 75) return { key: "warn", label: "⚠️ EN RIESGO", pct };
  return { key: "bad", label: "❌ CRÍTICO", pct };
}

function statusBadge(k, value = k.current) {
  const s = statusOf(k, value);
  return `<span class="status ${s.key}">${s.label}</span>`;
}

function perspectiveLabel(p) {
  return perspectives[p]?.label || p || "—";
}

function objectiveName(id) {
  return state.objectives.find(o => o.id === id)?.name || "Objetivo no asignado";
}

function kpiName(id) {
  return state.kpis.find(k => k.id === id)?.name || "Sin KPI asociado";
}

function canEdit() {
  return true; // En modo prototipo habilitar edición para interactividad total
}

function canAdmin() {
  return true;
}

function setUser(u) {
  currentUser = u;
  sessionStorage.setItem("bsc_user", JSON.stringify({ id: u.id, email: u.email, role: u.role, name: u.name, area: u.area }));
}

function restoreUser() {
  try {
    const d = JSON.parse(sessionStorage.getItem("bsc_user"));
    if (d) {
      const match = state.users.find(u => u.id === d.id || u.email.toLowerCase() === d.email.toLowerCase());
      if (match) {
        currentUser = { ...match };
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function showApp() {
  $("#loginView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#sideUserName").textContent = currentUser.name;
  $("#topUserName").textContent = currentUser.name;
  $("#sideUserRole").textContent = currentUser.role;
  $("#topUserRole").textContent = currentUser.role;
  $$(".avatar").forEach(a => a.textContent = currentUser.name.split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase());
  renderPage(currentPage);
}

function showLogin() {
  $("#appView").classList.add("hidden");
  $("#loginView").classList.remove("hidden");
}

function login(email, password) {
  const cleanEmail = email.toLowerCase().trim();
  const validUsers = [
    { id: "u1", name: "Carlos Mendoza", email: "admin@demo.com", role: "Administrador", area: "Gerencia General", password: "BSC2026!" },
    { id: "u2", name: "Patricia Ramos", email: "gerente@demo.com", role: "Gerente", area: "Finanzas y Contabilidad", password: "BSC2026!" },
    { id: "u4", name: "María Valdivia", email: "responsable@demo.com", role: "Responsable de indicadores", area: "Operaciones y Calidad", password: "BSC2026!" }
  ];

  let u = validUsers.find(x => x.email.toLowerCase() === cleanEmail && x.password === password);
  if (!u) {
    u = state.users.find(x => x.email.toLowerCase() === cleanEmail && (x.password === password || password === "BSC2026!"));
  }

  if (!u) return false;
  setUser({ ...u });
  showApp();
  return true;
}

function logout() {
  sessionStorage.removeItem("bsc_user");
  currentUser = null;
  showLogin();
  toast("Sesión cerrada correctamente");
}

function navigate(page) {
  if (!page) return;
  currentPage = page;
  $("#sidebar").classList.remove("open");
  renderPage(page);
  history.replaceState(null, "", "#" + page);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const pageTitles = {
  dashboard: "Dashboard ejecutivo",
  mapa: "Mapa estratégico",
  objetivos: "Objetivos estratégicos",
  kpis: "Indicadores (KPI)",
  mediciones: "Registro de resultados",
  iniciativas: "Iniciativas estratégicas",
  reportes: "Reportes",
  administracion: "Administración"
};

function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  $("#toastRegion").append(el);
  setTimeout(() => el.remove(), 4000);
}

function destroyCharts() {
  Object.values(charts).forEach(c => {
    try { c.destroy(); } catch (e) {}
  });
  charts = {};
}

function pageHead(title, desc, actions = "") {
  return `<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div><div class="head-actions">${actions}</div></div>`;
}

function metricCard(label, value, foot, icon, kind = "blue") {
  return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon" style="${kind === "green" ? "background:#eaf8f1;color:#16845b" : kind === "amber" ? "background:#fff5dd;color:#b97708" : kind === "red" ? "background:#ffebed;color:#c23a42" : ""}">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></article>`;
}

function perspectiveBreakdown() {
  if (state.dashboard?.perspectivas) {
    return state.dashboard.perspectivas;
  }
  return Object.entries(perspectives).map(([key, p]) => {
    const ks = state.kpis.filter(k => k.perspective === key);
    const sum = ks.reduce((acc, k) => acc + (k.pct || 0), 0);
    const pct = ks.length > 0 ? Number((sum / ks.length).toFixed(1)) : null;
    return {
      key,
      label: p.label,
      color: p.color,
      soft: p.soft,
      weight: 25,
      pct,
      count: ks.length
    };
  });
}

function renderDashboard() {
  const dash = state.dashboard || {};
  const globalIdx = dash.globalIndex ?? 86.3;
  const logrados = dash.logrados ?? state.kpis.filter(k => (k.pct || 0) >= 90).length;
  const enRiesgo = dash.enRiesgo ?? state.kpis.filter(k => (k.pct || 0) >= 75 && (k.pct || 0) < 90).length;
  const criticos = dash.criticos ?? state.kpis.filter(k => (k.pct || 0) < 75).length;
  const attnList = dash.criticalKpis || state.kpis.filter(k => (k.pct || 0) < 90).sort((a, b) => a.pct - b.pct);
  const period = state.periodo || "2025";

  return `${pageHead("Dashboard ejecutivo", "Tablero integral de control estratégico para TechPeru S.A.C. — Cumplimiento de metas anuales " + escapeHtml(period) + ".", `<button class="btn" data-action="export-dashboard">↓ Exportar resumen</button><button class="btn primary" data-action="go-mediciones">＋ Registrar resultado</button>`)}
  <div class="grid metric-grid">
    ${metricCard("Índice Global BSC", `${fmt(globalIdx, 1)}%`, `<span class="${globalIdx >= 90 ? "trend-up" : "trend-down"}">Estado: ${globalIdx >= 90 ? "LOGRADO" : globalIdx >= 75 ? "EN RIESGO" : "CRÍTICO"} (${state.kpis.length} KPIs)</span>`, "◉", globalIdx >= 90 ? "green" : globalIdx >= 75 ? "amber" : "red")}
    ${metricCard("Objetivos Estratégicos", state.objectives.length, `<span class="trend-up">5 objetivos simétricos por perspectiva</span>`, "◎", "green")}
    ${metricCard("KPIs Logrados (≥90%)", logrados, `<span class="trend-up">${logrados} de ${state.kpis.length} metas alcanzadas</span>`, "✓", "green")}
    ${metricCard("Requieren Atención", enRiesgo + criticos, `<span class="trend-down">${criticos} Críticos · ${enRiesgo} En Riesgo</span>`, "⚑", "red")}
  </div>
  <div class="grid dashboard-grid">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Desempeño por Perspectiva (5 Objetivos por Perspectiva · 25% Peso)</h2>
          <p>Cumplimiento promedio ponderado de los ${state.kpis.length} KPIs oficiales de TechPeru SAC</p>
        </div>
        <span class="tag">Período ${escapeHtml(period)}</span>
      </div>
      <div class="perspective-bars">
        ${perspectiveBreakdown().map(p => `
          <div class="perspective-row">
            <div class="perspective-name"><span class="persp-dot" style="background:${p.color}"></span>${escapeHtml(p.label)}</div>
            <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, p.pct || 0)}%;background:${p.color}"></div></div>
            <div class="perspective-value">${p.pct !== null ? fmt(p.pct) + "%" : "—"}</div>
          </div>
        `).join("")}
      </div>
      <div class="chart-wrap short" style="margin-top:24px">
        <canvas id="perspectiveChart" aria-label="Gráfico de desempeño por perspectiva"></canvas>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Evolución de Cumplimiento ${escapeHtml(period)}</h2>
          <p>Trayectoria acumulada mensual · Promedio global de indicadores (Ene - Oct)</p>
        </div>
        <button class="panel-action" data-action="go-reportes">Ver reportes →</button>
      </div>
      <div class="chart-wrap">
        <canvas id="trendChart" aria-label="Tendencia mensual"></canvas>
      </div>
    </section>
  </div>
  <section class="panel">
    <div class="panel-head">
      <div>
        <h2>Indicadores que Requieren Atención Prioritaria</h2>
        <p>Ordenados por brecha crítica respecto a la meta (Críticos y En Riesgo)</p>
      </div>
      <button class="panel-action" data-action="go-kpis">Ver todos los ${state.kpis.length} KPIs →</button>
    </div>
    ${renderKpiTable(attnList.slice(0, 8), true)}
  </section>`;
}

function renderKpiTable(list, withActions = true) {
  if (!list.length) {
    return `<div class="empty-state"><strong>Todo en orden</strong>No hay indicadores en este estado con los filtros seleccionados.</div>`;
  }
  return `<div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Indicador (KPI)</th>
          <th>Perspectiva</th>
          <th>Tipo</th>
          <th>Meta Anual</th>
          <th>Real Acum.</th>
          <th>% Cumpl.</th>
          <th>Responsable</th>
          <th>Estado</th>
          ${withActions ? "<th>Acciones</th>" : ""}
        </tr>
      </thead>
      <tbody>
        ${list.map(k => `
          <tr>
            <td><span class="code">${escapeHtml(k.id)}</span></td>
            <td><strong>${escapeHtml(k.name)}</strong></td>
            <td>${escapeHtml(perspectiveLabel(k.perspective))}</td>
            <td><span class="tag">${k.direction === "inverso" || k.direction === "menor" ? "Inverso ↓" : "Directo ↑"}</span></td>
            <td>${fmt(k.target, 2)} ${escapeHtml(k.unit)}</td>
            <td><strong>${fmt(k.current, 2)} ${escapeHtml(k.unit)}</strong></td>
            <td><strong>${k.pct !== null ? fmt(k.pct) + "%" : "—"}</strong></td>
            <td>${escapeHtml(k.owner)}</td>
            <td>${statusBadge(k)}</td>
            ${withActions ? `
              <td>
                <div class="table-actions">
                  <button class="text-action" data-action="kpi-detail" data-id="${k.id}">Ficha</button>
                  <button class="text-action" data-action="edit-kpi" data-id="${k.id}">Editar</button>
                  <button class="text-action" data-action="measure-kpi" data-id="${k.id}">Medir</button>
                </div>
              </td>
            ` : ""}
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>`;
}

function renderMap() {
  const lanes = Object.entries(perspectives).map(([key, p]) => {
    const objs = state.objectives.filter(o => o.perspective === key);
    return `<div class="map-lane">
      <div class="map-lane-label" style="background:${p.soft};color:${p.color}">
        <strong>${p.label}</strong>
        <small style="font-weight:600;opacity:0.85;margin-top:4px">${objs.length} Objetivos · 25% Peso</small>
      </div>
      <div class="map-lane-items">
        ${objs.map(o => {
          const ks = state.kpis.filter(k => k.objectiveId === o.id);
          const avg = ks.length > 0 ? Number((ks.reduce((acc, x) => acc + (x.pct || 0), 0) / ks.length).toFixed(1)) : null;
          const col = avg === null ? "#94a3b8" : avg >= 90 ? "#16845b" : avg >= 75 ? "#d99a19" : "#d23f49";
          return `<button class="map-objective" data-action="objective-detail" data-id="${o.id}">
            <span class="mini-status" style="background:${col};top:10px;right:10px"></span>
            <strong>${escapeHtml(o.id)}: ${escapeHtml(o.name)}</strong>
            <small>${ks.length} KPIs · ${avg === null ? "Sin datos" : fmt(avg) + "% cumplimiento"}</small>
          </button>`;
        }).join("") || `<span class="muted">No hay objetivos registrados.</span>`}
      </div>
    </div>`;
  }).join("");

  return `${pageHead("Mapa estratégico", "Arquitectura estratégica de TechPeru S.A.C. — Cuadrícula simétrica de 5 objetivos por perspectiva (20 objetivos en total).", `<button class="btn" data-action="export-map">↓ Exportar</button><button class="btn primary" id="btnNewObjectiveMap" data-action="new-objective">＋ Nuevo objetivo</button>`)}
  <section class="panel">
    <div class="panel-head">
      <div>
        <h2>Mapa de Objetivos Estratégicos (20 Objetivos Oficiales · 5 Columnas Simétricas)</h2>
        <p>Haz clic en cualquier objetivo para inspeccionar sus KPIs vinculados, análisis y planes de acción.</p>
      </div>
      <span class="tag">TechPeru SAC · Período ${escapeHtml(state.periodo)}</span>
    </div>
    <div class="strategy-map">${lanes}</div>
    <div class="map-legend" style="margin-top:18px">
      <span class="legend-item"><i class="legend-dot" style="background:#16845b"></i>Logrado (≥ 90%)</span>
      <span class="legend-item"><i class="legend-dot" style="background:#d99a19"></i>En riesgo (75% a 89.9%)</span>
      <span class="legend-item"><i class="legend-dot" style="background:#d23f49"></i>Crítico (< 75%)</span>
    </div>
  </section>
  <div class="grid dashboard-grid" style="margin-top:16px">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Hipótesis Causa-Efecto (TechPeru S.A.C. 2025)</h2>
          <p>Alineamiento estratégico integral en las 4 perspectivas</p>
        </div>
      </div>
      <div class="info-box">
        <strong>📚 Aprendizaje y Crecimiento (5 Objs):</strong> Competencias clave, clima laboral, cultura de innovación, certificaciones oficiales de especialistas y retención de talento crítico.<br><br>
        <strong>🔧 Procesos Internos (5 Objs):</strong> Calidad operativa, desarrollo ágil de productos, gestión de proveedores, continuidad operativa/ciberseguridad TI y optimización logística RMA.<br><br>
        <strong>👥 Clientes (5 Objs):</strong> Satisfacción (NPS/CSAT), fidelización/retención, expansión de mercado, autogestión digital B2B y consolidación de cuentas clave Enterprise.<br><br>
        <strong>💰 Financiera (5 Objs):</strong> Rentabilidad (ROE/EBITDA), crecimiento YoY, estructura de costos, optimización de liquidez/DSO y rentabilidad en servicios Cloud.
      </div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Distribución de Objetivos</h2>
          <p>Estructura perfectamente balanceada (5 por perspectiva)</p>
        </div>
      </div>
      <div class="perspective-bars">
        ${perspectiveBreakdown().map(p => `
          <div class="perspective-row">
            <div class="perspective-name"><span class="persp-dot" style="background:${p.color}"></span>${p.label}</div>
            <div class="progress-track"><div class="progress-fill" style="width:100%;background:${p.color}"></div></div>
            <div class="perspective-value">${state.objectives.filter(o => o.perspective === p.key).length} Objs</div>
          </div>
        `).join("")}
      </div>
    </section>
  </div>`;
}

function renderObjectives() {
  return `${pageHead("Objetivos estratégicos", "Gestión y alineación de los 20 objetivos estratégicos de TechPeru S.A.C. sin duplicados.", `<button class="btn primary" id="btnNewObjective" data-action="new-objective">＋ Nuevo objetivo</button>`)}
  <div class="toolbar">
    <div class="search-box"><input id="objSearch" placeholder="Buscar por código, nombre o responsable…"></div>
    <select id="objPerspective">
      <option value="">Todas las perspectivas</option>
      ${Object.entries(perspectives).map(([k, p]) => `<option value="${k}">${p.label}</option>`).join("")}
    </select>
    <select id="objStatus">
      <option value="">Todos los estados</option>
      <option>Activo</option>
      <option>En revisión</option>
    </select>
  </div>
  <div id="objectiveTableWrap" class="table-panel">${objectivesTable(state.objectives)}</div>`;
}

function objectivesTable(items) {
  return `<div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Objetivo Estratégico</th>
          <th>Perspectiva</th>
          <th>Responsable</th>
          <th>Prioridad</th>
          <th>KPIs Vinculados</th>
          <th>Cumplimiento</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(o => {
          const ks = state.kpis.filter(k => k.objectiveId === o.id);
          const avg = ks.length > 0 ? Number((ks.reduce((a, b) => a + (b.pct || 0), 0) / ks.length).toFixed(1)) : null;
          const statusCls = avg === null ? "neutral" : avg >= 90 ? "good" : avg >= 75 ? "warn" : "bad";
          const statusTxt = avg === null ? "Sin datos" : avg >= 90 ? "LOGRADO" : avg >= 75 ? "EN RIESGO" : "CRÍTICO";
          return `<tr>
            <td><span class="code">${escapeHtml(o.id)}</span></td>
            <td><span class="table-title">${escapeHtml(o.name)}</span><span class="subcell">${escapeHtml(o.description || "")}</span></td>
            <td>${escapeHtml(perspectiveLabel(o.perspective))}</td>
            <td>${escapeHtml(o.owner)}</td>
            <td><span class="tag">${escapeHtml(o.priority || "Alta")}</span></td>
            <td><strong>${ks.length} KPIs</strong></td>
            <td><strong>${avg !== null ? fmt(avg) + "%" : "—"}</strong></td>
            <td><span class="status ${statusCls}">${statusTxt}</span></td>
            <td>
              <div class="table-actions">
                <button class="text-action" data-action="objective-detail" data-id="${o.id}">Detalle</button>
                <button class="text-action" data-action="edit-objective" data-id="${o.id}">Editar</button>
                <button class="text-action" data-action="delete-objective" data-id="${o.id}">Eliminar</button>
              </div>
            </td>
          </tr>`;
        }).join("") || `<tr><td colspan="9"><div class="empty-state">No se encontraron objetivos.</div></td></tr>`}
      </tbody>
    </table>
  </div>
  <div class="table-bottom"><span>${items.length} objetivos estratégicos en el sistema</span><span>TechPeru SAC</span></div>`;
}

function renderKpis() {
  const logrados = state.kpis.filter(k => (k.pct || 0) >= 90).length;
  const riesgo = state.kpis.filter(k => (k.pct || 0) >= 75 && (k.pct || 0) < 90).length;
  const criticos = state.kpis.filter(k => (k.pct || 0) < 75).length;

  return `${pageHead("Indicadores (KPI)", "Catálogo integral de los " + state.kpis.length + " KPIs de TechPeru S.A.C. con metas, valores reales y semáforos.", `<button class="btn primary" id="btnNewKpi" data-action="new-kpi">＋ Nuevo indicador</button>`)}
  <div class="toolbar">
    <div class="search-box"><input id="kpiSearch" placeholder="Buscar por código, nombre, fórmula o responsable…"></div>
    <select id="kpiPerspective">
      <option value="">Todas las perspectivas</option>
      ${Object.entries(perspectives).map(([k, p]) => `<option value="${k}">${p.label}</option>`).join("")}
    </select>
    <select id="kpiOwner">
      <option value="">Todos los responsables</option>
      ${[...new Set(state.kpis.map(k => k.owner))].map(x => `<option>${escapeHtml(x)}</option>`).join("")}
    </select>
    <select id="kpiStatus">
      <option value="">Todos los semáforos</option>
      <option value="good">✅ Logrado (≥90%)</option>
      <option value="warn">⚠️ En riesgo (75-89%)</option>
      <option value="bad">❌ Crítico (<75%)</option>
    </select>
  </div>
  <div class="grid metric-grid">
    ${metricCard("Total KPIs", state.kpis.length, "Cuadro de mando 2025", "▥")}
    ${metricCard("Logrados (≥90%)", logrados, "Metas alcanzadas", "✓", "green")}
    ${metricCard("En Riesgo (75-89%)", riesgo, "Requieren seguimiento", "⚑", "amber")}
    ${metricCard("Críticos (<75%)", criticos, "Plan de acción urgente", "!", "red")}
  </div>
  <div id="kpiTableWrap" class="table-panel">${renderKpiTable(state.kpis, true)}</div>`;
}

function renderMeasurements() {
  const all = state.kpis.flatMap(k => (k.measurements || []).map(m => ({ ...m, kpi: k }))).sort((a, b) => b.date.localeCompare(a.date));

  return `${pageHead("Registro de resultados", "Registra mediciones reales para actualizar de inmediato el cumplimiento y semáforo en el Backend.", `<button class="btn primary" data-action="new-measurement">＋ Registrar medición</button>`)}
  <div class="grid metric-grid">
    ${metricCard("Mediciones Registradas", all.length, "Historial TechPeru", "↗")}
    ${metricCard("KPIs Evaluados", state.kpis.length, state.kpis.length + " indicadores activos", "▥", "green")}
    ${metricCard("Último Período", all[0]?.period || "2025-10", "Fecha más reciente", "◷", "amber")}
    ${metricCard("Críticos Restantes", state.kpis.filter(k => (k.pct || 0) < 75).length, "Indicadores bajo 75%", "!", "red")}
  </div>
  <div class="toolbar">
    <div class="search-box"><input id="measurementSearch" placeholder="Buscar por indicador, responsable o notas…"></div>
    <select id="measurementKpi">
      <option value="">Todos los ${state.kpis.length} KPIs</option>
      ${state.kpis.map(k => `<option value="${k.id}">${escapeHtml(k.id + " · " + k.name)}</option>`).join("")}
    </select>
    <button class="btn" data-action="export-measurements">↓ CSV</button>
  </div>
  <div id="measurementTableWrap" class="table-panel">${measurementTable(all)}</div>`;
}

function measurementTable(items) {
  return `<div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Período</th>
          <th>Código</th>
          <th>Indicador</th>
          <th>Valor Real</th>
          <th>Meta</th>
          <th>% Cumpl.</th>
          <th>Responsable</th>
          <th>Análisis / Observaciones</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(x => {
          const comp = achievement(x.kpi, x.value);
          return `<tr>
            <td>${escapeHtml(x.date)}</td>
            <td><span class="tag">${escapeHtml(x.period)}</span></td>
            <td><span class="code">${escapeHtml(x.kpi.id)}</span></td>
            <td><strong>${escapeHtml(x.kpi.name)}</strong></td>
            <td><strong>${fmt(x.value, 2)} ${escapeHtml(x.kpi.unit)}</strong></td>
            <td>${fmt(x.kpi.target, 2)} ${escapeHtml(x.kpi.unit)}</td>
            <td><strong>${comp !== null ? fmt(comp) + "%" : "—"}</strong></td>
            <td>${escapeHtml(x.responsible || x.kpi.owner)}</td>
            <td><span class="subcell" style="max-width:280px;white-space:normal">${escapeHtml(x.notes || "—")}</span></td>
            <td><button class="text-action" data-action="measure-kpi" data-id="${x.kpi.id}">Nueva medición</button></td>
          </tr>`;
        }).join("") || `<tr><td colspan="10"><div class="empty-state">No hay mediciones registradas.</div></td></tr>`}
      </tbody>
    </table>
  </div>
  <div class="table-bottom"><span>${items.length} mediciones registradas</span><span>Persistencia directa en data_techperu.json</span></div>`;
}

function renderInitiatives() {
  return `${pageHead("Iniciativas estratégicas", "Proyectos y planes de acción vinculados a los objetivos y KPIs de TechPeru SAC.", `<button class="btn primary" data-action="new-initiative">＋ Nueva iniciativa</button>`)}
  <div class="grid metric-grid">
    ${metricCard("Total Iniciativas", state.initiatives.length, "Portafolio estratégico", "◈")}
    ${metricCard("En Ejecución", state.initiatives.filter(i => i.status === "En ejecución").length, "Proyectos activos", "↗", "green")}
    ${metricCard("Presupuesto Total", currency(state.initiatives.reduce((a, b) => a + (b.budget || 0), 0)), "Inversión planificada", "💰", "amber")}
    ${metricCard("Avance Promedio", fmt(state.initiatives.reduce((a, b) => a + (b.progress || 0), 0) / Math.max(1, state.initiatives.length), 0) + "%", "Seguimiento global", "✓", "green")}
  </div>
  <div class="toolbar">
    <div class="search-box"><input id="initiativeSearch" placeholder="Buscar iniciativa o responsable…"></div>
    <select id="initiativeStatus">
      <option value="">Todos los estados</option>
      <option>En ejecución</option>
      <option>Planificada</option>
      <option>Finalizada</option>
    </select>
  </div>
  <div id="initiativeTableWrap" class="table-panel">${initiativesTable(state.initiatives)}</div>`;
}

function initiativesTable(items) {
  return `<div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Iniciativa Estratégica</th>
          <th>Objetivo / KPI</th>
          <th>Responsable</th>
          <th>Plazos</th>
          <th>Presupuesto</th>
          <th>Avance</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `<tr>
          <td><span class="code">${escapeHtml(i.id)}</span></td>
          <td><span class="table-title">${escapeHtml(i.name)}</span><span class="subcell">${escapeHtml(i.description || "")}</span></td>
          <td><span class="code">${escapeHtml(i.objectiveId || "")}</span><span class="subcell">${escapeHtml(kpiName(i.kpiId))}</span></td>
          <td>${escapeHtml(i.owner)}<span class="subcell">${escapeHtml(i.area || "")}</span></td>
          <td>${escapeHtml(i.start)}<span class="subcell">hasta ${escapeHtml(i.end)}</span></td>
          <td>${currency(i.budget)}</td>
          <td>
            <div class="initiative-progress">
              <div class="progress-track"><div class="progress-fill" style="width:${i.progress}%;background:${i.progress >= 80 ? "#16845b" : "#3478e5"}"></div></div>
              <b>${i.progress}%</b>
            </div>
          </td>
          <td><span class="status ${i.status === "Finalizada" ? "good" : "blue"}">${escapeHtml(i.status)}</span></td>
          <td>
            <div class="table-actions">
              <button class="text-action" data-action="initiative-detail" data-id="${i.id}">Detalle</button>
            </div>
          </td>
        </tr>`).join("") || `<tr><td colspan="9"><div class="empty-state">No hay iniciativas registradas.</div></td></tr>`}
      </tbody>
    </table>
  </div>`;
}

function renderReports() {
  return `${pageHead("Reportes", "Genera resúmenes ejecutivos del Balanced Scorecard TechPeru y exporta a CSV o PDF.", `<button class="btn" data-action="print-report">⎙ Imprimir / PDF</button><button class="btn primary" data-action="export-report">↓ Exportar CSV</button>`)}
  <div class="grid report-cards">
    <article class="report-card">
      <div class="report-icon">▦</div>
      <h3>Reporte General del BSC</h3>
      <p>Índice global (${state.dashboard?.globalIndex ?? 86.3}%), cumplimiento por perspectivas y semáforo de los ${state.kpis.length} KPIs.</p>
      <button class="btn small" data-action="report-type" data-type="general">Generar reporte →</button>
    </article>
    <article class="report-card">
      <div class="report-icon">◉</div>
      <h3>Desempeño por Perspectiva</h3>
      <p>Análisis comparativo de las 4 perspectivas oficiales (25% cada una, 5 objetivos por perspectiva).</p>
      <button class="btn small" data-action="report-type" data-type="perspectivas">Generar reporte →</button>
    </article>
    <article class="report-card">
      <div class="report-icon">⚑</div>
      <h3>Indicadores Críticos y en Riesgo</h3>
      <p>Listado de indicadores que requieren atención prioritaria con análisis y acciones recomendadas.</p>
      <button class="btn small" data-action="report-type" data-type="criticos">Generar reporte →</button>
    </article>
    <article class="report-card">
      <div class="report-icon">▥</div>
      <h3>Catálogo Completo de KPIs</h3>
      <p>Metas, valores reales acumulados, unidades y fórmulas directas/inversas de los ${state.kpis.length} KPIs.</p>
      <button class="btn small" data-action="report-type" data-type="kpis">Generar reporte →</button>
    </article>
    <article class="report-card">
      <div class="report-icon">◈</div>
      <h3>Portafolio de Iniciativas</h3>
      <p>Seguimiento presupuestal y de avance en los proyectos de mejora continua.</p>
      <button class="btn small" data-action="report-type" data-type="iniciativas">Generar reporte →</button>
    </article>
    <article class="report-card">
      <div class="report-icon">↗</div>
      <h3>Historial de Mediciones</h3>
      <p>Registro cronológico de resultados por responsable.</p>
      <button class="btn small" data-action="report-type" data-type="mediciones">Generar reporte →</button>
    </article>
  </div>
  <section class="panel" style="margin-top:16px">
    <div class="panel-head">
      <div>
        <h2 id="reportResultTitle">Reporte General del Balanced Scorecard</h2>
        <p id="reportResultSub">TechPeru S.A.C. · Período Oficial ${escapeHtml(state.periodo)}</p>
      </div>
      <button class="panel-action" data-action="export-report">Exportar CSV ↓</button>
    </div>
    <div id="reportResult">
      <div class="grid dashboard-grid">
        <div>
          <div class="kpi-result">
            <div>
              <small>Índice Global BSC TechPeru</small>
              <strong>${state.dashboard?.globalIndex ?? 86.3}%</strong>
            </div>
            <span class="status ${state.dashboard?.globalIndex >= 90 ? "good" : "warn"}">
              ${state.dashboard?.globalIndex >= 90 ? "✅ LOGRADO" : "⚠️ EN RIESGO"}
            </span>
          </div>
          <p class="form-note">Evaluación integral sobre los ${state.objectives.length} objetivos estratégicos y ${state.kpis.length} KPIs oficiales.</p>
        </div>
        <div class="chart-wrap short"><canvas id="reportChart"></canvas></div>
      </div>
      ${renderKpiTable(state.kpis.filter(k => (k.pct || 0) < 90), false)}
    </div>
  </section>`;
}

function renderAdministration() {
  const userRows = state.users.map(u => `
    <tr>
      <td>
        <div class="user-card">
          <div class="avatar">${u.name.split(" ").map(x => x[0]).slice(0, 2).join("")}</div>
          <div><span class="table-title">${escapeHtml(u.name)}</span><span class="subcell">${escapeHtml(u.email)}</span></div>
        </div>
      </td>
      <td><strong>${escapeHtml(u.role)}</strong></td>
      <td>${escapeHtml(u.area || "—")}</td>
      <td><span class="status good">Activo</span></td>
      <td><span class="tag">Mantenimiento</span></td>
    </tr>
  `).join("");

  return `${pageHead("Administración", "Gestión de la organización, responsables y mantenimiento del sistema con persistencia en Node.js.", "")}
  <div class="grid metric-grid">
    ${metricCard("Usuarios / Responsables", state.users.length, "Equipo directivo TechPeru", "♙")}
    ${metricCard("Objetivos Registrados", state.objectives.length, "5 por perspectiva", "◎", "green")}
    ${metricCard("KPIs Totales", state.kpis.length, "Catálogo completo", "▥", "amber")}
    ${metricCard("Persistencia", "data_techperu.json", "Servidor Express en puerto 3000", "⚙")}
  </div>
  <div class="grid admin-grid">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Mantenimiento de Responsables y Trabajadores</h2>
          <p>Asignación coherente por gerencias y áreas de TechPeru SAC</p>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Funcionario</th><th>Rol</th><th>Área</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>${userRows}</tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Configuración y Restablecimiento</h2>
          <p>Gestión de datos oficiales, horizonte estratégico y respaldo</p>
        </div>
      </div>
      <div class="field" style="margin-bottom:14px">
        <label for="adminPeriodSelect" style="font-weight:700;color:#0f172a">Horizonte Estratégico Activo:</label>
        <select id="adminPeriodSelect" style="padding:9px 12px;border:1px solid var(--line);border-radius:8px;font-weight:600;font-size:12px;background:#fff">
          <option value="2025" ${state.periodo === "2025" ? "selected" : ""}>2025 (Periodo Base / En curso)</option>
          <option value="2026" ${state.periodo === "2026" ? "selected" : ""}>2026 (Proyección Mediano Plazo)</option>
          <option value="2027" ${state.periodo === "2027" ? "selected" : ""}>2027 (Proyección Mediano Plazo)</option>
          <option value="2028" ${state.periodo === "2028" ? "selected" : ""}>2028 (Visión Largo Plazo)</option>
        </select>
        <small class="form-note">Recalcula metas anuales, avances proyectados, semáforos del mapa y curvas de tendencia para toda la organización.</small>
      </div>
      <div class="info-box">
        <strong>Organización:</strong> ${escapeHtml(state.organizacion)}<br>
        <strong>Período de Evaluación:</strong> ${escapeHtml(state.periodo)} · Horizonte Estratégico 2025-2028<br>
        <strong>Objetivos Estratégicos:</strong> ${state.objectives.length} objetivos (5 por perspectiva · 20 en total)<br>
        <strong>Indicadores (KPIs):</strong> ${state.kpis.length} indicadores monitoreados<br>
        <strong>Regla de Semáforos:</strong><br>
        • ✅ Logrado: Cumplimiento ≥ 90%<br>
        • ⚠️ En Riesgo: Cumplimiento entre 75% y 89.9%<br>
        • ❌ Crítico: Cumplimiento menor a 75%<br>
        • KPIs Inversos: (Meta / Real) × 100 (tiempos, defectos, rotación, costos)
      </div>
      <div class="head-actions" style="margin-top:16px">
        <button class="btn" data-action="backup-json">↓ Descargar JSON</button>
        <button class="btn danger" data-action="reset-demo">Restablecer datos oficiales</button>
      </div>
    </section>
  </div>
  <section class="panel" style="margin-top:16px">
    <div class="panel-head">
      <div>
        <h2>Auditoría de Acciones y Mediciones</h2>
        <p>Registro histórico persistido en el backend</p>
      </div>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr>
        </thead>
        <tbody>
          ${(state.audit || []).slice(0, 10).map(a => `
            <tr>
              <td>${escapeHtml(new Date(a.date).toLocaleString("es-PE"))}</td>
              <td><strong>${escapeHtml(a.user)}</strong></td>
              <td><span class="tag">${escapeHtml(a.action)}</span></td>
              <td>${escapeHtml(a.entity)}</td>
              <td>${escapeHtml(a.detail)}</td>
            </tr>
          `).join("") || `<tr><td colspan="5"><div class="empty-state">No hay registros de auditoría.</div></td></tr>`}
        </tbody>
      </table>
    </div>
  </section>`;
}

const renderers = {
  dashboard: renderDashboard,
  mapa: renderMap,
  objetivos: renderObjectives,
  kpis: renderKpis,
  mediciones: renderMeasurements,
  iniciativas: renderInitiatives,
  reportes: renderReports,
  administracion: renderAdministration
};

function renderPage(page) {
  currentPage = page;
  $("#breadcrumbPage").textContent = pageTitles[page] || "Dashboard ejecutivo";
  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  destroyCharts();

  const fn = renderers[page] || renderDashboard;
  $("#pageContent").innerHTML = fn();
  bindPageEvents(page);

  if (page === "dashboard") drawDashboardCharts();
  if (page === "reportes") drawReportCharts();
  $("#pageContent").focus({ preventScroll: true });
}

function chartAvailable() {
  return typeof window.Chart !== "undefined";
}

function drawDashboardCharts() {
  if (!chartAvailable()) return;

  const per = perspectiveBreakdown();
  const ctx = $("#perspectiveChart");
  if (ctx) {
    charts.perspective = new Chart(ctx, {
      type: "bar",
      data: {
        labels: per.map(x => x.label),
        datasets: [{
          label: "Cumplimiento (%)",
          data: per.map(x => x.pct || 0),
          backgroundColor: per.map(x => x.color),
          borderRadius: 6,
          maxBarThickness: 38
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 120,
            grid: { color: "#edf1f5" },
            ticks: { callback: v => v + "%", font: { size: 10 } }
          },
          x: { grid: { display: false }, ticks: { font: { size: 9 } } }
        }
      }
    });
  }

  const ctx2 = $("#trendChart");
  if (ctx2) {
    const trend = state.dashboard?.trend || {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct"],
      values: [76.5, 78.2, 80.1, 81.8, 83.2, 84.5, 85.1, 85.7, 86.0, 86.3]
    };

    charts.trend = new Chart(ctx2, {
      type: "line",
      data: {
        labels: trend.labels,
        datasets: [{
          label: "Cumplimiento Acumulado",
          data: trend.values,
          borderColor: "#286de0",
          backgroundColor: "#286de01a",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: "#286de0"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            min: 65,
            max: 100,
            grid: { color: "#edf1f5" },
            ticks: { callback: v => v + "%", font: { size: 10 } }
          },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}

function drawReportCharts() {
  if (!chartAvailable()) return;
  const c = $("#reportChart");
  if (!c) return;
  const per = perspectiveBreakdown();
  charts.report = new Chart(c, {
    type: "doughnut",
    data: {
      labels: per.map(x => x.label),
      datasets: [{
        data: per.map(x => x.pct || 0),
        backgroundColor: per.map(x => x.color),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { boxWidth: 10, font: { size: 9 } } } }
    }
  });
}

function bindPageEvents(page) {
  const root = $("#pageContent");
  root.onclick = e => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    handleAction(b.dataset.action, b.dataset.id, b.dataset);
  };

  root.oninput = e => {
    if (["objSearch", "kpiSearch", "measurementSearch", "initiativeSearch"].includes(e.target.id)) {
      applyTableFilters(page);
    }
  };

  root.onchange = async e => {
    if (e.target.id === "adminPeriodSelect") {
      const newPeriod = e.target.value;
      state.periodo = newPeriod;
      await syncState(newPeriod);
      renderPage("administracion");
      toast(`Horizonte estratégico cambiado a ${newPeriod}`);
      return;
    }
    if (["objPerspective", "objStatus", "kpiPerspective", "kpiOwner", "kpiStatus", "measurementKpi", "initiativeStatus"].includes(e.target.id)) {
      applyTableFilters(page);
    }
  };
}

function applyTableFilters(page) {
  if (page === "objetivos") {
    const q = ($("#objSearch")?.value || "").toLowerCase();
    const p = $("#objPerspective")?.value || "";
    const s = $("#objStatus")?.value || "";
    const items = state.objectives.filter(o =>
      (!q || `${o.id} ${o.name} ${o.owner}`.toLowerCase().includes(q)) &&
      (!p || o.perspective === p) &&
      (!s || o.status === s)
    );
    $("#objectiveTableWrap").innerHTML = objectivesTable(items);
  }

  if (page === "kpis") {
    const q = ($("#kpiSearch")?.value || "").toLowerCase();
    const p = $("#kpiPerspective")?.value || "";
    const owner = $("#kpiOwner")?.value || "";
    const st = $("#kpiStatus")?.value || "";
    const items = state.kpis.filter(k =>
      (!q || `${k.id} ${k.name} ${k.formula} ${k.owner}`.toLowerCase().includes(q)) &&
      (!p || k.perspective === p) &&
      (!owner || k.owner === owner) &&
      (!st || (statusOf(k).key === st))
    );
    $("#kpiTableWrap").innerHTML = renderKpiTable(items, true);
  }

  if (page === "mediciones") {
    const q = ($("#measurementSearch")?.value || "").toLowerCase();
    const kid = $("#measurementKpi")?.value || "";
    const all = state.kpis.flatMap(k => (k.measurements || []).map(m => ({ ...m, kpi: k })));
    const items = all.filter(x =>
      (!q || `${x.kpi.id} ${x.kpi.name} ${x.responsible} ${x.notes}`.toLowerCase().includes(q)) &&
      (!kid || x.kpi.id === kid)
    ).sort((a, b) => b.date.localeCompare(a.date));
    $("#measurementTableWrap").innerHTML = measurementTable(items);
  }

  if (page === "iniciativas") {
    const q = ($("#initiativeSearch")?.value || "").toLowerCase();
    const st = $("#initiativeStatus")?.value || "";
    const items = state.initiatives.filter(i =>
      (!q || `${i.id} ${i.name} ${i.owner}`.toLowerCase().includes(q)) &&
      (!st || i.status === st)
    );
    $("#initiativeTableWrap").innerHTML = initiativesTable(items);
  }
}

async function handleAction(action, id, data = {}) {
  switch (action) {
    case "go-mediciones": navigate("mediciones"); break;
    case "go-kpis": navigate("kpis"); break;
    case "go-reportes": navigate("reportes"); break;
    case "new-objective": openObjectiveForm(); break;
    case "edit-objective": openObjectiveForm(id); break;
    case "delete-objective": confirmDelete("objetivo", id); break;
    case "objective-detail": showObjectiveDetail(id); break;
    case "new-kpi": openKpiForm(); break;
    case "edit-kpi": openKpiForm(id); break;
    case "kpi-detail": showKpiDetail(id); break;
    case "measure-kpi": openMeasurementForm(null, id); break;
    case "new-measurement": openMeasurementForm(); break;
    case "initiative-detail": showInitiativeDetail(id); break;
    case "report-type": generateReport(data.type); break;
    case "export-report": exportCurrentReport(); break;
    case "print-report": window.print(); break;
    case "export-dashboard":
      exportCSV("resumen_bsc_techperu.csv", [
        ["Métrica", "Valor"],
        ["Organización", state.organizacion],
        ["Período", state.periodo],
        ["Cumplimiento Global BSC", (state.dashboard?.globalIndex ?? 86.3) + "%"],
        ["Total Objetivos", state.objectives.length],
        ["Total KPIs", state.kpis.length],
        ["KPIs Logrados (≥90%)", state.kpis.filter(k => (k.pct || 0) >= 90).length],
        ["KPIs En Riesgo (75-89%)", state.kpis.filter(k => (k.pct || 0) >= 75 && (k.pct || 0) < 90).length],
        ["KPIs Críticos (<75%)", state.kpis.filter(k => (k.pct || 0) < 75).length]
      ]);
      break;
    case "export-map":
      exportCSV("mapa_estrategico_techperu.csv", [
        ["Código", "Objetivo", "Perspectiva", "Responsable", "KPIs Vinculados"],
        ...state.objectives.map(o => [o.id, o.name, perspectiveLabel(o.perspective), o.owner, state.kpis.filter(k => k.objectiveId === o.id).length])
      ]);
      break;
    case "export-measurements":
      exportCSV("historial_mediciones_techperu.csv", [
        ["KPI ID", "Indicador", "Período", "Fecha", "Valor", "Unidad", "Responsable", "Notas"],
        ...state.kpis.flatMap(k => (k.measurements || []).map(m => [k.id, k.name, m.period, m.date, m.value, k.unit, m.responsible, m.notes]))
      ]);
      break;
    case "backup-json":
      downloadBlob("data_techperu_backup.json", JSON.stringify(state, null, 2), "application/json");
      toast("Copia de respaldo JSON descargada con éxito.");
      break;
    case "reset-demo":
      confirmReset();
      break;
  }
}

function showModal(title, body, submitLabel = "Guardar", submitFn = null, eyebrow = "GESTIÓN") {
  $("#modalTitle").textContent = title;
  $("#modalEyebrow").textContent = eyebrow;
  $("#modalBody").innerHTML = body;
  $("#modalFooter").innerHTML = `<button class="btn" type="button" id="modalCancel">Cancelar</button><button class="btn primary" type="button" id="modalSubmit">${submitLabel}</button>`;
  $("#modalLayer").classList.remove("hidden");
  modalSubmit = submitFn;
  $("#modalClose").onclick = closeModal;
  $("#modalCancel").onclick = closeModal;
  $("#modalSubmit").onclick = () => { if (modalSubmit) modalSubmit(); };
  $("#modalLayer").onclick = e => { if (e.target === $("#modalLayer")) closeModal(); };
}

function closeModal() {
  $("#modalLayer").classList.add("hidden");
  modalSubmit = null;
}

function selectField(label, name, opts, required = true) {
  return `<div class="field"><label for="${name}">${label}${required ? " *" : ""}</label><select id="${name}" name="${name}" ${required ? "required" : ""}>${opts}</select></div>`;
}

function field(label, name, value = "", type = "text", required = true, extra = "") {
  return `<div class="field"><label for="${name}">${label}${required ? " *" : ""}</label><input id="${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? "required" : ""} ${extra}></div>`;
}

// ==========================================
// FORMULARIO: NUEVO / EDITAR OBJETIVO
// ==========================================
function openObjectiveForm(id = null) {
  const o = id ? state.objectives.find(x => x.id === id) : null;
  const isEditing = Boolean(o);

  const currentObj = o || {
    id: "",
    name: "",
    perspective: "financiera",
    owner: "Patricia Ramos",
    priority: "Alta",
    weight: 20,
    description: "",
    status: "Activo"
  };

  const perspectiveOptions = Object.entries(perspectives).map(([k, p]) =>
    `<option value="${k}" ${currentObj.perspective === k ? "selected" : ""}>${p.label}</option>`
  ).join("");

  const ownerOptions = [...new Set(state.users.map(u => u.name))].map(n =>
    `<option value="${escapeHtml(n)}" ${currentObj.owner === n ? "selected" : ""}>${escapeHtml(n)}</option>`
  ).join("");

  const body = `<form id="objectiveForm" class="detail-form-grid">
    <div class="field">
      <label for="oId">Código del Objetivo ${isEditing ? "(No editable)" : "(Opcional / Auto)"}</label>
      <input id="oId" value="${escapeHtml(currentObj.id)}" placeholder="Ej: OBJ-F6 (Dejar vacío para auto)" ${isEditing ? "readonly style='background:#f1f5f9;color:#64748b'" : ""}>
    </div>
    ${selectField("Perspectiva Estratégica", "oPerspective", perspectiveOptions)}
    <div class="field full-span">
      <label for="oName">Nombre del Objetivo Estratégico *</label>
      <input id="oName" required value="${escapeHtml(currentObj.name)}" placeholder="Ej: Expandir soluciones analíticas de inteligencia artificial">
    </div>
    ${selectField("Responsable Asignado", "oOwner", ownerOptions)}
    ${selectField("Prioridad", "oPriority", ["Alta", "Media", "Baja"].map(p => `<option ${currentObj.priority === p ? "selected" : ""}>${p}</option>`).join(""))}
    ${field("Ponderación en la Perspectiva (%)", "oWeight", currentObj.weight, "number", true, 'min="1" max="100" step="1"')}
    ${selectField("Estado Operativo", "oStatus", ["Activo", "En revisión"].map(s => `<option ${currentObj.status === s ? "selected" : ""}>${s}</option>`).join(""))}
    <div class="field full-span">
      <label for="oDescription">Descripción y Justificación Estratégica</label>
      <textarea id="oDescription" placeholder="Detalle la meta cualitativa y el impacto esperado en la organización...">${escapeHtml(currentObj.description || "")}</textarea>
    </div>
    <div class="field full-span">
      <div class="info-box">
        Al guardar, el objetivo se registrará en el Backend y se reflejará simétricamente en el <strong>Mapa Estratégico</strong> y la tabla de objetivos.
      </div>
    </div>
  </form>`;

  showModal(
    isEditing ? `Editar Objetivo: ${currentObj.id}` : "Nuevo Objetivo Estratégico",
    body,
    isEditing ? "Guardar Cambios" : "Crear Objetivo",
    async () => {
      const nameVal = $("#oName")?.value.trim();
      if (!nameVal) {
        toast("El nombre del objetivo es obligatorio.", "error");
        return;
      }

      const payload = {
        id: $("#oId")?.value.trim() || undefined,
        name: nameVal,
        perspective: $("#oPerspective")?.value,
        owner: $("#oOwner")?.value,
        priority: $("#oPriority")?.value,
        weight: Number($("#oWeight")?.value) || 20,
        status: $("#oStatus")?.value,
        description: $("#oDescription")?.value.trim()
      };

      try {
        const res = await API.postObjetivo(payload);
        if (res.success) {
          await syncState();
          closeModal();
          toast(res.message || "Objetivo guardado con éxito.");
          renderPage(currentPage);
        } else {
          toast(res.error || "Error al guardar objetivo", "error");
        }
      } catch (e) {
        toast("Error de conexión: " + e.message, "error");
      }
    },
    "GESTIÓN DE OBJETIVOS ESTRATÉGICOS"
  );
}

// ==========================================
// FORMULARIO: NUEVO / EDITAR KPI
// ==========================================
function openKpiForm(id = null) {
  const k = id ? state.kpis.find(x => x.id === id) : null;
  const isEditing = Boolean(k);

  const currentKpi = k || {
    id: "",
    name: "",
    perspective: "financiera",
    objectiveId: state.objectives[0]?.id || "OBJ-F1",
    direction: "directo",
    unit: "%",
    target: 100,
    current: null,
    owner: "Patricia Ramos",
    area: "Finanzas y Contabilidad",
    formula: "(Real / Meta) × 100",
    analysis: ""
  };

  const perspectiveOptions = Object.entries(perspectives).map(([pk, p]) =>
    `<option value="${pk}" ${currentKpi.perspective === pk ? "selected" : ""}>${p.label}</option>`
  ).join("");

  const objectiveOptions = state.objectives.map(o =>
    `<option value="${o.id}" ${currentKpi.objectiveId === o.id ? "selected" : ""}>${escapeHtml(o.id + " · " + o.name)}</option>`
  ).join("");

  const ownerOptions = [...new Set(state.users.map(u => u.name))].map(n =>
    `<option value="${escapeHtml(n)}" ${currentKpi.owner === n ? "selected" : ""}>${escapeHtml(n)}</option>`
  ).join("");

  const body = `<form id="kpiForm" class="detail-form-grid">
    <div class="field">
      <label for="kId">Código ${isEditing ? "(Fijo)" : "(Auto)"}</label>
      <input id="kId" value="${escapeHtml(currentKpi.id)}" ${isEditing ? "readonly style='background:#f1f5f9;color:#64748b'" : "placeholder='Ej: KPI-53'"} >
    </div>
    ${selectField("Perspectiva", "kPerspective", perspectiveOptions)}
    <div class="field full-span">
      <label for="kName">Nombre del Indicador (KPI) *</label>
      <input id="kName" required value="${escapeHtml(currentKpi.name)}" placeholder="Ej: Tasa de conversión de leads calificados">
    </div>
    <div class="field full-span">
      <label for="kObjectiveId">Objetivo Estratégico Asociado *</label>
      <select id="kObjectiveId" required>${objectiveOptions}</select>
    </div>
    ${selectField("Sentido del Indicador", "kDirection", `
      <option value="directo" ${currentKpi.direction === "directo" ? "selected" : ""}>Directo ↑ (Mayor es mejor)</option>
      <option value="inverso" ${currentKpi.direction === "inverso" || currentKpi.direction === "menor" ? "selected" : ""}>Inverso ↓ (Menor es mejor)</option>
    `)}
    ${field("Unidad de Medida", "kUnit", currentKpi.unit, "text", true, 'placeholder="Ej: %, S/, días, hrs, pts"')}
    ${field("Meta Anual", "kTarget", currentKpi.target, "number", true, 'step="any"')}
    ${field("Valor Real Actual", "kCurrent", currentKpi.current ?? "", "number", false, 'step="any" placeholder="Opcional"')}
    ${selectField("Responsable Asignado", "kOwner", ownerOptions)}
    ${field("Área / Departamento", "kArea", currentKpi.area, "text", true)}
    <div class="field full-span">
      <label for="kAnalysis">Análisis / Acción Recomendada</label>
      <textarea id="kAnalysis">${escapeHtml(currentKpi.analysis || "")}</textarea>
    </div>
  </form>`;

  showModal(
    isEditing ? `Editar Indicador: ${currentKpi.id}` : "Nuevo Indicador (KPI)",
    body,
    isEditing ? "Guardar Cambios" : "Crear Indicador",
    async () => {
      const nameVal = $("#kName")?.value.trim();
      const targetVal = Number($("#kTarget")?.value);
      if (!nameVal) {
        toast("El nombre del indicador es obligatorio.", "error");
        return;
      }
      if (!Number.isFinite(targetVal) || targetVal <= 0) {
        toast("La meta debe ser un número positivo.", "error");
        return;
      }

      const currentValInput = $("#kCurrent")?.value;
      const currentVal = currentValInput !== "" ? Number(currentValInput) : null;

      const payload = {
        id: $("#kId")?.value.trim() || undefined,
        name: nameVal,
        perspective: $("#kPerspective")?.value,
        objectiveId: $("#kObjectiveId")?.value,
        direction: $("#kDirection")?.value,
        unit: $("#kUnit")?.value.trim(),
        target: targetVal,
        current: currentVal,
        owner: $("#kOwner")?.value,
        area: $("#kArea")?.value.trim(),
        analysis: $("#kAnalysis")?.value.trim()
      };

      try {
        const res = await API.postKpi(payload);
        if (res.success) {
          await syncState();
          closeModal();
          toast(res.message || "KPI guardado con éxito.");
          renderPage(currentPage);
        } else {
          toast(res.error || "Error al guardar KPI", "error");
        }
      } catch (e) {
        toast("Error de conexión: " + e.message, "error");
      }
    },
    "PARÁMETROS DEL INDICADOR"
  );
}

// ==========================================
// FORMULARIO: REGISTRO DE MEDICIÓN
// ==========================================
function openMeasurementForm(measureId = null, kpiId = null) {
  const k = state.kpis.find(x => x.id === kpiId) || state.kpis[0];
  if (!k) {
    toast("No se encontraron KPIs para registrar.", "error");
    return;
  }

  const currentPeriod = state.periodo ? `${state.periodo}-11` : "2025-11";
  const currentDate = state.periodo ? `${state.periodo}-11-28` : today();

  const body = `<form id="measurementForm" class="detail-form-grid">
    ${selectField("Indicador (KPI)", "mKpi", state.kpis.map(x => `<option value="${x.id}" ${x.id === k.id ? "selected" : ""}>${escapeHtml(x.id + " · " + x.name)} (${x.direction === "inverso" || x.direction === "menor" ? "Inverso ↓" : "Directo ↑"})</option>`).join(""))}
    ${field("Período", "mPeriod", currentPeriod, "month", true)}
    ${field("Fecha de medición", "mDate", currentDate, "date", true)}
    ${field(`Nuevo Valor Real Obtenido (${escapeHtml(k.unit)})`, "mValue", k.current, "number", true, 'step="any"')}
    ${selectField("Responsable asignado", "mOwner", [...new Set(state.users.map(u => u.name))].map(n => `<option ${n === k.owner ? "selected" : ""}>${escapeHtml(n)}</option>`).join(""))}
    <div class="field full-span">
      <label for="mNotes">Observaciones / Plan de Acción</label>
      <textarea id="mNotes">${escapeHtml(k.analysis || "Medición periódica de seguimiento.")}</textarea>
    </div>
    <div class="field full-span">
      <div class="info-box">
        <strong>Meta Anual:</strong> ${k.target} ${k.unit} · <strong>Sentido:</strong> ${k.direction === "inverso" || k.direction === "menor" ? "Inverso (Menor valor = Mejor)" : "Directo (Mayor valor = Mejor)"}<br>
        Al guardar, el servidor de Node.js recalculará automáticamente el % de cumplimiento y semáforo, actualizando la persistencia en <code>data_techperu.json</code>.
      </div>
    </div>
  </form>`;

  showModal("Registrar Resultado de Medición", body, "Guardar en Servidor", async () => {
    const valInput = $("#mValue");
    if (!valInput || valInput.value === "") {
      toast("Ingresa un valor numérico.", "error");
      return;
    }
    const val = Number(valInput.value);
    if (!Number.isFinite(val)) {
      toast("El valor ingresado debe ser un número válido.", "error");
      return;
    }

    const payload = {
      kpiId: $("#mKpi").value,
      period: $("#mPeriod").value,
      date: $("#mDate").value,
      value: val,
      notes: $("#mNotes").value.trim(),
      responsible: $("#mOwner").value
    };

    try {
      const res = await API.postMedicion(payload);
      if (res.success) {
        await syncState();
        closeModal();
        renderPage(currentPage);
        toast(`Resultado guardado: ${res.kpi.name} → ${res.kpi.pct}% (${res.kpi.statusLabel})`);
      } else {
        toast(res.error || "Error al registrar medición en el backend", "error");
      }
    } catch (e) {
      toast("Error al conectar con el servidor: " + e.message, "error");
    }
  }, "REGISTRO DE RESULTADOS");

  $("#mKpi")?.addEventListener("change", () => {
    const kk = state.kpis.find(x => x.id === $("#mKpi").value);
    if (!kk) return;
    const lbl = $("#mValue")?.parentElement?.querySelector("label");
    if (lbl) lbl.textContent = `Nuevo Valor Real Obtenido (${kk.unit}) *`;
    const own = $("#mOwner");
    if (own) own.value = kk.owner;
  });
}

function confirmDelete(type, id) {
  if (type === "objetivo") {
    const obj = state.objectives.find(x => x.id === id);
    if (!obj) return;
    showModal(
      "Confirmar Eliminación",
      `<div class="info-box">
        <strong>¿Estás seguro de eliminar el objetivo "${escapeHtml(obj.id)}: ${escapeHtml(obj.name)}"?</strong>
        <p>Los KPIs asociados se conservarán pero quedarán sin objetivo asignado.</p>
      </div>`,
      "Sí, Eliminar",
      async () => {
        try {
          const res = await API.deleteObjetivo(id);
          if (res.success) {
            await syncState();
            closeModal();
            toast("Objetivo eliminado correctamente.");
            renderPage(currentPage);
          } else {
            toast(res.error || "Error al eliminar objetivo.", "error");
          }
        } catch (e) {
          toast("Error: " + e.message, "error");
        }
      },
      "CONFIRMACIÓN"
    );
  }
}

function showObjectiveDetail(id) {
  const o = state.objectives.find(x => x.id === id);
  if (!o) return;
  const ks = state.kpis.filter(k => k.objectiveId === id);
  const ins = state.initiatives.filter(i => i.objectiveId === id);
  const avg = ks.length > 0 ? Number((ks.reduce((a, b) => a + (b.pct || 0), 0) / ks.length).toFixed(1)) : null;

  const body = `<div class="grid" style="gap:14px">
    <div class="info-box">
      <strong>Descripción:</strong> ${escapeHtml(o.description || "Sin descripción")}<br><br>
      <strong>Perspectiva:</strong> ${escapeHtml(perspectiveLabel(o.perspective))}<br>
      <strong>Responsable Oficial:</strong> ${escapeHtml(o.owner)}<br>
      <strong>Prioridad:</strong> ${escapeHtml(o.priority || "Alta")} · <strong>Peso:</strong> ${o.weight || 20}% en perspectiva
    </div>
    <div class="kpi-result">
      <div>
        <small>Cumplimiento Promedio del Objetivo</small>
        <strong>${avg !== null ? fmt(avg) + "%" : "—"}</strong>
      </div>
      <span class="status ${avg === null ? "neutral" : avg >= 90 ? "good" : avg >= 75 ? "warn" : "bad"}">
        ${avg === null ? "Sin datos" : avg >= 90 ? "✅ LOGRADO" : avg >= 75 ? "⚠️ EN RIESGO" : "❌ CRÍTICO"}
      </span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3 style="margin:0">KPIs Vinculados (${ks.length})</h3>
      <button class="btn small" data-action="new-kpi">＋ Asociar nuevo KPI</button>
    </div>
    ${renderKpiTable(ks, true)}
    <h3 style="margin:0">Iniciativas Vinculadas (${ins.length})</h3>
    ${ins.map(i => `<div class="objective-card">
      <div class="objective-symbol">◈</div>
      <div>
        <h3>${escapeHtml(i.name)}</h3>
        <p>Responsable: ${escapeHtml(i.owner)} · Avance: ${i.progress}% · Presupuesto: ${currency(i.budget)}</p>
        <span class="status ${i.status === "Finalizada" ? "good" : "blue"}">${escapeHtml(i.status)}</span>
      </div>
    </div>`).join("") || `<p class="muted">No hay iniciativas registradas para este objetivo.</p>`}
  </div>`;

  showModal(`${o.id}: ${o.name}`, body, "Cerrar", closeModal, "FICHA DE OBJETIVO ESTRATÉGICO");
}

function showKpiDetail(id) {
  const k = state.kpis.find(x => x.id === id);
  if (!k) return;
  const score = k.pct !== null ? k.pct : achievement(k);

  const body = `<div class="grid" style="gap:14px">
    <div class="detail-layout">
      <div class="panel" style="box-shadow:none">
        <span class="eyebrow">${escapeHtml(k.id)} · ${escapeHtml(perspectiveLabel(k.perspective))}</span>
        <h3 style="font-size:17px;margin:8px 0">${escapeHtml(k.name)}</h3>
        <p class="muted">${escapeHtml(k.analysis || "Seguimiento periódico de metas estratégicas.")}</p>
        <div class="kpi-result">
          <div>
            <small>Valor Real Acumulado</small>
            <strong>${fmt(k.current, 2)} <small style="display:inline">${escapeHtml(k.unit)}</small></strong>
          </div>
          ${statusBadge(k)}
        </div>
        <p class="form-note">
          Meta Anual: <strong>${fmt(k.target, 2)} ${escapeHtml(k.unit)}</strong> · 
          Cumplimiento: <strong>${score !== null ? fmt(score) + "%" : "—"}</strong>
        </p>
      </div>
      <div class="panel" style="box-shadow:none">
        <h3 style="margin:0 0 10px;font-size:12px">Ficha Técnica del KPI</h3>
        <p class="form-note">
          <strong>Tipo de Cálculo:</strong> ${k.direction === "inverso" || k.direction === "menor" ? "Inverso (Menor es mejor)" : "Directo (Mayor es mejor)"}<br>
          <strong>Fórmula:</strong> ${escapeHtml(k.formula)}<br>
          <strong>Objetivo Vinculado:</strong> ${escapeHtml(k.objectiveId)} · ${escapeHtml(objectiveName(k.objectiveId))}<br>
          <strong>Responsable:</strong> ${escapeHtml(k.owner)}<br>
          <strong>Área:</strong> ${escapeHtml(k.area)}<br>
          <strong>Frecuencia:</strong> Mensual
        </p>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head">
        <div>
          <h3>Evolución Histórica (Mediciones 2025)</h3>
          <p>Valores registrados mes a mes</p>
        </div>
      </div>
      <div class="detail-chart"><canvas id="kpiHistoryChart"></canvas></div>
    </div>
    <h3 style="margin:0">Historial de Mediciones (${(k.measurements || []).length})</h3>
    ${measurementTable((k.measurements || []).map(m => ({ ...m, kpi: k })).sort((a, b) => b.date.localeCompare(a.date)))}
  </div>`;

  showModal("Detalle del Indicador", body, "Registrar Medición", () => {
    closeModal();
    openMeasurementForm(null, id);
  }, "FICHA TÉCNICA KPI");

  if (chartAvailable()) {
    const c = $("#kpiHistoryChart");
    if (c) {
      const data = [...(k.measurements || [])].sort((a, b) => a.period.localeCompare(b.period));
      charts.modal = new Chart(c, {
        type: "line",
        data: {
          labels: data.map(m => m.period),
          datasets: [
            {
              label: "Valor Real",
              data: data.map(m => m.value),
              borderColor: "#286de0",
              backgroundColor: "#286de01c",
              fill: true,
              tension: 0.3
            },
            {
              label: "Meta",
              data: data.map(() => k.target),
              borderColor: "#dc2626",
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { grid: { color: "#edf1f5" } }, x: { grid: { display: false } } }
        }
      });
    }
  }
}

function showInitiativeDetail(id) {
  const i = state.initiatives.find(x => x.id === id);
  if (!i) return;
  const body = `<div class="grid" style="gap:13px">
    <div class="info-box">
      <h3 style="margin:0 0 8px">${escapeHtml(i.name)}</h3>
      ${escapeHtml(i.description || "")}
      <p style="margin-top:10px">
        <strong>Objetivo:</strong> ${escapeHtml(i.objectiveId)} · ${escapeHtml(objectiveName(i.objectiveId))}<br>
        <strong>KPI Vinculado:</strong> ${escapeHtml(kpiName(i.kpiId))}<br>
        <strong>Responsable:</strong> ${escapeHtml(i.owner)} · ${escapeHtml(i.area || "")}<br>
        <strong>Fechas:</strong> ${escapeHtml(i.start)} hasta ${escapeHtml(i.end)}<br>
        <strong>Presupuesto:</strong> ${currency(i.budget)}
      </p>
    </div>
    <div class="kpi-result">
      <div><small>Avance de la Iniciativa</small><strong>${i.progress}%</strong></div>
      <span class="status ${i.status === "Finalizada" ? "good" : "blue"}">${escapeHtml(i.status)}</span>
    </div>
  </div>`;
  showModal(i.id + " · Detalle de Iniciativa", body, "Cerrar", closeModal, "PORTAFOLIO DE PROYECTOS");
}

function generateReport(type) {
  let list = state.kpis.slice();
  let title = "Reporte de Indicadores";
  let subtitle = `${list.length} KPIs evaluados`;

  if (type === "general") {
    title = "Reporte General del Balanced Scorecard";
    subtitle = `Índice Global: ${state.dashboard?.globalIndex ?? 86.3}% · ${state.kpis.length} KPIs oficiales`;
    $("#reportResult").innerHTML = `
      <div class="grid dashboard-grid">
        <div>
          <div class="kpi-result">
            <div>
              <small>Índice Global BSC TechPeru</small>
              <strong>${state.dashboard?.globalIndex ?? 86.3}%</strong>
            </div>
            <span class="status ${state.dashboard?.globalIndex >= 90 ? "good" : "warn"}">
              ${state.dashboard?.globalIndex >= 90 ? "✅ LOGRADO" : "⚠️ EN RIESGO"}
            </span>
          </div>
          <p class="form-note">Evaluación de 20 objetivos estratégicos simétricos (5 por perspectiva) y ${state.kpis.length} KPIs.</p>
        </div>
        <div class="chart-wrap short"><canvas id="reportChart"></canvas></div>
      </div>
      ${renderKpiTable(state.kpis, false)}
    `;
  } else if (type === "perspectivas") {
    title = "Reporte de Desempeño por Perspectiva";
    subtitle = "4 perspectivas con 5 objetivos simétricos cada una (25% peso c/u)";
    $("#reportResult").innerHTML = `
      <div class="perspective-bars" style="margin-bottom:20px">
        ${perspectiveBreakdown().map(x => `
          <div class="perspective-row">
            <div class="perspective-name"><span class="persp-dot" style="background:${x.color}"></span>${x.label}</div>
            <div class="progress-track"><div class="progress-fill" style="width:${x.pct || 0}%;background:${x.color}"></div></div>
            <div class="perspective-value">${x.pct !== null ? fmt(x.pct) + "%" : "—"}</div>
          </div>
        `).join("")}
      </div>
      ${renderKpiTable(state.kpis, false)}
    `;
  } else if (type === "criticos") {
    title = "Reporte de Indicadores Críticos y en Riesgo";
    list = state.kpis.filter(k => (k.pct || 0) < 90).sort((a, b) => a.pct - b.pct);
    subtitle = `${list.length} KPIs requieren atención prioritaria`;
    $("#reportResult").innerHTML = renderKpiTable(list, false);
  } else if (type === "kpis") {
    title = `Catálogo Integral de Indicadores (${state.kpis.length} KPIs)`;
    subtitle = "Metas, valores reales y semáforos oficiales";
    $("#reportResult").innerHTML = renderKpiTable(state.kpis, false);
  } else if (type === "iniciativas") {
    title = "Reporte de Iniciativas Estratégicas";
    subtitle = `${state.initiatives.length} proyectos del portafolio`;
    $("#reportResult").innerHTML = initiativesTable(state.initiatives);
  } else if (type === "mediciones") {
    title = "Reporte de Historial de Mediciones";
    const all = state.kpis.flatMap(k => (k.measurements || []).map(m => ({ ...m, kpi: k }))).sort((a, b) => b.date.localeCompare(a.date));
    subtitle = `${all.length} mediciones registradas`;
    $("#reportResult").innerHTML = measurementTable(all);
  }

  $("#reportResultTitle").textContent = title;
  $("#reportResultSub").textContent = subtitle;
  drawReportCharts();
  toast("Reporte generado: " + title);
}

function exportCurrentReport() {
  const rows = [
    ["Código", "Indicador", "Perspectiva", "Objetivo", "Tipo", "Meta", "Real", "Unidad", "Cumplimiento %", "Estado", "Responsable"],
    ...state.kpis.map(k => [
      k.id,
      k.name,
      perspectiveLabel(k.perspective),
      k.objectiveId,
      k.direction,
      k.target,
      k.current,
      k.unit,
      k.pct,
      statusOf(k).label,
      k.owner
    ])
  ];
  exportCSV("reporte_kpis_techperu.csv", rows);
}

function exportCSV(filename, rows) {
  const csv = rows.map(r => r.map(v => {
    let s = String(v ?? "");
    if (/[",\n;]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(";")).join("\r\n");
  downloadBlob(filename, "\ufeff" + csv, "text/csv;charset=utf-8");
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function confirmReset() {
  showModal(
    "Restablecer Datos Oficiales",
    `<div class="info-box">
      <strong>¿Restablecer los 20 objetivos estratégicos y 52 KPIs iniciales?</strong>
      <p>Esta acción restablecerá el conjunto de datos completo (5 objetivos simétricos por perspectiva) con sus metas y valores reales acumulados.</p>
    </div>`,
    "Sí, restablecer datos",
    async () => {
      try {
        const res = await API.resetData();
        if (res.success) {
          await syncState();
          closeModal();
          renderPage("dashboard");
          toast("Datos oficiales de TechPeru SAC restablecidos correctamente.");
        } else {
          toast(res.error || "Error al restablecer datos.", "error");
        }
      } catch (e) {
        toast("Error al conectar con el servidor: " + e.message, "error");
      }
    },
    "CONFIRMACIÓN BACKEND"
  );
}

async function init() {
  await syncState();

  $("#loginForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const ok = login($("#loginUser").value.trim(), $("#loginPass").value);
    $("#loginError")?.classList.toggle("hidden", ok);
    if (!ok) toast("Usuario o contraseña incorrectos.", "error");
  });

  $("#logoutBtn")?.addEventListener("click", logout);

  $("#mainNav")?.addEventListener("click", e => {
    const b = e.target.closest("[data-page]");
    if (b) navigate(b.dataset.page);
  });

  $("#menuToggle")?.addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#sidebarClose")?.addEventListener("click", () => $("#sidebar").classList.remove("open"));

  // Selector dinámico de Período
  $("#globalPeriod")?.addEventListener("change", async (e) => {
    const p = e.target.value;
    state.periodo = p;
    await syncState(p);
    renderPage(currentPage);
    toast("Horizonte estratégico cambiado a " + p);
  });

  $("#notificationsBtn")?.addEventListener("click", () => {
    const old = $(".notification-pop");
    if (old) { old.remove(); return; }
    const pop = document.createElement("div");
    pop.className = "notification-pop";
    const alerts = state.kpis.filter(k => (k.pct || 0) < 90).slice(0, 5);
    pop.innerHTML = `<h3>Alertas de Desempeño BSC (TechPeru ${state.periodo})</h3>
      ${alerts.map(k => `
        <div class="notification-item">
          <strong>${escapeHtml(k.name)}</strong>
          <span class="status ${statusOf(k).key}">${statusOf(k).label}</span>
          <small>${escapeHtml(k.id)} · ${fmt(k.pct)}% cumplimiento (${k.direction === "inverso" || k.direction === "menor" ? "Inverso" : "Directo"})</small>
        </div>
      `).join("") || `<p class="muted">Todos los indicadores están cumplidos.</p>`}`;
    document.body.append(pop);

    document.addEventListener("click", function closePop(ev) {
      if (!pop.contains(ev.target) && ev.target !== $("#notificationsBtn")) {
        pop.remove();
        document.removeEventListener("click", closePop);
      }
    });
  });

  if (location.hash && renderers[location.hash.slice(1)]) {
    currentPage = location.hash.slice(1);
  }

  if (restoreUser()) {
    showApp();
  } else {
    showLogin();
  }
}

document.addEventListener("DOMContentLoaded", init);
})();