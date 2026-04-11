import { useEffect, useMemo, useState } from "react";
import {
  Search,
  AlertTriangle,
  KeyRound,
  Smartphone,
  FlaskConical,
  GitBranch,
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
  const [tab, setTab] = useState("errores");
  const [search, setSearch] = useState("");
  const [selectedErrorId, setSelectedErrorId] = useState("");

  const [errorReports, setErrorReports] = useState([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [errorsError, setErrorsError] = useState("");
  const [reviewingErrorId, setReviewingErrorId] = useState("");
  const [reviewErrorActionError, setReviewErrorActionError] = useState("");

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
      const appVersion = item?.app_version || "-";
      const device = item?.device_name || item?.device_hash || "-";
      const deviceHash = item?.device_hash || "-";
      const status =
        item?.status === "pending"
          ? "Pendiente"
          : item?.status === "reviewed"
            ? "Revisado"
            : item?.status === "resolved"
              ? "Resuelto"
              : item?.status || "-";
      const date = item?.created_at || "-";

      return { rawId, id, type, description, appVersion, device, deviceHash, status, date };
    });
  }, [errorReports]);

  const filteredErrors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return errorRows;
    return errorRows.filter((item) =>
      [item.id, item.type, item.device, item.appVersion, item.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, errorRows]);

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

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand-pill">VR Admin</div>
        <h1>Panel operativo</h1>
        <p className="sidebar-text">
          Control de errores, licencias, dispositivos, demos y versiones.
        </p>

        <nav className="sidebar-nav">
          <button className="nav-item active">Dashboard</button>
          <button className="nav-item">Errores</button>
          <button className="nav-item">Licencias</button>
          <button className="nav-item">Dispositivos</button>
          <button className="nav-item">Demos</button>
          <button className="nav-item">Versiones</button>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1 className="main-title">Viaje Rentable Admin</h1>
            <p className="main-subtitle">
              Acá ordenás el negocio y dejás de depender de pgAdmin para operar el día a día.
            </p>
          </div>

          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar error, versión, usuario o dispositivo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="metrics-grid">
          <MetricCard
            title="Errores pendientes"
            value="8"
            hint="Los que requieren revisión real"
            icon={AlertTriangle}
          />
          <MetricCard
            title="Licencias activas"
            value="14"
            hint="Usuarios hoy con acceso"
            icon={KeyRound}
          />
          <MetricCard
            title="Dispositivos activos"
            value="11"
            hint="Última conexión reciente"
            icon={Smartphone}
          />
          <MetricCard
            title="Demos activas"
            value="3"
            hint="Controlá quién está probando"
            icon={FlaskConical}
          />
          <MetricCard
            title="Versión actual"
            value="1.0.8"
            hint="La que debería dominar"
            icon={GitBranch}
          />
        </div>

        <div className="tabs">
          <button
            className={tab === "errores" ? "tab active-tab" : "tab"}
            onClick={() => setTab("errores")}
          >
            Errores
          </button>
          <button
            className={tab === "licencias" ? "tab active-tab" : "tab"}
            onClick={() => setTab("licencias")}
          >
            Licencias
          </button>
          <button
            className={tab === "dispositivos" ? "tab active-tab" : "tab"}
            onClick={() => setTab("dispositivos")}
          >
            Dispositivos
          </button>
          <button
            className={tab === "demos" ? "tab active-tab" : "tab"}
            onClick={() => setTab("demos")}
          >
            Demos
          </button>
          <button
            className={tab === "versiones" ? "tab active-tab" : "tab"}
            onClick={() => setTab("versiones")}
          >
            Versiones
          </button>
        </div>

        {tab === "errores" && (
          <>
            <SectionTitle
              title="Errores reportados"
              subtitle="Acá detectás qué se rompió, en qué versión y en qué dispositivo. Sin adivinar."
            />

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
                          <th>ID</th>
                          <th>Tipo</th>
                          <th>Versión</th>
                          <th>Dispositivo</th>
                          <th>Estado</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredErrors.map((item, index) => (
                          <tr key={`${item.id}-${index}`}>
                            <td>{item.id}</td>
                            <td>{item.type}</td>
                            <td>{item.appVersion}</td>
                            <td>{item.device}</td>
                            <td>
                              <span className={getBadgeClass(item.status)}>{item.status}</span>
                            </td>
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
                        <p className="muted">{selectedError.id}</p>
                        <h3>{selectedError.type}</h3>
                      </div>
                      <span className={getBadgeClass(selectedError.status)}>{selectedError.status}</span>
                    </div>

                    <div className="detail-grid">
                      <div className="detail-box">
                        <span>Usuario</span>
                        <strong>-</strong>
                      </div>
                      <div className="detail-box">
                        <span>Dispositivo</span>
                        <strong>{selectedError.device}</strong>
                      </div>
                      <div className="detail-box">
                        <span>Versión</span>
                        <strong>{selectedError.appVersion}</strong>
                      </div>
                      <div className="detail-box">
                        <span>Fecha</span>
                        <strong>{selectedError.date}</strong>
                      </div>
                    </div>

                    <div className="detail-section">
                      <p className="detail-label">Descripción</p>
                      <div className="detail-content">{selectedError.description}</div>
                    </div>

                    <div className="detail-section">
                      <p className="detail-label">Logs resumidos</p>
                      <div className="log-box">
                        {selectedError.deviceHash && selectedError.deviceHash !== "-"
                          ? selectedError.deviceHash
                          : "Sin logs"}
                      </div>
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
                      <button className="secondary-btn">Marcar resuelto</button>
                    </div>
                  </>
                )}
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
                            <td>{item.id}</td>
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
