import { useMemo, useState } from "react";
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

const errorReports = [
  {
    id: "ERR-1024",
    date: "2026-04-10 20:12",
    type: "No detectó viaje",
    user: "cristian@demo.com",
    device: "Samsung A15",
    appVersion: "1.0.8",
    status: "Pendiente",
    description: "La oferta apareció pero la app no reaccionó.",
    logs: "viaje_detectado=false | overlay=activo | servicio=activo",
  },
  {
    id: "ERR-1023",
    date: "2026-04-10 18:44",
    type: "Historial duplicado",
    user: "usuario2@demo.com",
    device: "Moto G54",
    appVersion: "1.0.7",
    status: "Revisado",
    description: "Entré a Inicio y aparecieron viajes fantasma.",
    logs: "inicio_refresh=true | legacy_merge=true | duplicates=15",
  },
  {
    id: "ERR-1022",
    date: "2026-04-09 23:06",
    type: "Overlay no visible",
    user: "usuario3@demo.com",
    device: "Samsung A12",
    appVersion: "1.0.8",
    status: "Resuelto",
    description: "Después de bloquear y desbloquear, desapareció la burbuja.",
    logs: "overlay_permission=true | battery_opt=false | service_restart=false",
  },
];

const licenses = [
  {
    code: "VR-7D-001",
    plan: "Demo 7 días",
    assignedTo: "cristian@demo.com",
    device: "device_abc_123",
    status: "Activa",
    expiresAt: "2026-04-17",
  },
  {
    code: "VR-M-014",
    plan: "Mensual",
    assignedTo: "usuario2@demo.com",
    device: "device_xyz_999",
    status: "Vencida",
    expiresAt: "2026-04-02",
  },
  {
    code: "VR-A-003",
    plan: "Anual",
    assignedTo: "usuario3@demo.com",
    device: "device_kkk_777",
    status: "Activa",
    expiresAt: "2027-02-18",
  },
];

const devices = [
  {
    id: "device_abc_123",
    user: "cristian@demo.com",
    model: "Samsung A15",
    android: "14",
    version: "1.0.8",
    license: "VR-7D-001",
    lastSeen: "2026-04-10 20:15",
    state: "Activo",
  },
  {
    id: "device_xyz_999",
    user: "usuario2@demo.com",
    model: "Moto G54",
    android: "13",
    version: "1.0.7",
    license: "VR-M-014",
    lastSeen: "2026-04-09 10:03",
    state: "Inactivo",
  },
  {
    id: "device_kkk_777",
    user: "usuario3@demo.com",
    model: "Redmi Note 13",
    android: "14",
    version: "1.0.8",
    license: "VR-A-003",
    lastSeen: "2026-04-10 19:51",
    state: "Activo",
  },
];

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
  const [selectedError, setSelectedError] = useState(errorReports[0]);

  const filteredErrors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return errorReports;
    return errorReports.filter((item) =>
      [item.id, item.type, item.user, item.device, item.appVersion, item.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search]);

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
          <button className={tab === "errores" ? "tab active-tab" : "tab"} onClick={() => setTab("errores")}>
            Errores
          </button>
          <button className={tab === "licencias" ? "tab active-tab" : "tab"} onClick={() => setTab("licencias")}>
            Licencias
          </button>
          <button className={tab === "dispositivos" ? "tab active-tab" : "tab"} onClick={() => setTab("dispositivos")}>
            Dispositivos
          </button>
          <button className={tab === "demos" ? "tab active-tab" : "tab"} onClick={() => setTab("demos")}>
            Demos
          </button>
          <button className={tab === "versiones" ? "tab active-tab" : "tab"} onClick={() => setTab("versiones")}>
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
                      {filteredErrors.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.type}</td>
                          <td>{item.appVersion}</td>
                          <td>{item.device}</td>
                          <td>
                            <span className={getBadgeClass(item.status)}>{item.status}</span>
                          </td>
                          <td>
                            <button className="ghost-btn" onClick={() => setSelectedError(item)}>
                              <Eye size={14} /> Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
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
                    <strong>{selectedError.user}</strong>
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
                  <div className="log-box">{selectedError.logs}</div>
                </div>

                <div className="action-row">
                  <button className="primary-btn">Marcar revisado</button>
                  <button className="secondary-btn">Marcar resuelto</button>
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
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((item) => (
                      <tr key={item.code}>
                        <td>{item.code}</td>
                        <td>{item.plan}</td>
                        <td>{item.assignedTo}</td>
                        <td>{item.device}</td>
                        <td>{item.expiresAt}</td>
                        <td>
                          <span className={getBadgeClass(item.status)}>{item.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((item) => (
                      <tr key={item.id}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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