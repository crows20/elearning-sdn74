// lib/supabase.js — Shared Supabase client & helpers
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ── Response helpers ──────────────────────────────────────
function ok(res, data = {}) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ ok: true, ...data });
}
function err(res, pesan, code = 400) {
    res.setHeader('Content-Type', 'application/json');
    res.status(code).json({ ok: false, pesan });
}

// ── Session helpers (simple cookie-based) ────────────────
const crypto = require('crypto');
const SESSIONS = new Map(); // in-memory; resets on cold start

function buatSesi(user) {
    const token = crypto.randomBytes(32).toString('hex');
    SESSIONS.set(token, { ...user, exp: Date.now() + 8 * 3600 * 1000 });
    return token;
}
function ambilSesi(req) {
    const auth = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return null;
    const sesi = SESSIONS.get(token);
    if (!sesi) return null;
    if (sesi.exp < Date.now()) { SESSIONS.delete(token); return null; }
    return sesi;
}
function hapusSesi(req) {
    const auth = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '').trim();
    SESSIONS.delete(token);
}

// ── Body parser ──────────────────────────────────────────
async function parseBody(req) {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', c => data += c);
        req.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { resolve({}); }
        });
    });
}

module.exports = { supabase, ok, err, buatSesi, ambilSesi, hapusSesi, parseBody };
