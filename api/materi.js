// api/materi.js — List, upload (via Supabase Storage), download URL, hapus
const { supabase, ok, err, ambilSesi } = require('../lib/supabase');
const multipart = require('parse-multipart-data');

const ALLOWED_EXT = ['pdf','ppt','pptx','doc','docx','mp4','avi','mkv','jpg','jpeg','png'];
const TIPE_MAP = {
    pdf: 'PDF', ppt: 'PPT', pptx: 'PPT',
    doc: 'Word', docx: 'Word',
    mp4: 'Video', avi: 'Video', mkv: 'Video',
};

module.exports = async (req, res) => {
    const aksi = req.query?.aksi || '';

    // ── Daftar materi ────────────────────────────────────
    if (req.method === 'GET' && aksi === 'daftar') {
        const sesi = ambilSesi(req);
        if (!sesi) return err(res, 'Sesi habis.', 401);

        const { data, error } = await supabase
            .from('materi')
            .select('*, guru(nama)')
            .order('created_at', { ascending: false });

        if (error) return err(res, error.message);
        const hasil = (data || []).map(m => ({ ...m, nama_guru: m.guru?.nama || '' }));
        return ok(res, { materi: hasil });
    }

    // ── URL download (signed URL dari Supabase Storage) ──
    if (req.method === 'GET' && aksi === 'url_unduh') {
        const sesi = ambilSesi(req);
        if (!sesi) return err(res, 'Sesi habis.', 401);

        const id = parseInt(req.query.id);
        if (!id) return err(res, 'ID tidak valid.');

        const { data: m } = await supabase.from('materi').select('url_file, nama_file').eq('id', id).single();
        if (!m) return err(res, 'Materi tidak ditemukan.', 404);

        // Generate signed URL 60 menit
        const { data: signed } = await supabase.storage
            .from('materi')
            .createSignedUrl(m.url_file, 3600);

        if (!signed) return err(res, 'Gagal generate link download.');
        return ok(res, { url: signed.signedUrl, nama_file: m.nama_file });
    }

    // ── Upload materi ────────────────────────────────────
    if (req.method === 'POST' && aksi === 'upload') {
        const sesi = ambilSesi(req);
        if (!sesi) return err(res, 'Sesi habis.', 401);
        if (!['guru','kepsek'].includes(sesi.peran)) return err(res, 'Akses ditolak.', 403);

        const contentType = req.headers['content-type'] || '';
        const boundary = multipart.getBoundary(contentType);
        if (!boundary) return err(res, 'Format upload tidak valid.');

        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const buf = Buffer.concat(chunks);
        const parts = multipart.parse(buf, boundary);

        const filePart  = parts.find(p => p.name === 'file');
        const judulPart = parts.find(p => p.name === 'judul');
        const kelasPart = parts.find(p => p.name === 'kelas');

        if (!filePart) return err(res, 'File tidak ditemukan.');
        const judul = judulPart ? judulPart.data.toString() : 'Materi';
        const kelas = kelasPart ? kelasPart.data.toString() : 'V';

        const oriName = filePart.filename || 'file';
        const ext     = oriName.split('.').pop().toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) return err(res, 'Tipe file tidak diizinkan.');
        if (filePart.data.length > 50 * 1024 * 1024) return err(res, 'Ukuran file maksimal 50MB.');

        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
            .from('materi')
            .upload(safeName, filePart.data, { contentType: filePart.type || 'application/octet-stream' });

        if (upErr) return err(res, 'Gagal upload: ' + upErr.message);

        const bytes  = filePart.data.length;
        const ukuran = bytes >= 1048576 ? (bytes/1048576).toFixed(1)+' MB' : Math.round(bytes/1024)+' KB';
        const tipe   = TIPE_MAP[ext] || 'Lainnya';

        const { error: dbErr } = await supabase.from('materi').insert({
            judul, kelas, tipe, ukuran,
            nama_file: oriName,
            url_file:  safeName,
            id_guru:   sesi.id,
        });
        if (dbErr) return err(res, 'Gagal simpan database: ' + dbErr.message);

        return ok(res, { pesan: 'Materi berhasil diunggah!' });
    }

    // ── Hapus materi ─────────────────────────────────────
    if (req.method === 'POST' && aksi === 'hapus') {
        const sesi = ambilSesi(req);
        if (!sesi) return err(res, 'Sesi habis.', 401);
        if (!['guru','kepsek'].includes(sesi.peran)) return err(res, 'Akses ditolak.', 403);

        const chunks = []; for await (const c of req) chunks.push(c);
        const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
        const id = parseInt(body.id);
        if (!id) return err(res, 'ID tidak valid.');

        const { data: m } = await supabase.from('materi').select('url_file').eq('id', id).single();
        if (!m) return err(res, 'Materi tidak ditemukan.', 404);

        await supabase.storage.from('materi').remove([m.url_file]);
        await supabase.from('materi').delete().eq('id', id);

        return ok(res, { pesan: 'Materi berhasil dihapus.' });
    }

    return err(res, 'Aksi tidak dikenal.', 404);
};
