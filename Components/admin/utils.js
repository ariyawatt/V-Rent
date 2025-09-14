// components/admin/utils.js
export const cls = (...a) => a.filter(Boolean).join(" ");

export const fmtBaht = (n) => Number(n || 0).toLocaleString("th-TH");

export const sameDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const fmtDateTimeLocal = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${dd} ${hh}:${mm}`;
};

export const computeDays = (pickupISO, returnISO) => {
  try {
    const a = new Date(pickupISO),
      b = new Date(returnISO);
    const d = Math.ceil((b - a) / 86400000);
    return Math.max(d, 1);
  } catch {
    return 1;
  }
};

export const overlap = (aStart, aEnd, bStart, bEnd) =>
  new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
