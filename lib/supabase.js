// lib/supabase.js — Supabase client + JWT session (stateless)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

function ok(res, data = {}) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ ok: true, ...data });
}
function err(res, pesan, code = 400) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(code).json({ ok: false, pesan });
}

// Simple JWT-like token using base64 (no crypto dependency)
function buatToken(user) {
    const payload = { ...user, exp: Date.now() + 8 * 3600 * 1000 };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function ambilSesi(req) {
    const auth = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return null;
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        if (payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

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

module.exports = { supabase, ok, err, buatToken, buatSesi: ambilSesi, ambilSesi, hapusSesi: () => {}, parseBody };
