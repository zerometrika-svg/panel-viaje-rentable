import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  LayoutDashboard,
  AlertTriangle,
  AlertCircle,
  KeyRound,
  Smartphone,
  Timer,
  Download,
  TrendingUp,
  ListOrdered,
  Copy,
  Bot,
  Eye,
  HelpCircle,
  Plus,
  Stethoscope,
  Trash2,
  ClipboardCopy,
  CheckCircle2
} from "lucide-react";
import "./App.css";
import {
  deleteOfferFailureDiagnostic,
  deleteReviewedOfferFailureDiagnostics,
  getOfferFailureDiagnostics,
  reviewOfferFailureDiagnostic,
} from "./api/offerFailureDiagnostics";

const API_BASE_URL = "https://viaje-rentable-api.onrender.com";

function getBadgeClass(value) {
  if (
    value === "Pendiente" ||
    value === "Vencida" ||
    value === "Expirada" ||
    value === "Desactualizada" ||
    value === "Bloqueable"
  ) {
    return "badge badge-red";
  }
  if (value === "Revisado" || value === "Pausada") {
    return "badge badge-yellow";
  }
  return "badge badge-green";
}

function parseDate(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();

  const localMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (localMatch) {
    const year = Number(localMatch[1]);
    const month = Number(localMatch[2]);
    const day = Number(localMatch[3]);
    const hour = Number(localMatch[4]);
    const minute = Number(localMatch[5]);
    const second = Number(localMatch[6] || "0");
    const localDate = new Date(year, month - 1, day, hour, minute, second, 0);
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return "-";
  try {
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function formatDateTimeSeconds(value) {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDateTimeShort(value) {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function formatMinKm({ minutes, km } = {}) {
  const hasMinutes = Number.isFinite(minutes);
  const hasKm = Number.isFinite(km);
  if (!hasMinutes && !hasKm) return "-";
  const minutesLabel = hasMinutes ? `${Math.round(minutes)}m` : "-";
  const kmLabel = hasKm ? `${Math.round(km * 10) / 10}km` : "-";
  return `${minutesLabel}/${kmLabel}`;
}

function toFiniteNumber(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getOfferFailureCleanTexts(raw) {
  const candidate =
    raw?.clean_texts_json ??
    raw?.cleanTextsJson ??
    raw?.clean_texts ??
    raw?.cleanTexts ??
    raw?.clean_texts_json_string ??
    raw?.clean_texts_json_raw ??
    null;

  const parsed = parseMaybeJson(candidate);
  if (Array.isArray(parsed)) return parsed.map((t) => String(t)).filter(Boolean);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const texts = parsed.texts ?? parsed.items ?? parsed.lines ?? null;
    if (Array.isArray(texts)) return texts.map((t) => String(t)).filter(Boolean);
  }

  const fallback = raw?.clean_texts_json?.texts;
  if (Array.isArray(fallback)) return fallback.map((t) => String(t)).filter(Boolean);

  return [];
}

function formatDuration(ms) {
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.floor(safeMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes - days * 60 * 24 - hours * 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getRemainingLabel(expiresAt, nowTs) {
  const date = expiresAt instanceof Date ? expiresAt : parseDate(expiresAt);
  if (!date) return "-";
  const diff = date.getTime() - nowTs;
  if (diff <= 0) return `Vencida hace ${formatDuration(-diff)}`;
  return formatDuration(diff);
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
      const validTabs = new Set([
        "inicio",
        "errores",
        "licencias",
        "dispositivos",
        "demos",
        "versiones",
        "diagnosticos_uber",
      ]);
      return validTabs.has(saved) ? saved : "inicio";
    } catch {
      return "inicio";
    }
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedErrorId, setSelectedErrorId] = useState("");
  const [errorModalId, setErrorModalId] = useState("");
  const [errorDescriptionHidden, setErrorDescriptionHidden] = useState(false);

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
  const [demos, setDemos] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingDemos, setLoadingDemos] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [licensesError, setLicensesError] = useState("");
  const [devicesError, setDevicesError] = useState("");
  const [demosError, setDemosError] = useState("");
  const [releasesError, setReleasesError] = useState("");
  const [licensesActionError, setLicensesActionError] = useState("");
  const [devicesActionError, setDevicesActionError] = useState("");
  const [demosActionError, setDemosActionError] = useState("");
  const [releasesActionError, setReleasesActionError] = useState("");
  const [togglingLicenseId, setTogglingLicenseId] = useState("");
  const [togglingDeviceId, setTogglingDeviceId] = useState("");
  const [deletingDeviceId, setDeletingDeviceId] = useState("");
  const [copiedDeviceId, setCopiedDeviceId] = useState("");
  const [copyDeviceError, setCopyDeviceError] = useState("");
  const copyDeviceTimeoutRef = useRef(0);
  const copyDeviceErrorTimeoutRef = useRef(0);
  const [copiedErrorDescription, setCopiedErrorDescription] = useState(false);
  const copiedErrorDescriptionTimeoutRef = useRef(0);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const [editingDemo, setEditingDemo] = useState(null);
  const [demoStartedValue, setDemoStartedValue] = useState("");
  const [demoExactValue, setDemoExactValue] = useState("");
  const [savingDemoId, setSavingDemoId] = useState("");

  const [creatingRelease, setCreatingRelease] = useState(false);
  const [activatingReleaseId, setActivatingReleaseId] = useState("");
  const [deletingReleaseId, setDeletingReleaseId] = useState("");
  const [releaseNameValue, setReleaseNameValue] = useState("");
  const [releaseCodeValue, setReleaseCodeValue] = useState("");
  const [releaseApkUrlValue, setReleaseApkUrlValue] = useState("");
  const [releaseMessageValue, setReleaseMessageValue] = useState("");
  const [releaseInfoModalOpen, setReleaseInfoModalOpen] = useState(false);
  const [createReleaseModalOpen, setCreateReleaseModalOpen] = useState(false);

  const [offerFailureDiagnostics, setOfferFailureDiagnostics] = useState([]);
  const [loadingOfferFailureDiagnostics, setLoadingOfferFailureDiagnostics] = useState(false);
  const [offerFailureDiagnosticsError, setOfferFailureDiagnosticsError] = useState("");
  const [offerFailureActionError, setOfferFailureActionError] = useState("");
  const [offerFailureModalId, setOfferFailureModalId] = useState("");
  const [reviewingOfferFailureId, setReviewingOfferFailureId] = useState("");
  const [deletingOfferFailureId, setDeletingOfferFailureId] = useState("");
  const [deletingReviewedOfferFailures, setDeletingReviewedOfferFailures] = useState(false);
  const [deletingAllOfferFailures, setDeletingAllOfferFailures] = useState(false);
  const [deleteAllOfferFailuresDone, setDeleteAllOfferFailuresDone] = useState(0);
  const [deleteAllOfferFailuresTotal, setDeleteAllOfferFailuresTotal] = useState(0);
  const [offerFailureNote, setOfferFailureNote] = useState("");
  const [copiedOfferFailureDiagnostic, setCopiedOfferFailureDiagnostic] = useState(false);
  const [copiedOfferFailureTexts, setCopiedOfferFailureTexts] = useState(false);
  const copiedOfferFailureDiagnosticTimeoutRef = useRef(0);
  const copiedOfferFailureTextsTimeoutRef = useRef(0);

  const [offerFailureFilterStatus, setOfferFailureFilterStatus] = useState("all");
  const [offerFailureFilterReason, setOfferFailureFilterReason] = useState("all");
  const [offerFailureFilterAppVersion, setOfferFailureFilterAppVersion] = useState("all");
  const [offerFailureFilterDeviceHash, setOfferFailureFilterDeviceHash] = useState("");
  const [offerFailureFilterModel, setOfferFailureFilterModel] = useState("");

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

  const fetchOfferFailureDiagnostics = async ({ signal } = {}) => {
    setLoadingOfferFailureDiagnostics(true);
    setOfferFailureDiagnosticsError("");
    try {
      const result = await getOfferFailureDiagnostics({ baseUrl: API_BASE_URL, signal });
      if (!result.ok) {
        setOfferFailureDiagnostics([]);
        setOfferFailureDiagnosticsError(`Error al cargar diagnósticos (${result.status})`);
        return;
      }
      setOfferFailureDiagnostics(Array.isArray(result.items) ? result.items : []);
      if (!Array.isArray(result.items)) {
        setOfferFailureDiagnosticsError("Error al cargar diagnósticos");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setOfferFailureDiagnostics([]);
        setOfferFailureDiagnosticsError("Error al cargar diagnósticos");
      }
    } finally {
      setLoadingOfferFailureDiagnostics(false);
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

  const fetchDemos = async ({ signal } = {}) => {
    setLoadingDemos(true);
    setDemosError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/demos`, { signal });
      if (!res.ok) {
        setDemos([]);
        setDemosError(`Error al cargar demos (${res.status})`);
        return;
      }

      const payload = await res.json();
      if (payload?.ok !== true) {
        setDemos([]);
        setDemosError("Error al cargar demos");
        return;
      }

      const data = Array.isArray(payload.data) ? payload.data : [];
      setDemos(data);
      if (!Array.isArray(payload.data)) {
        setDemosError("Error al cargar demos");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setDemos([]);
        setDemosError("Error al cargar demos");
      }
    } finally {
      setLoadingDemos(false);
    }
  };

  const fetchReleases = async ({ signal } = {}) => {
    setLoadingReleases(true);
    setReleasesError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/releases`, { signal });
      if (!res.ok) {
        setReleases([]);
        setReleasesError(`Error al cargar releases (${res.status})`);
        return;
      }

      const payload = await res.json();
      if (payload?.ok !== true) {
        setReleases([]);
        setReleasesError("Error al cargar releases");
        return;
      }

      const data = Array.isArray(payload.data) ? payload.data : [];
      setReleases(data);
      if (!Array.isArray(payload.data)) {
        setReleasesError("Error al cargar releases");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setReleases([]);
        setReleasesError("Error al cargar releases");
      }
    } finally {
      setLoadingReleases(false);
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

  const handleDeleteDevice = async (id) => {
    if (!id) {
      setDevicesActionError("No se pudo ejecutar la acción (id inválido)");
      return;
    }

    const confirmed = window.confirm("¿Eliminar dispositivo?");
    if (!confirmed) return;

    setDeletingDeviceId(id);
    setDevicesActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/devices/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setDevicesActionError(`Error al eliminar dispositivo (${res.status})`);
        return;
      }

      const payload = await res.json().catch(() => null);
      if (payload && payload?.ok !== true) {
        setDevicesActionError("Error al eliminar dispositivo");
        return;
      }

      await fetchDevices();
    } catch {
      setDevicesActionError("Error al eliminar dispositivo");
    } finally {
      setDeletingDeviceId("");
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

  const handleCopyErrorDescription = async (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (!text) return;

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

      setCopiedErrorDescription(true);
      window.clearTimeout(copiedErrorDescriptionTimeoutRef.current);
      copiedErrorDescriptionTimeoutRef.current = window.setTimeout(
        () => setCopiedErrorDescription(false),
        1200
      );
    } catch {
      setCopiedErrorDescription(false);
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

  const handleCopyOfferFailureDiagnostic = async (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (!text) return;

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

      setCopiedOfferFailureDiagnostic(true);
      window.clearTimeout(copiedOfferFailureDiagnosticTimeoutRef.current);
      copiedOfferFailureDiagnosticTimeoutRef.current = window.setTimeout(
        () => setCopiedOfferFailureDiagnostic(false),
        1200
      );
    } catch {
      setCopiedOfferFailureDiagnostic(false);
    }
  };

  const handleCopyOfferFailureTexts = async (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (!text) return;

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

      setCopiedOfferFailureTexts(true);
      window.clearTimeout(copiedOfferFailureTextsTimeoutRef.current);
      copiedOfferFailureTextsTimeoutRef.current = window.setTimeout(
        () => setCopiedOfferFailureTexts(false),
        1200
      );
    } catch {
      setCopiedOfferFailureTexts(false);
    }
  };

  const handleReviewOfferFailure = async ({ id, note } = {}) => {
    if (id === null || id === undefined || id === "") {
      setOfferFailureActionError("No se pudo ejecutar la acción (id inválido)");
      return;
    }

    const normalizedId = String(id);
    setReviewingOfferFailureId(normalizedId);
    setOfferFailureActionError("");
    try {
      const result = await reviewOfferFailureDiagnostic({
        baseUrl: API_BASE_URL,
        id: normalizedId,
        note: note ? String(note) : "",
      });
      if (!result.ok) {
        setOfferFailureActionError(`Error al marcar revisado (${result.status})`);
        return;
      }
      await fetchOfferFailureDiagnostics();
    } catch {
      setOfferFailureActionError("Error al marcar revisado");
    } finally {
      setReviewingOfferFailureId("");
    }
  };

  const handleDeleteOfferFailure = async (id) => {
    if (id === null || id === undefined || id === "") {
      setOfferFailureActionError("No se pudo ejecutar la acción (id inválido)");
      return;
    }

    const ok = window.confirm("¿Eliminar este diagnóstico? Esta acción no se puede deshacer.");
    if (!ok) return;

    const normalizedId = String(id);
    setDeletingOfferFailureId(normalizedId);
    setOfferFailureActionError("");
    try {
      const result = await deleteOfferFailureDiagnostic({ baseUrl: API_BASE_URL, id: normalizedId });
      if (!result.ok) {
        setOfferFailureActionError(`Error al eliminar (${result.status})`);
        return;
      }
      if (offerFailureModalId === normalizedId) setOfferFailureModalId("");
      await fetchOfferFailureDiagnostics();
    } catch {
      setOfferFailureActionError("Error al eliminar");
    } finally {
      setDeletingOfferFailureId("");
    }
  };

  const handleDeleteReviewedOfferFailures = async () => {
    const ok = window.confirm("¿Borrar TODOS los diagnósticos revisados? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeletingReviewedOfferFailures(true);
    setOfferFailureActionError("");
    try {
      const result = await deleteReviewedOfferFailureDiagnostics({ baseUrl: API_BASE_URL });
      if (!result.ok) {
        setOfferFailureActionError(`Error al borrar revisados (${result.status})`);
        return;
      }
      await fetchOfferFailureDiagnostics();
    } catch {
      setOfferFailureActionError("Error al borrar revisados");
    } finally {
      setDeletingReviewedOfferFailures(false);
    }
  };

  const handleDeleteAllOfferFailures = async () => {
    const ids = offerFailureRows.map((r) => r.rawId).filter((id) => !!id && id !== "-");
    if (ids.length === 0) return;

    const confirmText = window.prompt(
      "Acción irreversible.\n\nEscribí BORRAR TODO para confirmar la eliminación de TODOS los diagnósticos:"
    );
    if (confirmText !== "BORRAR TODO") return;

    const ok = window.confirm("Última confirmación: ¿seguro que querés borrar TODOS los diagnósticos?");
    if (!ok) return;

    setDeletingAllOfferFailures(true);
    setDeleteAllOfferFailuresDone(0);
    setDeleteAllOfferFailuresTotal(ids.length);
    setOfferFailureActionError("");

    try {
      for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        setDeleteAllOfferFailuresDone(i);
        const result = await deleteOfferFailureDiagnostic({ baseUrl: API_BASE_URL, id });
        if (!result.ok) {
          setOfferFailureActionError(`Error al borrar todo (${result.status})`);
          return;
        }
      }

      setDeleteAllOfferFailuresDone(ids.length);
      setOfferFailureModalId("");
      await fetchOfferFailureDiagnostics();
    } catch {
      setOfferFailureActionError("Error al borrar todo");
    } finally {
      setDeletingAllOfferFailures(false);
      setDeleteAllOfferFailuresDone(0);
      setDeleteAllOfferFailuresTotal(0);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchErrors({ signal: controller.signal });
    fetchLicenses({ signal: controller.signal });
    fetchDevices({ signal: controller.signal });
    fetchDemos({ signal: controller.signal });
    fetchReleases({ signal: controller.signal });
    fetchOfferFailureDiagnostics({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab !== "demos") return;
    setNowTs(Date.now());
    const id = window.setInterval(() => setNowTs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [tab]);

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
      const createdAtRaw = item?.created_at || "-";
      const createdAt = formatDateTimeSeconds(createdAtRaw);
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
        createdAtRaw,
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

  const errorModalError = useMemo(() => {
    if (!errorModalId) return null;
    return (
      errorRows.find((row) => row.rawId === errorModalId) ||
      errorRows.find((row) => row.id === errorModalId) ||
      null
    );
  }, [errorRows, errorModalId]);

  useEffect(() => {
    if (!errorModalId) return;
    const exists = errorRows.some((row) => row.rawId === errorModalId || row.id === errorModalId);
    if (!exists) setErrorModalId("");
  }, [errorRows, errorModalId]);

  useEffect(() => {
    if (!errorModalId) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setErrorModalId("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [errorModalId]);

  useEffect(() => {
    if (!releaseInfoModalOpen && !createReleaseModalOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setReleaseInfoModalOpen(false);
        setCreateReleaseModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [releaseInfoModalOpen, createReleaseModalOpen]);

  useEffect(() => {
    if (!offerFailureModalId) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOfferFailureModalId("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [offerFailureModalId]);

  useEffect(() => {
    if (!errorModalId) return;
    setErrorDescriptionHidden(true);
  }, [errorModalId]);

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

  const offerFailureRows = useMemo(() => {
    return offerFailureDiagnostics.map((item) => {
      const rawId =
        item?.id !== null && item?.id !== undefined
          ? String(item.id)
          : item?._id !== null && item?._id !== undefined
            ? String(item._id)
            : item?.diagnostic_id !== null && item?.diagnostic_id !== undefined
              ? String(item.diagnostic_id)
              : "";

      const createdAtRaw = item?.created_at || item?.createdAt || item?.timestamp || "-";
      const createdAt = formatDateTimeShort(createdAtRaw);
      const createdAtFull = formatDateTimeSeconds(createdAtRaw);

      const reason =
        item?.reason ||
        item?.motivo ||
        item?.failure_reason ||
        item?.error_reason ||
        item?.type ||
        item?.event_type ||
        "-";

      const deviceHash = item?.device_hash || item?.deviceHash || item?.device_id_hash || "-";
      const deviceHashShort =
        deviceHash && deviceHash !== "-" ? String(deviceHash).slice(0, 8) : "-";

      const model = item?.model || item?.device_model || item?.device_name || "-";
      const android = item?.android || item?.android_version || item?.androidVersion || "-";
      const appVersion = item?.app_version || item?.appVersion || "-";
      const uberVersion = item?.uber_version || item?.uberVersion || "-";

      const statusRaw = item?.status || "-";
      const status =
        statusRaw === "pending"
          ? "Pendiente"
          : statusRaw === "reviewed"
            ? "Revisado"
            : statusRaw === "resolved"
              ? "Resuelto"
              : statusRaw || "-";

      const price =
        item?.price ??
        item?.detected_price ??
        item?.fare ??
        item?.detectedPrice ??
        item?.offer_price ??
        "-";

      const pickupMinutes = toFiniteNumber(item?.pickup_minutes ?? item?.pickup_min ?? item?.pickupMin);
      const pickupKm = toFiniteNumber(item?.pickup_km ?? item?.pickupKm);
      const tripMinutes = toFiniteNumber(item?.trip_minutes ?? item?.trip_min ?? item?.tripMin);
      const tripKm = toFiniteNumber(item?.trip_km ?? item?.tripKm);

      const pickup = formatMinKm({ minutes: pickupMinutes, km: pickupKm });
      const trip = formatMinKm({ minutes: tripMinutes, km: tripKm });

      return {
        rawId,
        createdAtRaw,
        createdAt,
        createdAtFull,
        reason: reason || "-",
        deviceHash: deviceHash || "-",
        deviceHashShort,
        model: model || "-",
        android: android || "-",
        appVersion: appVersion || "-",
        uberVersion: uberVersion || "-",
        price: price === null || price === undefined || price === "" ? "-" : String(price),
        pickup,
        trip,
        status,
        statusRaw: statusRaw || "-",
        raw: item,
      };
    });
  }, [offerFailureDiagnostics]);

  const offerFailureReasonOptions = useMemo(() => {
    const unique = new Set();
    for (const row of offerFailureRows) {
      if (row?.reason && row.reason !== "-") unique.add(row.reason);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [offerFailureRows]);

  const offerFailureAppVersionOptions = useMemo(() => {
    const unique = new Set();
    for (const row of offerFailureRows) {
      if (row?.appVersion && row.appVersion !== "-") unique.add(row.appVersion);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [offerFailureRows]);

  useEffect(() => {
    if (offerFailureFilterReason === "all") return;
    if (offerFailureReasonOptions.includes(offerFailureFilterReason)) return;
    setOfferFailureFilterReason("all");
  }, [offerFailureReasonOptions, offerFailureFilterReason]);

  useEffect(() => {
    if (offerFailureFilterAppVersion === "all") return;
    if (offerFailureAppVersionOptions.includes(offerFailureFilterAppVersion)) return;
    setOfferFailureFilterAppVersion("all");
  }, [offerFailureAppVersionOptions, offerFailureFilterAppVersion]);

  const filteredOfferFailures = useMemo(() => {
    const deviceHashQ = offerFailureFilterDeviceHash.trim().toLowerCase();
    const modelQ = offerFailureFilterModel.trim().toLowerCase();
    return offerFailureRows.filter((row) => {
      const matchStatus =
        offerFailureFilterStatus === "all" ||
        (offerFailureFilterStatus === "pending" && row.status === "Pendiente") ||
        (offerFailureFilterStatus === "reviewed" && row.status === "Revisado");

      const matchReason = offerFailureFilterReason === "all" || row.reason === offerFailureFilterReason;
      const matchAppVersion =
        offerFailureFilterAppVersion === "all" || row.appVersion === offerFailureFilterAppVersion;

      const matchHash =
        deviceHashQ === "" || String(row.deviceHash || "").toLowerCase().includes(deviceHashQ);

      const matchModel = modelQ === "" || String(row.model || "").toLowerCase().includes(modelQ);

      return matchStatus && matchReason && matchAppVersion && matchHash && matchModel;
    });
  }, [
    offerFailureRows,
    offerFailureFilterStatus,
    offerFailureFilterReason,
    offerFailureFilterAppVersion,
    offerFailureFilterDeviceHash,
    offerFailureFilterModel,
  ]);

  const offerFailureStats = useMemo(() => {
    const total = offerFailureRows.length;
    const pending = offerFailureRows.filter((r) => r.status === "Pendiente").length;
    const reviewed = offerFailureRows.filter((r) => r.status === "Revisado").length;

    const baseRows = offerFailureRows.filter((r) => r.status === "Pendiente");
    const rowsForRanking = baseRows.length > 0 ? baseRows : offerFailureRows;

    const reasonCounts = new Map();
    const appVersionCounts = new Map();

    for (const r of rowsForRanking) {
      if (r?.reason && r.reason !== "-") {
        reasonCounts.set(r.reason, (reasonCounts.get(r.reason) || 0) + 1);
      }
      if (r?.appVersion && r.appVersion !== "-") {
        appVersionCounts.set(r.appVersion, (appVersionCounts.get(r.appVersion) || 0) + 1);
      }
    }

    const mostCommonReason =
      Array.from(reasonCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const mostProblematicAppVersion =
      Array.from(appVersionCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      total,
      pending,
      reviewed,
      mostCommonReason,
      mostProblematicAppVersion,
    };
  }, [offerFailureRows]);

  const offerFailureModalItem = useMemo(() => {
    if (!offerFailureModalId) return null;
    return offerFailureRows.find((row) => row.rawId === offerFailureModalId) || null;
  }, [offerFailureRows, offerFailureModalId]);

  useEffect(() => {
    if (!offerFailureModalId) return;
    const exists = offerFailureRows.some((row) => row.rawId === offerFailureModalId);
    if (!exists) setOfferFailureModalId("");
  }, [offerFailureRows, offerFailureModalId]);

  useEffect(() => {
    if (!offerFailureModalId) return;
    setOfferFailureActionError("");
    setOfferFailureNote("");
  }, [offerFailureModalId]);

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
      const model = item?.device_name || item?.model || "-";
      const android = item?.android_version || item?.android || "-";
      const version = item?.app_version || item?.version || "-";
      const license = item?.license_id || item?.license || "-";
      const lastSeenRaw = item?.last_seen_at || item?.lastSeen || "-";
      const lastSeen = formatDateTimeSeconds(lastSeenRaw);
      const state =
        typeof item?.is_active === "boolean"
          ? item.is_active
            ? "Activo"
            : "Inactivo"
          : "-";

      return { rawId, id, model, android, version, license, lastSeen, lastSeenRaw, state };
    });
  }, [devices]);

  const demoRows = useMemo(() => {
    return demos.map((item) => {
      const demoId = item?.id || item?.demo_id || item?.demoId || item?.demoID || "";
      const deviceId = item?.device_id || item?.deviceId || item?.device_hash || item?.deviceHash || "";
      const id = demoId || deviceId || "-";
      const deviceName =
        item?.device_name ||
        item?.deviceName ||
        item?.device_model ||
        item?.model ||
        item?.device ||
        item?.name ||
        (deviceId ? String(deviceId) : "-");
      const startedAt = item?.demo_started_at || "-";
      const expiresAt = item?.demo_expires_at || "-";
      const rawStatus =
        item?.demo_status ||
        item?.demoStatus ||
        item?.demo_state ||
        item?.demoState ||
        item?.status ||
        item?.state ||
        (typeof item?.is_active === "boolean" ? (item.is_active ? "activa" : "pausada") : "-");
      const normalized = typeof rawStatus === "string" ? rawStatus.trim().toLowerCase() : rawStatus;
      const isActive =
        item?.demo_active === true ||
        item?.demo_is_active === true ||
        item?.is_active === true ||
        normalized === "activa" ||
        normalized === "active" ||
        normalized === "enabled";
      const status =
        isActive
          ? "Activa"
          : normalized === "pausada" || normalized === "paused" || normalized === "inactive"
            ? "Pausada"
            : normalized === "expirada" || normalized === "expired"
              ? "Expirada"
              : rawStatus || "-";

      return {
        id,
        demoId: demoId ? String(demoId) : "",
        deviceId: deviceId ? String(deviceId) : "",
        deviceName,
        startedAt,
        expiresAt,
        status,
        rawStatus,
        isActive,
      };
    });
  }, [demos]);

  const releaseRows = useMemo(() => {
    return releases.map((item) => {
      const rawId = item?.id || item?.release_id || item?._id || "";
      const id = rawId || "-";
      const versionName = item?.version_name || item?.versionName || item?.version || "-";
      const versionCode = item?.version_code ?? item?.versionCode ?? item?.code ?? "-";
      const apkUrl = item?.apk_url || item?.apkUrl || item?.url || "-";
      const message = item?.message || "-";
      const createdAt = item?.created_at || item?.createdAt || "-";
      const isActive =
        typeof item?.is_active === "boolean"
          ? item.is_active
          : typeof item?.active === "boolean"
            ? item.active
            : item?.status === "active" || item?.status === "activa";

      return {
        rawId: rawId ? String(rawId) : "",
        id,
        versionName,
        versionCode,
        apkUrl,
        message,
        createdAt,
        status: isActive ? "Activa" : "Inactiva",
        isActive: !!isActive,
      };
    });
  }, [releases]);

  const activeRelease = useMemo(() => {
    const active = releaseRows.filter((row) => row.isActive);
    if (active.length === 0) return null;
    if (active.length === 1) return active[0];

    const sorted = [...active].sort((a, b) => {
      const aTs = parseDate(a.createdAt)?.getTime() ?? 0;
      const bTs = parseDate(b.createdAt)?.getTime() ?? 0;
      return bTs - aTs;
    });
    return sorted[0] || active[0] || null;
  }, [releaseRows]);

  const filteredReleaseRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return releaseRows;

    return releaseRows.filter((row) => {
      const versionName = row?.versionName ? String(row.versionName) : "";
      const versionCode = row?.versionCode === null || row?.versionCode === undefined ? "" : String(row.versionCode);
      const apkUrl = row?.apkUrl ? String(row.apkUrl) : "";
      const message = row?.message ? String(row.message) : "";
      const status = row?.status ? String(row.status) : "";
      const createdAt = row?.createdAt ? String(row.createdAt) : "";
      const createdAtLabel = formatDateTime(row?.createdAt);

      return (
        versionName.toLowerCase().includes(q) ||
        versionCode.toLowerCase().includes(q) ||
        apkUrl.toLowerCase().includes(q) ||
        message.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        createdAt.toLowerCase().includes(q) ||
        (createdAtLabel ? String(createdAtLabel).toLowerCase().includes(q) : false)
      );
    });
  }, [releaseRows, search]);

  const filteredDeviceRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deviceRows;

    return deviceRows.filter((row) => {
      const id = row?.id ? String(row.id) : "";
      const model = row?.model ? String(row.model) : "";
      const android = row?.android ? String(row.android) : "";
      const version = row?.version ? String(row.version) : "";
      const license = row?.license ? String(row.license) : "";
      const state = row?.state ? String(row.state) : "";
      const lastSeenRaw = row?.lastSeenRaw ? String(row.lastSeenRaw) : "";
      const lastSeen = row?.lastSeen ? String(row.lastSeen) : "";

      return (
        id.toLowerCase().includes(q) ||
        model.toLowerCase().includes(q) ||
        android.toLowerCase().includes(q) ||
        version.toLowerCase().includes(q) ||
        license.toLowerCase().includes(q) ||
        state.toLowerCase().includes(q) ||
        lastSeenRaw.toLowerCase().includes(q) ||
        lastSeen.toLowerCase().includes(q)
      );
    });
  }, [deviceRows, search]);

  const filteredDemoRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return demoRows;

    return demoRows.filter((row) => {
      const deviceName = row?.deviceName ? String(row.deviceName) : "";
      const status = row?.status ? String(row.status) : "";
      const startedAt = row?.startedAt ? String(row.startedAt) : "";
      const expiresAt = row?.expiresAt ? String(row.expiresAt) : "";
      const startedAtLabel = formatDateTimeSeconds(row?.startedAt);
      const expiresAtLabel = formatDateTimeSeconds(row?.expiresAt);

      return (
        deviceName.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        startedAt.toLowerCase().includes(q) ||
        expiresAt.toLowerCase().includes(q) ||
        (startedAtLabel ? String(startedAtLabel).toLowerCase().includes(q) : false) ||
        (expiresAtLabel ? String(expiresAtLabel).toLowerCase().includes(q) : false)
      );
    });
  }, [demoRows, search]);

  const filteredLicenseRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return licenseRows;

    return licenseRows.filter((row) => {
      const code = row?.code ? String(row.code) : "";
      const plan = row?.plan ? String(row.plan) : "";
      const assignedTo = row?.assignedTo ? String(row.assignedTo) : "";
      const device = row?.device ? String(row.device) : "";
      const expiresAt = row?.expiresAt ? String(row.expiresAt) : "";
      const status = row?.status ? String(row.status) : "";
      const expiresAtLabel = formatDateTimeSeconds(row?.expiresAt);

      return (
        code.toLowerCase().includes(q) ||
        plan.toLowerCase().includes(q) ||
        assignedTo.toLowerCase().includes(q) ||
        device.toLowerCase().includes(q) ||
        expiresAt.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        (expiresAtLabel ? String(expiresAtLabel).toLowerCase().includes(q) : false)
      );
    });
  }, [licenseRows, search]);

  const handleCreateRelease = async () => {
    const versionName = releaseNameValue.trim();
    const versionCodeRaw = releaseCodeValue.trim();
    const apkUrl = releaseApkUrlValue.trim();
    const message = releaseMessageValue.trim();

    if (!versionName) {
      setReleasesActionError("Ingresá version_name");
      return;
    }
    if (!versionCodeRaw) {
      setReleasesActionError("Ingresá version_code");
      return;
    }
    if (!/^[0-9]+$/.test(versionCodeRaw)) {
      setReleasesActionError("version_code debe ser numérico");
      return;
    }
    if (!apkUrl) {
      setReleasesActionError("Ingresá apk_url");
      return;
    }

    setCreatingRelease(true);
    setReleasesActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version_name: versionName,
          version_code: Number(versionCodeRaw),
          apk_url: apkUrl,
          message,
        }),
      });
      if (!res.ok) {
        setReleasesActionError(`Error al crear release (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setReleasesActionError("Error al crear release");
        return;
      }
      setReleaseNameValue("");
      setReleaseCodeValue("");
      setReleaseApkUrlValue("");
      setReleaseMessageValue("");
      await fetchReleases();
      setCreateReleaseModalOpen(false);
    } catch {
      setReleasesActionError("Error al crear release");
    } finally {
      setCreatingRelease(false);
    }
  };

  const handleActivateRelease = async (row) => {
    if (!row?.rawId) {
      setReleasesActionError("No se pudo activar (id inválido)");
      return;
    }
    if (row.isActive) return;

    setActivatingReleaseId(row.rawId);
    setReleasesActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/releases/${encodeURIComponent(row.rawId)}/activate`, {
        method: "POST",
      });
      if (!res.ok) {
        setReleasesActionError(`Error al activar release (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setReleasesActionError("Error al activar release");
        return;
      }
      await fetchReleases();
    } catch {
      setReleasesActionError("Error al activar release");
    } finally {
      setActivatingReleaseId("");
    }
  };

  const handleDeleteRelease = async (row) => {
    if (!row?.rawId) {
      setReleasesActionError("No se pudo eliminar (id inválido)");
      return;
    }

    const ok = window.confirm(`¿Eliminar release ${row.versionName} (${row.versionCode})?`);
    if (!ok) return;

    setDeletingReleaseId(row.rawId);
    setReleasesActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/releases/${encodeURIComponent(row.rawId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setReleasesActionError(`Error al eliminar release (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setReleasesActionError("Error al eliminar release");
        return;
      }
      await fetchReleases();
    } catch {
      setReleasesActionError("Error al eliminar release");
    } finally {
      setDeletingReleaseId("");
    }
  };

  const dashboardStats = useMemo(() => {
    const devicesActive = deviceRows.filter((d) => d.state === "Activo").length;
    const demosActive = demoRows.filter((d) => d.isActive).length;
    return {
      devicesActive,
      demosActive,
      currentVersionName: activeRelease?.versionName || "-",
      currentVersionCode: activeRelease?.versionCode ?? "-",
    };
  }, [activeRelease, deviceRows, demoRows]);

  const handleOpenEditDemo = (row) => {
    setDemosActionError("");
    setEditingDemo(row);

    const pad = (n) => String(n).padStart(2, "0");
    const started = parseDate(row?.startedAt);
    const expires = parseDate(row?.expiresAt);

    if (started) {
      setDemoStartedValue(
        `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())}T${pad(
          started.getHours()
        )}:${pad(started.getMinutes())}:${pad(started.getSeconds())}`
      );
    } else {
      setDemoStartedValue("");
    }

    if (expires) {
      setDemoExactValue(
        `${expires.getFullYear()}-${pad(expires.getMonth() + 1)}-${pad(expires.getDate())}T${pad(
          expires.getHours()
        )}:${pad(expires.getMinutes())}:${pad(expires.getSeconds())}`
      );
    } else {
      setDemoExactValue("");
    }
  };

  const handleCloseEditDemo = () => {
    if (savingDemoId) return;
    setEditingDemo(null);
  };

  const handleUpdateDemoExpiresAt = async () => {
    const demoId = editingDemo?.demoId || editingDemo?.id || "";
    if (!demoId || demoId === "-") return;
    if (!demoStartedValue) {
      setDemosActionError("Ingresá una fecha/hora de inicio");
      return;
    }
    if (!demoExactValue) {
      setDemosActionError("Ingresá una fecha/hora de vencimiento");
      return;
    }

    const startedAt = parseDate(demoStartedValue) || new Date(demoStartedValue);
    if (Number.isNaN(startedAt.getTime())) {
      setDemosActionError("Fecha/hora de inicio inválida");
      return;
    }

    const expiresAt = parseDate(demoExactValue) || new Date(demoExactValue);
    if (Number.isNaN(expiresAt.getTime())) {
      setDemosActionError("Fecha/hora inválida");
      return;
    }

    setSavingDemoId(demoId);
    setDemosActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/demos/${encodeURIComponent(demoId)}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demo_started_at: startedAt.toISOString(),
          demo_expires_at: expiresAt.toISOString(),
        }),
      });
      if (!res.ok) {
        setDemosActionError(`Error al actualizar demo (${res.status})`);
        return;
      }
      const payload = await res.json().catch(() => null);
      if (payload?.ok !== true) {
        setDemosActionError("Error al actualizar demo");
        return;
      }
      await fetchDemos();
      setEditingDemo(null);
    } catch {
      setDemosActionError("Error al actualizar demo");
    } finally {
      setSavingDemoId("");
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <img className="brand-logo" src="/logo.png" alt="Viaje Rentable" />
        <h1>Panel operativo</h1>
        <p className="sidebar-text">
          Control de errores, licencias, dispositivos, demos y actualizaciones.
        </p>

        <nav className="sidebar-nav">
          <button
            className={tab === "inicio" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("inicio")}
          >
            <LayoutDashboard size={16} />
            <span className="nav-label">Inicio</span>
          </button>
          <button
            className={tab === "dispositivos" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("dispositivos")}
          >
            <Smartphone size={16} />
            <span className="nav-label">Dispositivos</span>
          </button>
          <button
            className={tab === "licencias" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("licencias")}
          >
            <KeyRound size={16} />
            <span className="nav-label">Licencias</span>
          </button>
          <button
            className={tab === "demos" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("demos")}
          >
            <Timer size={16} />
            <span className="nav-label">Demos</span>
          </button>
          <button
            className={tab === "errores" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("errores")}
          >
            <AlertTriangle size={16} />
            <span className="nav-label">Errores</span>
          </button>
          <button
            className={tab === "diagnosticos_uber" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("diagnosticos_uber")}
          >
            <Stethoscope size={16} />
            <span className="nav-label">Diagnósticos Uber</span>
          </button>
          <button
            className={tab === "versiones" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("versiones")}
          >
            <Download size={16} />
            <span className="nav-label">Actualizaciones</span>
          </button>
        </nav>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1 className="main-title">Viaje Rentable Admin</h1>
          </div>

          {tab !== "errores" && tab !== "inicio" && tab !== "diagnosticos_uber" && (
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
                title="Dispositivos activos"
                value={String(dashboardStats.devicesActive)}
                hint="Estado activo"
                icon={Smartphone}
              />
              <MetricCard
                title="Demos activas"
                value={String(dashboardStats.demosActive)}
                hint="En curso"
                icon={Timer}
              />
              <MetricCard
                title="Versión actual"
                value={dashboardStats.currentVersionName}
                hint={`version_code: ${dashboardStats.currentVersionCode}`}
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
              .errors-compact .errors-metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-top: 10px; }
              .errors-compact .metric-card { padding: 12px; border-radius: 16px; }
              .errors-compact .metric-card h3 { font-size: 18px; margin: 6px 0 0; }
              .errors-compact .metric-card .hint { margin-top: 6px; font-size: 11.5px; }
              .errors-compact .metric-card .icon-box { padding: 10px; border-radius: 14px; }
              .errors-compact .errors-top-list { margin: 6px 0 0; padding-left: 0; list-style-position: inside; }
              .errors-compact .errors-top-list li { margin: 2px 0; font-size: 12px; line-height: 1.2; display: grid; grid-template-columns: 1fr auto; gap: 6px; }
              .errors-compact .errors-top-list li .mono { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .errors-compact .errors-top-list li .muted { white-space: nowrap; }
              .errors-compact .top-errors-card { align-items: flex-start; }
              .errors-compact .top-errors-card > div:first-child { min-width: 0; }
              .errors-compact .top-errors-card .icon-box { align-self: flex-start; padding: 8px; border-radius: 12px; }
              .errors-compact .errors-row { cursor: pointer; }
              .errors-compact .errors-row.is-selected td { background: rgba(37, 99, 235, 0.10); }
              .errors-compact .detail-row { display: flex; align-items: center; justify-content: flex-start; gap: 10px; margin-bottom: 6px; }
              .errors-compact .detail-row .detail-label { margin: 0; }
              .errors-compact .desc-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
              .errors-compact .desc-toggle { padding: 6px 10px; line-height: 1; }
              .errors-compact .error-description { max-height: min(55vh, 520px); overflow: auto; white-space: pre-wrap; padding: 10px; font-size: 12.25px; line-height: 1.3; }
              .errors-compact .modal { width: min(640px, calc(100vw - 56px)); }
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

              <div className="errors-metrics-grid">
                <MetricCard
                  title="Total"
                  value={String(errorStats.total)}
                  hint="Reportes"
                  icon={AlertTriangle}
                />
                <MetricCard
                  title="Pendientes"
                  value={String(errorStats.pending)}
                  hint="Sin revisar"
                  icon={AlertCircle}
                />
                <MetricCard
                  title="Revisados"
                  value={String(errorStats.reviewed)}
                  hint="Marcados"
                  icon={Eye}
                />
                <MetricCard
                  title="Más frecuente"
                  value={errorStats.mostFrequentType}
                  hint={`${errorStats.mostFrequentTypeCount} reportes`}
                  icon={TrendingUp}
                />
                <div className="card metric-card top-errors-card">
                  <div>
                    <p className="muted">Top 3 errores</p>
                    {errorStats.topTypes.length === 0 ? (
                      <h3>-</h3>
                    ) : (
                      <ol className="errors-top-list">
                        {errorStats.topTypes.map((item) => (
                          <li key={item.type}>
                            <span className="mono">{item.type}</span>{" "}
                            <span className="muted">({item.count})</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                  <div className="icon-box">
                    <ListOrdered size={20} />
                  </div>
                </div>
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
                          <th>Screen</th>
                          <th>Versión</th>
                          <th>Dispositivo</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredErrors.map((item, index) => {
                          const rowId = item.rawId ? String(item.rawId) : String(item.id);
                          return (
                          <tr
                            key={`${item.id}-${index}`}
                            className={
                              (selectedErrorId && (selectedErrorId === rowId || selectedErrorId === String(item.id)))
                                ? "errors-row is-selected"
                                : "errors-row"
                            }
                            onClick={() => {
                              setSelectedErrorId(rowId);
                              setErrorModalId(rowId);
                            }}
                          >
                            <td>{item.type}</td>
                            <td>{item.screen}</td>
                            <td>{item.appVersion}</td>
                            <td>{item.deviceName}</td>
                            <td>
                              <span className={getBadgeClass(item.status)}>{item.status}</span>
                            </td>
                            <td title={item.createdAtRaw ? String(item.createdAtRaw) : ""}>{item.createdAt}</td>
                            <td>
                              <button
                                className="ghost-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedErrorId(rowId);
                                  setErrorModalId(rowId);
                                }}
                              >
                                <Eye size={14} /> Ver
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
            </div>

            {errorModalId && errorModalError && (
              <div
                className="modal-backdrop"
                role="dialog"
                aria-modal="true"
                onClick={() => setErrorModalId("")}
              >
                <div className="modal" onClick={(event) => event.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h3>{errorModalError.type}</h3>
                    </div>
                    <span className={getBadgeClass(errorModalError.status)}>{errorModalError.status}</span>
                  </div>

                  <div className="modal-body">
                    <div className="detail-grid" style={{ marginTop: 0 }}>
                      <div className="detail-box">
                        <span>Dispositivo</span>
                        <strong>{errorModalError.deviceName}</strong>
                      </div>
                      <div className="detail-box">
                        <span>Versión</span>
                        <strong>{errorModalError.appVersion}</strong>
                      </div>
                      <div className="detail-box">
                        <span>Pantalla</span>
                        <strong>{errorModalError.screen}</strong>
                      </div>
                      <div className="detail-box">
                        <span>Fecha</span>
                        <strong>{errorModalError.createdAt}</strong>
                      </div>
                    </div>

                    <div className="detail-section">
                      <div className="detail-row desc-actions">
                        <p className="detail-label">Descripción</p>
                        <button
                          type="button"
                          className="ghost-btn icon-btn desc-toggle"
                          title={errorDescriptionHidden ? "Mostrar descripción" : "Ocultar descripción"}
                          onClick={() => {
                            setErrorDescriptionHidden((prev) => {
                              const next = !prev;
                              return next;
                            });
                          }}
                        >
                          {errorDescriptionHidden ? "+" : "-"}
                        </button>
                        <button
                          type="button"
                          className="ghost-btn icon-btn"
                          title="Copiar descripción"
                          onClick={() => handleCopyErrorDescription(errorModalError.description)}
                        >
                          <Copy size={14} /> Copiar
                        </button>
                        {copiedErrorDescription && <span className="muted">Copiado</span>}
                      </div>
                      {!errorDescriptionHidden && (
                        <div className="detail-content error-description">{errorModalError.description}</div>
                      )}
                    </div>

                    <div className="detail-section">
                      <p className="detail-label">Detalles</p>
                      <div className="table-wrap">
                        <table>
                          <tbody>
                            <tr>
                              <td className="muted">Android</td>
                              <td>{errorModalError.androidVersion}</td>
                            </tr>
                            <tr>
                              <td className="muted">Device hash</td>
                              <td>{errorModalError.deviceHash}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {!!reviewErrorActionError && <p className="muted">{reviewErrorActionError}</p>}
                    {!!deleteErrorActionError && <p className="muted">{deleteErrorActionError}</p>}
                  </div>

                  <div className="modal-actions">
                    <button
                      className="secondary-btn"
                      type="button"
                      onClick={() => setErrorModalId("")}
                    >
                      Cerrar
                    </button>
                    <button
                      className="primary-btn"
                      disabled={
                        errorModalError.status !== "Pendiente" ||
                        !errorModalError.rawId ||
                        reviewingErrorId === errorModalError.rawId ||
                        loadingErrors
                      }
                      onClick={() => handleReviewError(errorModalError.rawId)}
                    >
                      {errorModalError.status === "Revisado"
                        ? "Ya revisado"
                        : reviewingErrorId === errorModalError.rawId
                          ? "Procesando..."
                          : "Marcar revisado"}
                    </button>
                    <button
                      className="secondary-btn danger-btn"
                      disabled={
                        !errorModalError.rawId ||
                        deletingErrorId === errorModalError.rawId ||
                        deletingReviewed ||
                        deletingAll ||
                        loadingErrors
                      }
                      onClick={() => handleDeleteError(errorModalError.rawId)}
                    >
                      {deletingErrorId === errorModalError.rawId ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </>
        )}

        {tab === "diagnosticos_uber" && (
          <>
            <style>{`
              .diagnostics-compact .card { padding: 14px; }
              .diagnostics-compact .section-title { margin-bottom: 10px; }
              .diagnostics-compact .section-title h2 { font-size: 18px; }
              .diagnostics-compact .section-title p { margin-top: 4px; font-size: 12px; }
              .diagnostics-compact table { font-size: 12.25px; }
              .diagnostics-compact th, .diagnostics-compact td { padding: 7px 8px; }
              .diagnostics-compact select, .diagnostics-compact input {
                padding: 8px 10px;
                border-radius: 12px;
                border: 1px solid var(--border);
                font-size: 13px;
                background: var(--card);
                color: var(--text);
                outline: none;
              }
              .diagnostics-compact .primary-btn,
              .diagnostics-compact .secondary-btn,
              .diagnostics-compact .ghost-btn {
                padding: 8px 12px;
                border-radius: 12px;
                font-size: 13px;
              }
              .diagnostics-compact .danger-btn {
                background: var(--danger);
                color: #fff;
                border: 1px solid var(--danger);
              }
              .diagnostics-compact .danger-btn:hover {
                background: var(--danger-hover);
                border-color: var(--danger-hover);
              }
              .diagnostics-compact .danger-btn:disabled { opacity: 0.6; cursor: not-allowed; }
              .diagnostics-compact .diagnostics-metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
                gap: 10px;
                margin-bottom: 12px;
              }
              .diagnostics-compact .metric-card { padding: 12px; border-radius: 16px; }
              .diagnostics-compact .metric-card h3 { font-size: 18px; margin: 6px 0 0; }
              .diagnostics-compact .metric-card .hint { margin-top: 6px; font-size: 11.5px; }
              .diagnostics-compact .metric-card .icon-box { padding: 10px; border-radius: 14px; }
              .diagnostics-compact .diagnostics-toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: flex-end;
                justify-content: space-between;
                margin-bottom: 10px;
              }
              .diagnostics-compact .diagnostics-filters {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 10px;
                flex: 1;
                min-width: 260px;
              }
              .diagnostics-compact .filter-field { display: grid; gap: 6px; }
              .diagnostics-compact .filter-field .muted { font-size: 11.5px; }
              .diagnostics-compact .diagnostics-actions { display: flex; gap: 10px; flex-wrap: wrap; }
              .diagnostics-compact .chip {
                display: inline-flex;
                align-items: center;
                padding: 4px 8px;
                border-radius: 999px;
                font-size: 11px;
                border: 1px solid rgba(148, 163, 184, 0.18);
                background: rgba(2, 6, 23, 0.22);
                color: rgba(226, 232, 240, 0.92);
              }
              .diagnostics-compact .diagnostics-row { cursor: pointer; }
              .diagnostics-compact .truncate-cell {
                display: inline-block;
                max-width: 180px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                vertical-align: bottom;
              }
              .diagnostics-compact .note-input {
                width: 100%;
                resize: vertical;
                min-height: 90px;
                padding: 10px;
                border-radius: 14px;
                border: 1px solid rgba(148, 163, 184, 0.14);
                background: rgba(2, 6, 23, 0.18);
                color: var(--text);
                font-family: var(--sans);
                font-size: 12.5px;
                line-height: 1.3;
              }
              .diagnostics-compact .texts-list { margin: 0; padding-left: 18px; display: grid; gap: 6px; }
              .diagnostics-compact .texts-list li {
                font-size: 12.25px;
                line-height: 1.25;
                word-break: break-word;
              }
              .diagnostics-compact .actions-inline {
                display: inline-flex;
                gap: 8px;
                align-items: center;
                flex-wrap: wrap;
              }
            `}</style>

            <div className="diagnostics-compact">
              <SectionTitle
                title="Diagnósticos Uber"
                subtitle="Fallos reales de detección de ofertas para revisar rápido y encontrar patrones."
              />

              <div className="diagnostics-metrics-grid">
                <MetricCard
                  title="Pendientes"
                  value={String(offerFailureStats.pending)}
                  hint="Para revisar"
                  icon={AlertTriangle}
                />
                <MetricCard
                  title="Revisados"
                  value={String(offerFailureStats.reviewed)}
                  hint="Ya clasificados"
                  icon={CheckCircle2}
                />
                <MetricCard
                  title="Motivo más común"
                  value={offerFailureStats.mostCommonReason}
                  hint="Ranking prioriza pendientes"
                  icon={HelpCircle}
                />
                <MetricCard
                  title="App más problemática"
                  value={offerFailureStats.mostProblematicAppVersion}
                  hint="Ranking prioriza pendientes"
                  icon={Bot}
                />
              </div>

              <div className="card">
                <div className="diagnostics-toolbar">
                  <div className="diagnostics-filters">
                    <label className="filter-field">
                      <span className="muted">Estado</span>
                      <select
                        value={offerFailureFilterStatus}
                        onChange={(e) => setOfferFailureFilterStatus(e.target.value)}
                      >
                        <option value="all">Todos</option>
                        <option value="pending">Pendientes</option>
                        <option value="reviewed">Revisados</option>
                      </select>
                    </label>

                    <label className="filter-field">
                      <span className="muted">Motivo</span>
                      <select
                        value={offerFailureFilterReason}
                        onChange={(e) => setOfferFailureFilterReason(e.target.value)}
                      >
                        <option value="all">Todos</option>
                        {offerFailureReasonOptions.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="filter-field">
                      <span className="muted">App versión</span>
                      <select
                        value={offerFailureFilterAppVersion}
                        onChange={(e) => setOfferFailureFilterAppVersion(e.target.value)}
                      >
                        <option value="all">Todas</option>
                        {offerFailureAppVersionOptions.map((version) => (
                          <option key={version} value={version}>
                            {version}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="filter-field">
                      <span className="muted">Device hash</span>
                      <input
                        value={offerFailureFilterDeviceHash}
                        onChange={(e) => setOfferFailureFilterDeviceHash(e.target.value)}
                        placeholder="buscar…"
                      />
                    </label>

                    <label className="filter-field">
                      <span className="muted">Modelo</span>
                      <input
                        value={offerFailureFilterModel}
                        onChange={(e) => setOfferFailureFilterModel(e.target.value)}
                        placeholder="buscar…"
                      />
                    </label>
                  </div>

                  <div className="diagnostics-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      disabled={loadingOfferFailureDiagnostics}
                      onClick={() => {
                        setOfferFailureFilterStatus("all");
                        setOfferFailureFilterReason("all");
                        setOfferFailureFilterAppVersion("all");
                        setOfferFailureFilterDeviceHash("");
                        setOfferFailureFilterModel("");
                      }}
                    >
                      Limpiar filtros
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      disabled={loadingOfferFailureDiagnostics}
                      onClick={() => fetchOfferFailureDiagnostics()}
                    >
                      Recargar
                    </button>
                    <button
                      type="button"
                      className="primary-btn danger-btn"
                      disabled={
                        deletingReviewedOfferFailures ||
                        deletingAllOfferFailures ||
                        loadingOfferFailureDiagnostics ||
                        offerFailureStats.reviewed === 0
                      }
                      onClick={handleDeleteReviewedOfferFailures}
                    >
                      {deletingReviewedOfferFailures
                        ? "Borrando revisados..."
                        : `Borrar revisados (${offerFailureStats.reviewed})`}
                    </button>
                    <button
                      type="button"
                      className="primary-btn danger-btn"
                      disabled={
                        deletingReviewedOfferFailures ||
                        deletingAllOfferFailures ||
                        loadingOfferFailureDiagnostics ||
                        offerFailureRows.length === 0
                      }
                      onClick={handleDeleteAllOfferFailures}
                      title="Elimina todos los diagnósticos (irreversible)"
                    >
                      {deletingAllOfferFailures
                        ? `Borrando todo... (${deleteAllOfferFailuresDone}/${deleteAllOfferFailuresTotal})`
                        : `Borrar todo (${offerFailureRows.length})`}
                    </button>
                  </div>
                </div>

                {!!offerFailureActionError && <p className="muted">{offerFailureActionError}</p>}

                {loadingOfferFailureDiagnostics ? (
                  <p className="muted">Cargando diagnósticos...</p>
                ) : offerFailureDiagnosticsError ? (
                  <p className="muted">{offerFailureDiagnosticsError}</p>
                ) : filteredOfferFailures.length === 0 ? (
                  <p className="muted">
                    {offerFailureRows.length === 0
                      ? "No hay diagnósticos"
                      : "Sin resultados con esos filtros"}
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table className="diagnostics-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Motivo</th>
                          <th>Hash</th>
                          <th>Modelo</th>
                          <th>Android</th>
                          <th>App</th>
                          <th>Uber</th>
                          <th>Precio</th>
                          <th>Pickup</th>
                          <th>Viaje</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOfferFailures.map((row, index) => {
                          const idKey = row.rawId
                            ? row.rawId
                            : `${row.deviceHash}-${row.createdAtRaw}-${index}`;
                          const canAct = !!row.rawId && row.rawId !== "-";

                          return (
                            <tr
                              key={idKey}
                              className="diagnostics-row"
                              onClick={() => {
                                if (!canAct) return;
                                setOfferFailureModalId(row.rawId);
                              }}
                            >
                              <td className="mono">{row.createdAt}</td>
                              <td>
                                <span className="chip" title={row.reason}>
                                  {row.reason}
                                </span>
                              </td>
                              <td className="mono">{row.deviceHashShort}</td>
                              <td>
                                <span className="truncate-cell" title={row.model}>
                                  {row.model}
                                </span>
                              </td>
                              <td className="mono">{row.android}</td>
                              <td className="mono">{row.appVersion}</td>
                              <td className="mono">{row.uberVersion}</td>
                              <td className="mono">{row.price}</td>
                              <td className="mono">{row.pickup}</td>
                              <td className="mono">{row.trip}</td>
                              <td>
                                <span className={getBadgeClass(row.status)}>{row.status}</span>
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button
                                    type="button"
                                    className="ghost-btn icon-btn"
                                    title="Ver detalle"
                                    disabled={!canAct}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (!canAct) return;
                                      setOfferFailureModalId(row.rawId);
                                    }}
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost-btn icon-btn"
                                    title="Marcar revisado"
                                    disabled={
                                      !canAct ||
                                      row.status === "Revisado" ||
                                      reviewingOfferFailureId === row.rawId ||
                                      loadingOfferFailureDiagnostics
                                    }
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (!canAct) return;
                                      handleReviewOfferFailure({ id: row.rawId, note: "" });
                                    }}
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost-btn icon-btn danger-btn"
                                    title="Eliminar"
                                    disabled={
                                      !canAct ||
                                      deletingOfferFailureId === row.rawId ||
                                      loadingOfferFailureDiagnostics
                                    }
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (!canAct) return;
                                      handleDeleteOfferFailure(row.rawId);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {offerFailureModalId && offerFailureModalItem && (
                <div
                  className="modal-backdrop"
                  role="dialog"
                  aria-modal="true"
                  onClick={() => setOfferFailureModalId("")}
                >
                  <div className="modal" onClick={(event) => event.stopPropagation()}>
                    <div className="modal-header">
                      <div>
                        <h3>Diagnóstico Uber</h3>
                      </div>
                      <span className={getBadgeClass(offerFailureModalItem.status)}>
                        {offerFailureModalItem.status}
                      </span>
                    </div>

                    <div className="modal-body">
                      {(() => {
                        const raw = offerFailureModalItem.raw || {};
                        const cleanTexts = getOfferFailureCleanTexts(raw);

                        const resolution =
                          raw?.resolution ?? raw?.screen_resolution ?? raw?.res ?? "-";
                        const density = raw?.density ?? raw?.dpi ?? "-";
                        const locale = raw?.locale ?? raw?.lang ?? "-";
                        const eventType =
                          raw?.event_type ?? raw?.eventType ?? raw?.event ?? raw?.type ?? "-";
                        const className = raw?.class_name ?? raw?.className ?? "-";
                        const detectedPrice =
                          raw?.detected_price ?? raw?.detectedPrice ?? raw?.price ?? raw?.fare ?? "-";

                        const pickupMinutes = toFiniteNumber(
                          raw?.pickup_minutes ?? raw?.pickup_min ?? raw?.pickupMin
                        );
                        const pickupKm = toFiniteNumber(raw?.pickup_km ?? raw?.pickupKm);
                        const tripMinutes = toFiniteNumber(
                          raw?.trip_minutes ?? raw?.trip_min ?? raw?.tripMin
                        );
                        const tripKm = toFiniteNumber(raw?.trip_km ?? raw?.tripKm);

                        const rawTextCount =
                          raw?.raw_text_count ??
                          raw?.rawTextCount ??
                          (Array.isArray(raw?.raw_texts) ? raw.raw_texts.length : "-");
                        const cleanTextCount =
                          raw?.clean_text_count ??
                          raw?.cleanTextCount ??
                          (Array.isArray(cleanTexts) ? cleanTexts.length : "-");

                        const parseSourceCandidate =
                          raw?.parse_source_info ??
                          raw?.parseSourceInfo ??
                          raw?.parse_source ??
                          raw?.parseSource ??
                          null;
                        const parseSource = parseMaybeJson(parseSourceCandidate);
                        const parseSourceEntries =
                          parseSource && typeof parseSource === "object" && !Array.isArray(parseSource)
                            ? Object.entries(parseSource)
                            : [];
                        const parseSourceText = typeof parseSource === "string" ? parseSource : "";

                        return (
                          <>
                            <div className="detail-grid" style={{ marginTop: 0 }}>
                              <div className="detail-box">
                                <span>Fecha</span>
                                <strong>{offerFailureModalItem.createdAtFull}</strong>
                              </div>
                              <div className="detail-box">
                                <span>Motivo</span>
                                <strong>{offerFailureModalItem.reason}</strong>
                              </div>
                              <div className="detail-box">
                                <span>App / Uber</span>
                                <strong>
                                  {offerFailureModalItem.appVersion} / {offerFailureModalItem.uberVersion}
                                </strong>
                              </div>
                              <div className="detail-box">
                                <span>Device hash</span>
                                <strong className="mono">{offerFailureModalItem.deviceHash}</strong>
                              </div>
                            </div>

                            <div className="detail-section">
                              <p className="detail-label">Dispositivo</p>
                              <div className="table-wrap">
                                <table>
                                  <tbody>
                                    <tr>
                                      <td className="muted">Modelo</td>
                                      <td>{offerFailureModalItem.model}</td>
                                    </tr>
                                    <tr>
                                      <td className="muted">Android</td>
                                      <td>{offerFailureModalItem.android}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="detail-section">
                              <p className="detail-label">Contexto</p>
                              <div className="table-wrap">
                                <table>
                                  <tbody>
                                    <tr>
                                      <td className="muted">Resolution</td>
                                      <td className="mono">{String(resolution)}</td>
                                    </tr>
                                    <tr>
                                      <td className="muted">Density</td>
                                      <td className="mono">{String(density)}</td>
                                    </tr>
                                    <tr>
                                      <td className="muted">Locale</td>
                                      <td className="mono">{String(locale)}</td>
                                    </tr>
                                    <tr>
                                      <td className="muted">Event type</td>
                                      <td className="mono">{String(eventType)}</td>
                                    </tr>
                                    <tr>
                                      <td className="muted">Class name</td>
                                      <td className="mono">{String(className)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="detail-section">
                              <p className="detail-label">Oferta detectada</p>
                              <div className="table-wrap">
                                <table>
                                  <tbody>
                                    <tr>
                                      <td className="muted">Precio</td>
                                      <td className="mono">{String(detectedPrice)}</td>
                                    </tr>
                                    <tr>
                                      <td className="muted">Pickup min/km</td>
                                      <td className="mono">
                                        {formatMinKm({ minutes: pickupMinutes, km: pickupKm })}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="muted">Viaje min/km</td>
                                      <td className="mono">
                                        {formatMinKm({ minutes: tripMinutes, km: tripKm })}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="detail-section">
                              <p className="detail-label">Parse source info</p>
                              <div className="table-wrap">
                                <table>
                                  <tbody>
                                    {parseSourceText ? (
                                      <tr>
                                        <td colSpan={2} className="mono">
                                          {parseSourceText}
                                        </td>
                                      </tr>
                                    ) : parseSourceEntries.length === 0 ? (
                                      <tr>
                                        <td colSpan={2} className="muted">
                                          -
                                        </td>
                                      </tr>
                                    ) : (
                                      parseSourceEntries.map(([k, v]) => (
                                        <tr key={k}>
                                          <td className="muted">{k}</td>
                                          <td className="mono">
                                            {typeof v === "string" ? v : JSON.stringify(v)}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="detail-section">
                              <div
                                className="actions-inline"
                                style={{ justifyContent: "space-between" }}
                              >
                                <p className="detail-label" style={{ margin: 0 }}>
                                  Textos limpios
                                </p>
                                <span className="muted">
                                  raw: {String(rawTextCount)} · clean: {String(cleanTextCount)}
                                </span>
                              </div>
                              {cleanTexts.length === 0 ? (
                                <p className="muted">Sin textos</p>
                              ) : (
                                <ul className="texts-list">
                                  {cleanTexts.slice(0, 120).map((t, idx) => (
                                    <li key={`${idx}-${t.slice(0, 24)}`}>{t}</li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div className="detail-section">
                              <p className="detail-label">Nota (opcional)</p>
                              <textarea
                                className="note-input"
                                value={offerFailureNote}
                                onChange={(e) => setOfferFailureNote(e.target.value)}
                                placeholder="Ej: se rompe en ES-AR con Uber 4.5.x, densidad alta…"
                              />
                            </div>

                            <div className="detail-section">
                              <div className="actions-inline">
                                <button
                                  type="button"
                                  className="ghost-btn icon-btn"
                                  onClick={() =>
                                    handleCopyOfferFailureDiagnostic(JSON.stringify(raw, null, 2))
                                  }
                                >
                                  <ClipboardCopy size={14} /> Copiar diagnóstico
                                </button>
                                {copiedOfferFailureDiagnostic && <span className="muted">Copiado</span>}

                                <button
                                  type="button"
                                  className="ghost-btn icon-btn"
                                  onClick={() => handleCopyOfferFailureTexts(cleanTexts.join("\n"))}
                                >
                                  <Copy size={14} /> Copiar textos
                                </button>
                                {copiedOfferFailureTexts && <span className="muted">Copiado</span>}
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {!!offerFailureActionError && <p className="muted">{offerFailureActionError}</p>}
                    </div>

                    <div className="modal-actions">
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => setOfferFailureModalId("")}
                      >
                        Cerrar
                      </button>
                      <button
                        className="primary-btn"
                        disabled={
                          !offerFailureModalItem.rawId ||
                          offerFailureModalItem.status === "Revisado" ||
                          reviewingOfferFailureId === offerFailureModalItem.rawId ||
                          loadingOfferFailureDiagnostics
                        }
                        onClick={() =>
                          handleReviewOfferFailure({
                            id: offerFailureModalItem.rawId,
                            note: offerFailureNote,
                          })
                        }
                      >
                        {offerFailureModalItem.status === "Revisado"
                          ? "Ya revisado"
                          : reviewingOfferFailureId === offerFailureModalItem.rawId
                            ? "Procesando..."
                            : "Marcar revisado"}
                      </button>
                      <button
                        className="secondary-btn danger-btn"
                        disabled={
                          !offerFailureModalItem.rawId ||
                          deletingOfferFailureId === offerFailureModalItem.rawId ||
                          loadingOfferFailureDiagnostics
                        }
                        onClick={() => handleDeleteOfferFailure(offerFailureModalItem.rawId)}
                      >
                        {deletingOfferFailureId === offerFailureModalItem.rawId
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "licencias" && (
          <>
            <SectionTitle
              title="Licencias"
              subtitle="Sección en pausa: licencias no se usan por ahora."
            />
            <div className="card">
              {!!licensesActionError && <p className="muted">{licensesActionError}</p>}
              {loadingLicenses ? (
                <p className="muted">Cargando licencias...</p>
              ) : licensesError ? (
                <p className="muted">{licensesError}</p>
              ) : filteredLicenseRows.length === 0 ? (
                <p className="muted">{licenseRows.length === 0 ? "No hay licencias" : "Sin resultados"}</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Plan</th>
                        <th>Asignado</th>
                        <th>Dispositivo</th>
                        <th>Vence</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLicenseRows.map((row) => (
                        <tr key={row.rawId ? row.rawId : `${row.code}-${row.expiresAt}`}>
                          <td className="mono">{row.code}</td>
                          <td>{row.plan}</td>
                          <td>{row.assignedTo}</td>
                          <td className="mono">{row.device}</td>
                          <td>{formatDateTimeSeconds(row.expiresAt)}</td>
                          <td>
                            <span className={getBadgeClass(row.status)}>{row.status}</span>
                          </td>
                        </tr>
                      ))}
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
            <div className="card devices-card">
              {!!devicesActionError && <p className="muted">{devicesActionError}</p>}
              {!!copyDeviceError && <p className="muted">{copyDeviceError}</p>}
              {loadingDevices ? (
                <p className="muted">Cargando dispositivos...</p>
              ) : devicesError ? (
                <p className="muted">{devicesError}</p>
              ) : filteredDeviceRows.length === 0 ? (
                <p className="muted">{deviceRows.length === 0 ? "No hay dispositivos" : "Sin resultados"}</p>
              ) : (
                <div className="table-wrap">
                  <table className="devices-table">
                    <thead>
                      <tr>
                        <th>Device ID</th>
                        <th>Dispositivo</th>
                        <th>Android</th>
                        <th>Versión</th>
                        <th>Licencia</th>
                        <th>Última conexión</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeviceRows.map((item, index) => {
                        const canToggle = item.state === "Activo" || item.state === "Inactivo";
                        const nextLabel =
                          item.state === "Activo"
                            ? "Bloquear"
                            : item.state === "Inactivo"
                              ? "Liberar"
                              : "-";
                        const isToggling = !!item.rawId && togglingDeviceId === item.rawId;
                        const isDeleting = !!item.rawId && deletingDeviceId === item.rawId;

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
                            <td>{item.model}</td>
                            <td>{item.android}</td>
                            <td>{item.version}</td>
                            <td>{item.license}</td>
                            <td title={item.lastSeenRaw ? String(item.lastSeenRaw) : ""}>{item.lastSeen}</td>
                            <td>
                              <span className={getBadgeClass(item.state)}>{item.state}</span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  className="ghost-btn"
                                  disabled={!canToggle || !item.rawId || isToggling || isDeleting || loadingDevices}
                                  onClick={() => handleToggleDevice(item.rawId)}
                                >
                                  {isToggling ? "Procesando..." : nextLabel}
                                </button>
                                <button
                                  type="button"
                                  className="ghost-btn icon-btn danger-btn"
                                  title="Eliminar"
                                  disabled={!item.rawId || isToggling || isDeleting || loadingDevices}
                                  onClick={() => handleDeleteDevice(item.rawId)}
                                >
                                  {isDeleting ? "…" : "❌"}
                                </button>
                              </div>
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
              {!!demosActionError && <p className="muted">{demosActionError}</p>}
              {loadingDemos ? (
                <p className="muted">Cargando demos...</p>
              ) : demosError ? (
                <p className="muted">{demosError}</p>
              ) : filteredDemoRows.length === 0 ? (
                <p className="muted">{demoRows.length === 0 ? "No hay demos" : "Sin resultados"}</p>
              ) : (
                <div className="table-wrap">
                  <table className="demos-table">
                    <thead>
                      <tr>
                        <th>Dispositivo</th>
                        <th>Inicio</th>
                        <th>Vence</th>
                        <th>Restante</th>
                        <th>Estado</th>
                        <th>Editar vencimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDemoRows.map((row) => {
                        const remainingLabel = getRemainingLabel(row.expiresAt, nowTs);
                        const isSaving = savingDemoId === row.id;

                        return (
                          <tr key={`${row.id}-${row.startedAt}`}>
                            <td>{row.deviceName}</td>
                            <td>{formatDateTimeSeconds(row.startedAt)}</td>
                            <td>{formatDateTimeSeconds(row.expiresAt)}</td>
                            <td>{remainingLabel}</td>
                            <td>
                              <span className={getBadgeClass(row.status)}>{row.status}</span>
                            </td>
                            <td className="demos-actions">
                              <button
                                type="button"
                                className="ghost-btn"
                                disabled={loadingDemos || isSaving}
                                onClick={() => handleOpenEditDemo(row)}
                              >
                                Editar vencimiento
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

            {!!editingDemo && (
              <div className="modal-backdrop" role="dialog" aria-modal="true">
                <div className="modal">
                  <div className="modal-header">
                    <div>
                      <h3>Editar demo</h3>
                      {editingDemo?.deviceName && <p className="muted">{editingDemo.deviceName}</p>}
                    </div>
                    <button type="button" className="ghost-btn" disabled={!!savingDemoId} onClick={handleCloseEditDemo}>
                      Cerrar
                    </button>
                  </div>

                  <div className="modal-body">
                    <div className="demo-edit-grid">
                      <div>
                        <p className="muted">demo_started_at</p>
                        <input
                          type="datetime-local"
                          step="1"
                          value={demoStartedValue}
                          onChange={(e) => setDemoStartedValue(e.target.value)}
                          className="demo-input"
                        />
                      </div>
                      <div>
                        <p className="muted">Nuevo demo_expires_at</p>
                        <input
                          type="datetime-local"
                          step="1"
                          value={demoExactValue}
                          onChange={(e) => setDemoExactValue(e.target.value)}
                          className="demo-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="primary-btn" disabled={!!savingDemoId} onClick={handleUpdateDemoExpiresAt}>
                      {savingDemoId ? "Guardando..." : "Guardar"}
                    </button>
                    <button type="button" className="secondary-btn" disabled={!!savingDemoId} onClick={handleCloseEditDemo}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "versiones" && (
          <>
            <SectionTitle
              title="Actualizaciones"
              subtitle="Administrá actualizaciones obligatorias: una sola puede estar activa."
            />
            {!!releasesActionError && <p className="muted">{releasesActionError}</p>}
            {loadingReleases ? (
              <p className="muted">Cargando releases...</p>
            ) : releasesError ? (
              <p className="muted">{releasesError}</p>
            ) : (
              <>
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
                  <div className="versions-actions">
                    <button
                      type="button"
                      className="ghost-btn icon-btn big-icon-btn"
                      title="Crear nueva release"
                      onClick={() => setCreateReleaseModalOpen(true)}
                    >
                      <Plus size={26} />
                    </button>
                    <button
                      type="button"
                      className="ghost-btn icon-btn big-icon-btn"
                      title="Ver release activa"
                      onClick={() => setReleaseInfoModalOpen(true)}
                    >
                      <HelpCircle size={26} />
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Version</th>
                          <th>Version Codigo</th>
                          <th>Link</th>
                          <th>Mensaje</th>
                          <th>Estado</th>
                          <th>Creado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReleaseRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="muted">
                              {releaseRows.length === 0 ? "No hay releases" : "Sin resultados"}
                            </td>
                          </tr>
                        ) : (
                          filteredReleaseRows.map((row) => {
                            const isActivating = activatingReleaseId === row.rawId;
                            const isDeleting = deletingReleaseId === row.rawId;
                            return (
                              <tr key={row.rawId ? row.rawId : `${row.id}-${row.createdAt}`}>
                                <td>{row.versionName}</td>
                                <td className="mono">{row.versionCode}</td>
                                <td>
                                  <div className="cell-center cell-center-right">
                                    {row.apkUrl && row.apkUrl !== "-" ? (
                                      <a className="ghost-btn" href={row.apkUrl} target="_blank" rel="noreferrer">
                                        Abrir
                                      </a>
                                    ) : (
                                      "-"
                                    )}
                                  </div>
                                </td>
                                <td>{row.message || "-"}</td>
                                <td>
                                  <div className="cell-center cell-center-right">
                                    <span className={row.isActive ? "badge badge-green" : "badge badge-yellow"}>
                                      {row.status}
                                    </span>
                                  </div>
                                </td>
                                <td>{formatDateTimeSeconds(row.createdAt)}</td>
                                <td className="releases-actions">
                                  <button
                                    type="button"
                                    className="ghost-btn"
                                    disabled={loadingReleases || creatingRelease || row.isActive || isActivating || isDeleting}
                                    onClick={() => handleActivateRelease(row)}
                                  >
                                    {isActivating ? "Activando..." : "Activar"}
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost-btn"
                                    disabled={loadingReleases || creatingRelease || isActivating || isDeleting}
                                    onClick={() => handleDeleteRelease(row)}
                                  >
                                    {isDeleting ? "Eliminando..." : "Eliminar"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {releaseInfoModalOpen && (
                  <div
                    className="modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setReleaseInfoModalOpen(false)}
                  >
                    <div className="modal" onClick={(event) => event.stopPropagation()}>
                      <div className="modal-header" style={{ justifyContent: "center", textAlign: "center" }}>
                        <div style={{ width: "100%" }}>
                          <p className="muted" style={{ margin: 0 }}>
                            Actualizacion activa actual
                          </p>
                          <h3 style={{ margin: "6px 0 0" }}>{activeRelease?.versionName || "-"}</h3>
                        </div>
                      </div>

                      <div className="modal-body">
                        {!activeRelease ? (
                          <p className="muted">No hay release activa</p>
                        ) : (
                          <>
                            <div className="detail-grid" style={{ marginTop: 0 }}>
                              <div className="detail-box">
                                <span>Version codigo</span>
                                <div className="mono">{activeRelease.versionCode ?? "-"}</div>
                              </div>
                              <div className="detail-box">
                                <span>Creado</span>
                                <div>{formatDateTimeSeconds(activeRelease.createdAt)}</div>
                              </div>
                              <div className="detail-box" style={{ gridColumn: "1 / -1" }}>
                                <span>Link</span>
                                <div className="mono">{activeRelease.apkUrl || "-"}</div>
                              </div>
                            </div>

                            <div className="detail-section">
                              <div className="detail-label">Mensaje</div>
                              <div className="detail-content">{activeRelease.message || "-"}</div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="modal-actions">
                        {activeRelease?.apkUrl && activeRelease.apkUrl !== "-" && (
                          <a className="ghost-btn" href={activeRelease.apkUrl} target="_blank" rel="noreferrer">
                            Abrir
                          </a>
                        )}
                        <button type="button" className="secondary-btn" onClick={() => setReleaseInfoModalOpen(false)}>
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {createReleaseModalOpen && (
                  <div
                    className="modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setCreateReleaseModalOpen(false)}
                  >
                    <div className="modal" onClick={(event) => event.stopPropagation()}>
                      <div className="modal-header" style={{ justifyContent: "center", textAlign: "center" }}>
                        <div style={{ width: "100%" }}>
                          <h3>Nueva actualizacion</h3>
                          <p className="muted" style={{ margin: "6px 0 0" }}>
                            Crear y dejar activa
                          </p>
                        </div>
                      </div>

                      <div className="modal-body">
                        <div className="release-form-grid" style={{ marginTop: 0 }}>
                          <div>
                            <p className="muted">version actualizacion</p>
                            <input
                              type="text"
                              value={releaseNameValue}
                              onChange={(e) => setReleaseNameValue(e.target.value)}
                              className="demo-input"
                              placeholder="Ej: 1.0.9"
                            />
                          </div>
                          <div>
                            <p className="muted">version codigo</p>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={releaseCodeValue}
                              onChange={(e) => setReleaseCodeValue(e.target.value)}
                              className="demo-input"
                              placeholder="Ej: 109"
                            />
                          </div>
                          <div className="release-form-full">
                            <p className="muted">link</p>
                            <input
                              type="text"
                              value={releaseApkUrlValue}
                              onChange={(e) => setReleaseApkUrlValue(e.target.value)}
                              className="demo-input"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="release-form-full">
                            <p className="muted">Mensaje</p>
                            <textarea
                              rows={3}
                              value={releaseMessageValue}
                              onChange={(e) => setReleaseMessageValue(e.target.value)}
                              className="demo-input"
                              placeholder="Qué cambia y por qué es obligatoria"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={creatingRelease || loadingReleases || activatingReleaseId !== "" || deletingReleaseId !== ""}
                          onClick={() => setCreateReleaseModalOpen(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={creatingRelease || loadingReleases || activatingReleaseId !== "" || deletingReleaseId !== ""}
                          onClick={handleCreateRelease}
                        >
                          {creatingRelease ? "Creando..." : "Crear y activar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
