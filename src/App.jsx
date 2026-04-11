import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  LayoutDashboard,
  AlertTriangle,
  KeyRound,
  Smartphone,
  FlaskConical,
  GitBranch,
  Copy,
  Bot,
  Eye
} from "lucide-react";
import "./App.css";

const API_BASE_URL = "https://viaje-rentable-api.onrender.com";

const demos = [
  {
    device: "device_abc_123",
    user: "cristian@demo.com",
    startedAt: "2026-04-10",
    expiresAt: "2026-04-17",
    state: "Activa",
  },
  {
    device: "device_hhh_444",
    user: "usuario4@demo.com",
    startedAt: "2026-04-01",
    expiresAt: "2026-04-08",
    state: "Vencida",
  },
];

const versions = [
  {
    version: "1.0.8",
    devices: 12,
    users: 10,
    minSupported: true,
    state: "Actual",
  },
  {
    version: "1.0.7",
    devices: 4,
    users: 4,
    minSupported: false,
    state: "Desactualizada",
  },
  {
    version: "1.0.6",
    devices: 2,
    users: 2,
    minSupported: false,
    state: "Bloqueable",
  },
];

function getBadgeClass(value) {
  if (
    value === "Pendiente" ||
    value === "Vencida" ||
    value === "Desactualizada" ||
    value === "Bloqueable"
  ) {
    return "badge badge-red";
  }
  if (value === "Revisado") {
    return "badge badge-yellow";
  }
  return "badge badge-green";
}

function MetricCard({ title, value, hint, icon: Icon }) {
  return (
    <div className="card metric-card">
      <div>
        <p className="muted">{title}</p>
        <h3>{value}</h3>
        <p className="hint">{hint}</p>
      </div>
      <div className="icon-box">
        <Icon size={20} />
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(() => {
    try {
      const saved = window.localStorage.getItem("vr_admin_tab");
      const validTabs = new Set(["inicio", "errores", "licencias", "dispositivos", "demos", "versiones"]);
      return validTabs.has(saved) ? saved : "inicio";
    } catch {
      return "inicio";
    }
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedErrorId, setSelectedErrorId] = useState("");

  const [errorReports, setErrorReports] = useState([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [errorsError, setErrorsError] = useState("");
  const [reviewingErrorId, setReviewingErrorId] = useState("");
  const [reviewErrorActionError, setReviewErrorActionError] = useState("");
  const [deletingErrorId, setDeletingErrorId] = useState("");
  const [deleteErrorActionError, setDeleteErrorActionError] = useState("");
  const [deletingReviewed, setDeletingReviewed] = useState(false);
  const [deleteReviewedActionError, setDeleteReviewedActionError] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllActionError, setDeleteAllActionError] = useState("");

  const [licenses, setLicenses] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [licensesError, setLicensesError] = useState("");
  const [devicesError, setDevicesError] = useState("");
  const [licensesActionError, setLicensesActionError] = useState("");
  const [devicesActionError, setDevicesActionError] = useState("");
  const [togglingLicenseId, setTogglingLicenseId] = useState("");
  const [togglingDeviceId, setTogglingDeviceId] = useState("");
  const [copiedDeviceId, setCopiedDeviceId] = useState("");
  const [copyDeviceError, setCopyDeviceError] = useState("");
  const copyDeviceTimeoutRef = useRef(0);
  const copyDeviceErrorTimeoutRef = useRef(0);

  useEffect(() => {
    try {
      window.localStorage.setItem("vr_admin_tab", tab);
    } catch {
      // ignore
    }
  }, [tab]);

  const fetchErrors = async ({ signal } = {}) => {
    setLoadingErrors(true);
    setErrorsError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/errors`, { signal });
      if (!res.ok) {
        setErrorReports([]);
        setErrorsError(`Error al cargar errores (${res.status})`);
        return;
      }

      const payload = await res.json();
      if (payload?.ok !== true) {
        setErrorReports([]);
        setErrorsError("Error al cargar errores");
        return;
      }

      const data = Array.isArray(payload.data) ? payload.data : [];
      setErrorReports(data);
      if (!Array.isArray(payload.data)) {
        setErrorsError("Error al cargar errores");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setErrorReports([]);
        setErrorsError("Error al cargar errores");
      }
    } finally {
      setLoadingErrors(false);
    }
  };

  const fetchLicenses = async ({ signal } = {}) => {
    setLoadingLicenses(true);
    setLicensesError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/licenses`, { signal });
      if (!res.ok) {
        setLicenses([]);
        setLicensesError(`Error al cargar licencias (${res.status})`);
        return;
      }

      const payload = await res.json();
      if (payload?.ok !== true) {
        setLicenses([]);
        setLicensesError("Error al cargar licencias");
        return;
      }

      const data = Array.isArray(payload.data) ? payload.data : [];
      setLicenses(data);
      if (!Array.isArray(payload.data)) {
        setLicensesError("Error al cargar licencias");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setLicenses([]);
        setLicensesError("Error al cargar licencias");
      }
    } finally {
      setLoadingLicenses(false);
    }
  };

  const fetchDevices = async ({ signal } = {}) => {
    setLoadingDevices(true);
    setDevicesError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/devices`, { signal });
      if (!res.ok) {
        setDevices([]);
        setDevicesError(`Error al cargar dispositivos (${res.status})`);
        return;
      }

      const payload = await res.json();
      if (payload?.ok !== true) {
        setDevices([]);
        setDevicesError("Error al cargar dispositivos");
        return;
      }

      const data = Array.isArray(payload.data) ? payload.data : [];
      setDevices(data);
      if (!Array.isArray(payload.data)) {
        setDevicesError("Error al cargar dispositivos");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setDevices([]);
        setDevicesError("Error al cargar dispositivos");
      }
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleToggleLicense = async (id) => {
    if (!id) {
      setLicensesActionError("No se pudo ejecutar la acción (id inválido)");
      return;
    }

    setTogglingLicenseId(id);
    setLicensesActionError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/licenses/${encodeURIComponent(id)}/toggle`,
        { method: "POST" }
      );
      if (!res.ok) {
        setLicensesActionError(`Error al actualizar licencia (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setLicensesActionError("Error al actualizar licencia");
        return;
      }
      await fetchLicenses();
    } catch (err) {
      setLicensesActionError("Error al actualizar licencia");
    } finally {
      setTogglingLicenseId("");
    }
  };

  const handleToggleDevice = async (id) => {
    if (!id) {
      setDevicesActionError("No se pudo ejecutar la acción (id inválido)");
      return;
    }

    setTogglingDeviceId(id);
    setDevicesActionError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/devices/${encodeURIComponent(id)}/toggle`,
        { method: "POST" }
      );
      if (!res.ok) {
        setDevicesActionError(`Error al actualizar dispositivo (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setDevicesActionError("Error al actualizar dispositivo");
        return;
      }
      await fetchDevices();
    } catch (err) {
      setDevicesActionError("Error al actualizar dispositivo");
    } finally {
      setTogglingDeviceId("");
    }
  };

  const handleCopyDeviceId = async (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (!text || text === "-") return;

    setCopyDeviceError("");
    try {
      if (navigator?.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }

      setCopiedDeviceId(text);
      window.clearTimeout(copyDeviceTimeoutRef.current);
      copyDeviceTimeoutRef.current = window.setTimeout(() => setCopiedDeviceId(""), 1200);
    } catch {
      setCopyDeviceError("No se pudo copiar");
      window.clearTimeout(copyDeviceErrorTimeoutRef.current);
      copyDeviceErrorTimeoutRef.current = window.setTimeout(() => setCopyDeviceError(""), 1500);
    }
  };

  const handleReviewError = async (id) => {
    if (id === null || id === undefined || id === "") {
      setReviewErrorActionError("No se pudo ejecutar la acción (id inválido)");
      return;
    }

    const normalizedId = String(id);
    setReviewingErrorId(normalizedId);
    setReviewErrorActionError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/errors/${encodeURIComponent(normalizedId)}/review`,
        { method: "POST" }
      );
      if (!res.ok) {
        setReviewErrorActionError(`Error al marcar revisado (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setReviewErrorActionError("Error al marcar revisado");
        return;
      }
      await fetchErrors();
      setSelectedErrorId(normalizedId);
    } catch (err) {
      setReviewErrorActionError("Error al marcar revisado");
    } finally {
      setReviewingErrorId("");
    }
  };

  const handleDeleteError = async (id) => {
    if (id === null || id === undefined || id === "") {
      setDeleteErrorActionError("No se pudo ejecutar la acción (id inválido)");
      return;
    }

    const normalizedId = String(id);
    const ok = window.confirm("¿Eliminar este error? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeletingErrorId(normalizedId);
    setDeleteErrorActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/errors/${encodeURIComponent(normalizedId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setDeleteErrorActionError(`Error al eliminar (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setDeleteErrorActionError("Error al eliminar");
        return;
      }
      await fetchErrors();
    } catch (err) {
      setDeleteErrorActionError("Error al eliminar");
    } finally {
      setDeletingErrorId("");
    }
  };

  const handleDeleteReviewedErrors = async () => {
    const ok = window.confirm("¿Eliminar todos los errores revisados? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeletingReviewed(true);
    setDeleteReviewedActionError("");
    try {
      const res = await fetch(new URL("/admin/errors/reviewed", API_BASE_URL), { method: "DELETE" });
      if (!res.ok) {
        setDeleteReviewedActionError(`Error al eliminar revisados (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setDeleteReviewedActionError("Error al eliminar revisados");
        return;
      }
      await fetchErrors();
    } catch (err) {
      setDeleteReviewedActionError("Error al eliminar revisados");
    } finally {
      setDeletingReviewed(false);
    }
  };

  const handleDeleteAllErrors = async () => {
    const confirmText = window.prompt(
      "Acción irreversible.\n\nEscribí BORRAR TODO para confirmar la eliminación de TODOS los errores:"
    );
    if (confirmText !== "BORRAR TODO") return;

    const ok = window.confirm("Última confirmación: ¿seguro que querés borrar TODOS los errores?");
    if (!ok) return;

    setDeletingAll(true);
    setDeleteAllActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/errors/delete-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE_ALL_ERRORS" }),
      });
      if (!res.ok) {
        setDeleteAllActionError(`Error al eliminar todo (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setDeleteAllActionError("Error al eliminar todo");
        return;
      }
      await fetchErrors();
    } catch (err) {
      setDeleteAllActionError("Error al eliminar todo");
    } finally {
      setDeletingAll(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchErrors({ signal: controller.signal });
    fetchLicenses({ signal: controller.signal });
    fetchDevices({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errorRows = useMemo(() => {
    return errorReports.map((item) => {
      const rawId = item?.id ? String(item.id) : "";
      const id = item?.id || "-";
      const type = item?.error_type || "-";
      const description = item?.description || "-";
      const screen = item?.screen || "-";
      const appVersion = item?.app_version || "-";
      const androidVersion = item?.android_version || "-";
      const deviceName = item?.device_name || "-";
      const deviceHash = item?.device_hash || "-";
      const country = item?.country || "-";
      const source = item?.source || "-";
      const status =
        item?.status === "pending"
          ? "Pendiente"
          : item?.status === "reviewed"
            ? "Revisado"
            : item?.status === "resolved"
              ? "Resuelto"
              : item?.status || "-";
      const createdAt = item?.created_at || "-";
      const userEmail = item?.user_email || "-";

      return {
        rawId,
        id,
        type,
        description,
        screen,
        appVersion,
        androidVersion,
        deviceName,
        country,
        source,
        status,
        createdAt,
        deviceHash,
        userEmail,
      };
    });
  }, [errorReports]);

  const errorTypeOptions = useMemo(() => {
    const unique = new Set();
    for (const row of errorRows) {
      if (row?.type && row.type !== "-") unique.add(row.type);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [errorRows]);

  useEffect(() => {
    if (filterType === "all") return;
    if (errorTypeOptions.includes(filterType)) return;
    setFilterType("all");
  }, [errorTypeOptions, filterType]);

  const filteredErrors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return errorRows.filter((e) => {
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "pending" && e.status === "Pendiente") ||
        (filterStatus === "reviewed" && e.status === "Revisado");

      const matchType = filterType === "all" || e.type === filterType;

      const matchSearch =
        q === "" ||
        e.deviceName?.toLowerCase().includes(q) ||
        e.appVersion?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q);

      return matchStatus && matchType && matchSearch;
    });
  }, [errorRows, filterStatus, filterType, search]);

  useEffect(() => {
    if (filteredErrors.length === 0) return;
    const exists = filteredErrors.some((row) => row.rawId === selectedErrorId || row.id === selectedErrorId);
    if (exists) return;
    const first = filteredErrors[0];
    setSelectedErrorId(first.rawId ? String(first.rawId) : String(first.id));
  }, [filteredErrors, selectedErrorId]);

  useEffect(() => {
    if (errorRows.length === 0) {
      if (selectedErrorId) setSelectedErrorId("");
      return;
    }
    const exists = errorRows.some((row) => row.rawId === selectedErrorId || row.id === selectedErrorId);
    if (!selectedErrorId || !exists) {
      const first = errorRows[0];
      setSelectedErrorId(first.rawId ? String(first.rawId) : String(first.id));
    }
  }, [errorRows, selectedErrorId]);

  const selectedError = useMemo(() => {
    return (
      errorRows.find((row) => row.rawId === selectedErrorId) ||
      errorRows.find((row) => row.id === selectedErrorId) ||
      null
    );
  }, [errorRows, selectedErrorId]);

  const errorStats = useMemo(() => {
    const total = errorRows.length;
    const pending = errorRows.filter((e) => e.status === "Pendiente").length;
    const reviewed = errorRows.filter((e) => e.status === "Revisado").length;

    const typeCounts = new Map();
    const versionCounts = new Map();

    for (const e of errorRows) {
      if (e?.type && e.type !== "-") {
        typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1);
      }
      if (e?.appVersion && e.appVersion !== "-") {
        versionCounts.set(e.appVersion, (versionCounts.get(e.appVersion) || 0) + 1);
      }
    }

    const topTypes = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));

    const mostFrequentType = topTypes[0]?.type || "-";
    const mostFrequentTypeCount = topTypes[0]?.count || 0;

    const topVersions = Array.from(versionCounts.entries()).sort((a, b) => b[1] - a[1]);
    const mostConflictiveVersion = topVersions[0]?.[0] || "-";
    const mostConflictiveVersionCount = topVersions[0]?.[1] || 0;

    return {
      total,
      pending,
      reviewed,
      mostFrequentType,
      mostFrequentTypeCount,
      mostConflictiveVersion,
      mostConflictiveVersionCount,
      topTypes,
    };
  }, [errorRows]);

  const licenseRows = useMemo(() => {
    return licenses.map((item) => {
      const rawId = item?.id || item?.license_id || item?.licenseId || "";
      const code = item?.code || item?.id || "-";
      const plan = item?.plan_name || item?.plan || "-";
      const assignedTo = item?.email || item?.user_email || item?.user_id || "-";
      const device = item?.device_hash || item?.device_id || "-";
      const expiresAt = item?.expires_at || item?.expiresAt || "-";
      const status =
        typeof item?.is_active === "boolean"
          ? item.is_active
            ? "Activa"
            : "Inactiva"
          : "-";

      return { rawId, code, plan, assignedTo, device, expiresAt, status };
    });
  }, [licenses]);

  const deviceRows = useMemo(() => {
    return devices.map((item) => {
      const rawId = item?.id || item?.device_hash || item?.device_id || "";
      const id = item?.device_hash || item?.id || "-";
      const user = item?.email || item?.user_email || item?.user_id || "-";
      const model = item?.device_name || item?.model || "-";
      const android = item?.android_version || item?.android || "-";
      const version = item?.app_version || item?.version || "-";
      const license = item?.license_id || item?.license || "-";
      const lastSeen = item?.last_seen_at || item?.lastSeen || "-";
      const state =
        typeof item?.is_active === "boolean"
          ? item.is_active
            ? "Activo"
            : "Inactivo"
          : "-";

      return { rawId, id, user, model, android, version, license, lastSeen, state };
    });
  }, [devices]);

  const dashboardStats = useMemo(() => {
    const licensesActive = licenseRows.filter((l) => l.status === "Activa").length;
    const devicesActive = deviceRows.filter((d) => d.state === "Activo").length;
    const demosActive = demos.filter((d) => d.state === "Activa").length;
    const currentVersion = versions.find((v) => v.state === "Actual")?.version || "-";
    return { licensesActive, devicesActive, demosActive, currentVersion };
  }, [licenseRows, deviceRows]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand-pill">VR Admin</div>
        <h1>Panel operativo</h1>
        <p className="sidebar-text">
          Control de errores, licencias, dispositivos, demos y versiones.
        </p>

        <nav className="sidebar-nav">
          <button
            className={tab === "inicio" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("inicio")}
          >
            <LayoutDashboard size={16} style={{ marginRight: 10 }} />
            Inicio
          </button>
          <button
            className={tab === "errores" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("errores")}
          >
            <AlertTriangle size={16} style={{ marginRight: 10 }} />
            Errores
          </button>
          <button
            className={tab === "licencias" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("licencias")}
          >
            <KeyRound size={16} style={{ marginRight: 10 }} />
            Licencias
          </button>
          <button
            className={tab === "dispositivos" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("dispositivos")}
          >
            <Smartphone size={16} style={{ marginRight: 10 }} />
            Dispositivos
          </button>
          <button
            className={tab === "demos" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("demos")}
          >
            <FlaskConical size={16} style={{ marginRight: 10 }} />
            Demos
          </button>
          <button
            className={tab === "versiones" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("versiones")}
          >
            <GitBranch size={16} style={{ marginRight: 10 }} />
            Versiones
          </button>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1 className="main-title">Viaje Rentable Admin</h1>
          </div>

          {tab !== "errores" && tab !== "inicio" && (
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {tab === "inicio" && (
          <div className="dashboard-center">
            <SectionTitle title="Resumen" subtitle="" />
            <div className="metrics-grid dashboard-grid">
              <MetricCard
                title="Errores pendientes"
                value={String(errorStats.pending)}
                hint="Requieren revisión"
                icon={AlertTriangle}
              />
              <MetricCard
                title="Licencias activas"
                value={String(dashboardStats.licensesActive)}
                hint="Usuarios con acceso"
                icon={KeyRound}
              />
              <MetricCard
                title="Dispositivos activos"
                value={String(dashboardStats.devicesActive)}
                hint="Estado activo"
                icon={Smartphone}
              />
              <MetricCard
                title="Demos activas"
                value={String(dashboardStats.demosActive)}
                hint="En curso"
                icon={FlaskConical}
              />
              <MetricCard
                title="Versión actual"
                value={dashboardStats.currentVersion}
                hint="Referencia"
                icon={Bot}
              />
            </div>
          </div>
        )}

        {tab === "errores" && (
          <>
            <style>{`
              .errors-compact .card { padding: 14px; }
              .errors-compact .section-title { margin-bottom: 10px; }
              .errors-compact .section-title h2 { font-size: 18px; }
              .errors-compact .section-title p { margin-top: 4px; font-size: 12px; }
              .errors-compact h3 { margin: 0 0 10px; font-size: 14px; }
              .errors-compact .errors-grid { gap: 12px; }
              .errors-compact table { font-size: 12.5px; }
              .errors-compact th, .errors-compact td { padding: 8px 8px; }
              .errors-compact .search-box { padding: 8px 10px; border-radius: 12px; border: 0; box-shadow: none; min-width: 0; }
              .errors-compact .search-box:focus-within { border: 0; box-shadow: none; }
              .errors-compact .search-box input { font-size: 13px; border: 0; outline: none; box-shadow: none; }
              .errors-compact select { padding: 8px 10px; border-radius: 12px; border: 1px solid var(--border); font-size: 13px; background: var(--card); color: var(--text); }
              .errors-compact .primary-btn, .errors-compact .secondary-btn, .errors-compact .ghost-btn { padding: 8px 12px; border-radius: 12px; font-size: 13px; }
              .errors-compact .danger-btn { background: var(--danger); color: #fff; border: 1px solid var(--danger); }
              .errors-compact .danger-btn:hover { background: var(--danger-hover); border-color: var(--danger-hover); }
              .errors-compact .danger-btn:disabled { opacity: 0.6; cursor: not-allowed; }
              .errors-compact .detail-grid { margin: 12px 0; gap: 10px; }
              .errors-compact .detail-box { padding: 10px; }
              .errors-compact .detail-box span { font-size: 11px; }
              .errors-compact .detail-box strong { font-size: 12.5px; }
              .errors-compact .detail-section { margin-top: 10px; }
              .errors-compact .detail-label { margin: 0 0 6px; }
              .errors-compact .detail-content { font-size: 13px; }
              .errors-compact .log-box { font-size: 12px; padding: 10px; }
              .errors-compact .muted { font-size: 12px; }
            `}</style>

            <div className="errors-compact">
            <SectionTitle
              title="Errores reportados"
              subtitle="Gestión"
            />

            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  className="primary-btn danger-btn"
                  disabled={deletingReviewed || deletingAll || loadingErrors || errorStats.reviewed === 0}
                  onClick={handleDeleteReviewedErrors}
                >
                  {deletingReviewed ? "Eliminando revisados..." : `Eliminar revisados (${errorStats.reviewed})`}
                </button>

                <button
                  className="secondary-btn danger-btn"
                  disabled={deletingReviewed || deletingAll || loadingErrors || errorStats.total === 0}
                  onClick={handleDeleteAllErrors}
                >
                  {deletingAll ? "Eliminando todo..." : "Eliminar todo"}
                </button>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="reviewed">Revisado</option>
                </select>

                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">Tipos</option>
                  {errorTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <div className="search-box" style={{ flex: "1 1 260px", minWidth: 220 }}>
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Buscar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                <p className="muted">Total: {errorStats.total}</p>
                <p className="muted">Pendientes: {errorStats.pending}</p>
                <p className="muted">Revisados: {errorStats.reviewed}</p>
              </div>

              {!!deleteReviewedActionError && <p className="muted">{deleteReviewedActionError}</p>}
              {!!deleteAllActionError && <p className="muted">{deleteAllActionError}</p>}
              {!!deleteErrorActionError && <p className="muted">{deleteErrorActionError}</p>}
            </div>

            <div className="errors-grid">
              <div className="card">
                <h3>Listado</h3>
                {loadingErrors ? (
                  <p className="muted">Cargando errores...</p>
                ) : errorsError ? (
                  <p className="muted">{errorsError}</p>
                ) : errorRows.length === 0 ? (
                  <p className="muted">No hay errores</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Screen</th>
                          <th>Versión</th>
                          <th>Dispositivo</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredErrors.map((item, index) => (
                          <tr key={`${item.id}-${index}`}>
                            <td>{item.type}</td>
                            <td>
                              {item.description && item.description !== "-" && item.description.length > 80
                                ? `${item.description.slice(0, 80)}…`
                                : item.description}
                            </td>
                            <td>{item.screen}</td>
                            <td>{item.appVersion}</td>
                            <td>{item.deviceName}</td>
                            <td>
                              <span className={getBadgeClass(item.status)}>{item.status}</span>
                            </td>
                            <td>{item.createdAt}</td>
                            <td>
                              <button
                                className="ghost-btn"
                                onClick={() => setSelectedErrorId(item.rawId ? String(item.rawId) : String(item.id))}
                              >
                                <Eye size={14} /> Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card">
                {loadingErrors ? (
                  <p className="muted">Cargando errores...</p>
                ) : errorsError ? (
                  <p className="muted">{errorsError}</p>
                ) : !selectedError ? (
                  <p className="muted">No hay errores</p>
                ) : (
                  <>
                    <div className="detail-header">
                      <div>
                        <h3>{selectedError.type}</h3>
                      </div>
                      <span className={getBadgeClass(selectedError.status)}>{selectedError.status}</span>
                    </div>

                    <div className="detail-grid">
                      <div className="detail-box">
                        <span>Dispositivo</span>
                        <strong>{selectedError.deviceName}</strong>
                      </div>
                      <div className="detail-box">
                        <span>Versión</span>
                        <strong>{selectedError.appVersion}</strong>
                      </div>
                      <div className="detail-box">
                        <span>Pantalla</span>
                        <strong>{selectedError.screen}</strong>
                      </div>
                      <div className="detail-box">
                        <span>Fecha</span>
                        <strong>{selectedError.createdAt}</strong>
                      </div>
                    </div>

                    <div className="detail-section">
                      <p className="detail-label">Descripción</p>
                      <div className="detail-content">{selectedError.description}</div>
                    </div>

                    <div className="detail-section">
                      <p className="detail-label">Detalles</p>
                      <div className="table-wrap">
                        <table>
                          <tbody>
                            <tr>
                              <td className="muted">Device hash</td>
                              <td>{selectedError.deviceHash}</td>
                            </tr>
                            <tr>
                              <td className="muted">Source</td>
                              <td>{selectedError.source}</td>
                            </tr>
                            <tr>
                              <td className="muted">Android</td>
                              <td>{selectedError.androidVersion}</td>
                            </tr>
                            <tr>
                              <td className="muted">Country</td>
                              <td>{selectedError.country}</td>
                            </tr>
                            <tr>
                              <td className="muted">User email</td>
                              <td>{selectedError.userEmail || "-"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="detail-section">
                      <p className="detail-label">Logs resumidos</p>
                      <div className="log-box">Sin logs</div>
                    </div>

                    {!!reviewErrorActionError && <p className="muted">{reviewErrorActionError}</p>}
                    <div className="action-row">
                      <button
                        className="primary-btn"
                        disabled={
                          selectedError.status !== "Pendiente" ||
                          !selectedError.rawId ||
                          reviewingErrorId === selectedError.rawId ||
                          loadingErrors
                        }
                        onClick={() => handleReviewError(selectedError.rawId)}
                      >
                        {selectedError.status === "Revisado"
                          ? "Ya revisado"
                          : reviewingErrorId === selectedError.rawId
                            ? "Procesando..."
                            : "Marcar revisado"}
                      </button>
                      <button
                        className="secondary-btn danger-btn"
                        disabled={
                          !selectedError.rawId ||
                          deletingErrorId === selectedError.rawId ||
                          deletingReviewed ||
                          deletingAll ||
                          loadingErrors
                        }
                        onClick={() => handleDeleteError(selectedError.rawId)}
                      >
                        {deletingErrorId === selectedError.rawId ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
          </>
        )}

        {tab === "licencias" && (
          <>
            <SectionTitle
              title="Licencias"
              subtitle="Acá controlás qué código está activo, quién lo usa y cuándo vence."
            />
            <div className="card">
              {!!licensesActionError && <p className="muted">{licensesActionError}</p>}
              {loadingLicenses ? (
                <p className="muted">Cargando licencias...</p>
              ) : licensesError ? (
                <p className="muted">{licensesError}</p>
              ) : licenseRows.length === 0 ? (
                <p className="muted">No hay licencias</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Plan</th>
                        <th>Usuario</th>
                        <th>Dispositivo</th>
                        <th>Vence</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenseRows.map((item, index) => {
                        const canToggle = item.status === "Activa" || item.status === "Inactiva";
                        const nextLabel =
                          item.status === "Activa"
                            ? "Desactivar"
                            : item.status === "Inactiva"
                              ? "Activar"
                              : "-";
                        const isToggling = !!item.rawId && togglingLicenseId === item.rawId;

                        return (
                          <tr key={item.rawId ? item.rawId : `${item.code}-${index}`}>
                            <td>{item.code}</td>
                            <td>{item.plan}</td>
                            <td>{item.assignedTo}</td>
                            <td>{item.device}</td>
                            <td>{item.expiresAt}</td>
                            <td>
                              <span className={getBadgeClass(item.status)}>{item.status}</span>
                            </td>
                            <td>
                              <button
                                className="ghost-btn"
                                disabled={!canToggle || !item.rawId || isToggling || loadingLicenses}
                                onClick={() => handleToggleLicense(item.rawId)}
                              >
                                {isToggling ? "Procesando..." : nextLabel}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "dispositivos" && (
          <>
            <SectionTitle
              title="Dispositivos"
              subtitle="Acá ves qué equipo está usando cada cuenta y quién quedó con versión vieja."
            />
            <div className="card">
              {!!devicesActionError && <p className="muted">{devicesActionError}</p>}
              {!!copyDeviceError && <p className="muted">{copyDeviceError}</p>}
              {loadingDevices ? (
                <p className="muted">Cargando dispositivos...</p>
              ) : devicesError ? (
                <p className="muted">{devicesError}</p>
              ) : deviceRows.length === 0 ? (
                <p className="muted">No hay dispositivos</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Device ID</th>
                        <th>Usuario</th>
                        <th>Modelo</th>
                        <th>Android</th>
                        <th>Versión</th>
                        <th>Licencia</th>
                        <th>Última conexión</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deviceRows.map((item, index) => {
                        const canToggle = item.state === "Activo" || item.state === "Inactivo";
                        const nextLabel =
                          item.state === "Activo"
                            ? "Bloquear"
                            : item.state === "Inactivo"
                              ? "Liberar"
                              : "-";
                        const isToggling = !!item.rawId && togglingDeviceId === item.rawId;

                        return (
                          <tr key={item.rawId ? item.rawId : `${item.id}-${index}`}>
                            <td>
                              <div className="id-cell">
                                <span className="truncate-id mono" title={item.id}>
                                  {item.id}
                                </span>
                                <button
                                  type="button"
                                  className="ghost-btn icon-btn"
                                  title="Copiar"
                                  disabled={!item.id || item.id === "-"}
                                  onClick={() => handleCopyDeviceId(item.id)}
                                >
                                  <Copy size={16} />
                                </button>
                                {copiedDeviceId === item.id && <span className="muted">Copiado</span>}
                              </div>
                            </td>
                            <td>{item.user}</td>
                            <td>{item.model}</td>
                            <td>{item.android}</td>
                            <td>{item.version}</td>
                            <td>{item.license}</td>
                            <td>{item.lastSeen}</td>
                            <td>
                              <span className={getBadgeClass(item.state)}>{item.state}</span>
                            </td>
                            <td>
                              <button
                                className="ghost-btn"
                                disabled={!canToggle || !item.rawId || isToggling || loadingDevices}
                                onClick={() => handleToggleDevice(item.rawId)}
                              >
                                {isToggling ? "Procesando..." : nextLabel}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "demos" && (
          <>
            <SectionTitle
              title="Demos"
              subtitle="Acá controlás quién está probando, quién venció y quién puede estar queriendo abusar."
            />
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Usuario</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demos.map((item) => (
                      <tr key={`${item.device}-${item.startedAt}`}>
                        <td>{item.device}</td>
                        <td>{item.user}</td>
                        <td>{item.startedAt}</td>
                        <td>{item.expiresAt}</td>
                        <td>
                          <span className={getBadgeClass(item.state)}>{item.state}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "versiones" && (
          <>
            <SectionTitle
              title="Versiones"
              subtitle="Acá ves qué versión domina, cuáles quedaron viejas y cuáles ya deberías bloquear."
            />
            <div className="card">
              <div className="table-wrap">
                <table>
                    <thead>
                      <tr>
                        <th>Versión</th>
                        <th>Dispositivos</th>
                        <th>Usuarios</th>
                        <th>Mínima soportada</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                  <tbody>
                    {versions.map((item) => (
                      <tr key={item.version}>
                        <td>{item.version}</td>
                        <td>{item.devices}</td>
                        <td>{item.users}</td>
                        <td>{item.minSupported ? "Sí" : "No"}</td>
                        <td>
                          <span className={getBadgeClass(item.state)}>{item.state}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
