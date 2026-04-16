async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function normalizeItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export async function getOfferFailureDiagnostics({ baseUrl, signal } = {}) {
  const res = await fetch(new URL("/admin/diagnostics/offer-failure", baseUrl), { signal });
  const payload = await safeJson(res);
  if (!res.ok) {
    return { ok: false, status: res.status, items: [], payload };
  }
  if (payload?.ok === false) {
    return { ok: false, status: res.status, items: [], payload };
  }
  return { ok: true, status: res.status, items: normalizeItems(payload), payload };
}

export async function reviewOfferFailureDiagnostic({ baseUrl, id, note } = {}) {
  const url = new URL(
    `/admin/diagnostics/offer-failure/${encodeURIComponent(String(id))}/review`,
    baseUrl
  );
  const trimmedNote = typeof note === "string" ? note.trim() : note;
  const body = JSON.stringify(trimmedNote ? { note: String(trimmedNote) } : {});
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const payload = await safeJson(res);
  if (!res.ok) return { ok: false, status: res.status, payload };
  if (payload?.ok === false) return { ok: false, status: res.status, payload };
  return { ok: true, status: res.status, payload };
}

export async function deleteOfferFailureDiagnostic({ baseUrl, id } = {}) {
  const url = new URL(`/admin/diagnostics/offer-failure/${encodeURIComponent(String(id))}`, baseUrl);
  const res = await fetch(url, { method: "DELETE" });
  const payload = await safeJson(res);
  if (!res.ok) return { ok: false, status: res.status, payload };
  if (payload?.ok === false) return { ok: false, status: res.status, payload };
  return { ok: true, status: res.status, payload };
}

export async function deleteReviewedOfferFailureDiagnostics({ baseUrl } = {}) {
  const url = new URL("/admin/diagnostics/offer-failure/reviewed", baseUrl);
  const res = await fetch(url, { method: "DELETE" });
  const payload = await safeJson(res);
  if (!res.ok) return { ok: false, status: res.status, payload };
  if (payload?.ok === false) return { ok: false, status: res.status, payload };
  return { ok: true, status: res.status, payload };
}
