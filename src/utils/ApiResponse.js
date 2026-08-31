class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data });
const created = (res, data) => ok(res, data, 201);
module.exports = { ok, created, ApiError };
