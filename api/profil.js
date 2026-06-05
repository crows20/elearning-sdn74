// api/profil.js
const { supabase, ok, err, ambilSesi, parseBody } = require('../lib/supabase');
const multipart = require('parse-multipart-data');

module.exports = async (req, res) => {
    const aksi = req.query?.aksi || '';
    const sesi = ambilSesi(req);
    if (!sesi) return err(res, 'Sesi habis.', 401);

    const tabel = sesi.peran === 'siswa' ? 'siswa' : 'guru';

    // ── Info profil ───────────────────────────────────────
    if (req.method === 'GET' && aksi === 'info') {
        const { data } = await supabase.from(tabel).select('*').eq('id', sesi.id).single();
        if (data) delete data.sandi;
        return ok(res, { profil: data });
    }

    // ── Update nama ───────────────────────────────────────
    if (req.method === 'POST' && aksi === 'update_nama') {
        const { nama } = await parseBody(req);
        if (!nama?.trim()) return err(res, 'Nama tidak boleh kosong.');
        await supabase.from(tabel).update({ nama: nama.trim() }).eq('id', sesi.id);
        return ok(res, { pesan: 'Nama berhasil diperbarui.', nama: nama.trim() });
    }

    // ── Upload foto ke Supabase Storage ───────────────────
    if (req.method === 'POST' && aksi === 'upload_foto') {
        const contentType = req.headers['content-type'] || '';
        const boundary = multipart.getBoundary(contentType);
        if (!boundary) return err(res, 'Format tidak valid.');

        const chunks = []; for await (const c of req) chunks.push(c);
        const parts = multipart.parse(Buffer.concat(chunks), boundary);
        const foto = parts.find(p => p.name === 'foto');
        if (!foto) return err(res, 'File foto tidak ditemukan.');

        const ext  = foto.filename?.split('.').pop().toLowerCase() || 'jpg';
        const name = `foto_${sesi.peran}_${sesi.id}_${Date.now()}.${ext}`;

        const { error } = await supabase.storage.from('foto').upload(name, foto.data, {
            contentType: foto.type || 'image/jpeg', upsert: true
        });
        if (error) return err(res, 'Gagal upload foto: ' + error.message);

        const { data: pub } = supabase.storage.from('foto').getPublicUrl(name);
        const url = pub.publicUrl;
        await supabase.from(tabel).update({ foto: url }).eq('id', sesi.id);
        return ok(res, { pesan: 'Foto berhasil diperbarui.', foto: url });
    }

    // ── Ganti kata sandi ──────────────────────────────────
    if (req.method === 'POST' && aksi === 'ganti_sandi') {
        const { sandi_lama, sandi_baru } = await parseBody(req);
        if (!sandi_lama || !sandi_baru) return err(res, 'Semua field wajib diisi.');
        if (sandi_baru.length < 6) return err(res, 'Kata sandi baru minimal 6 karakter.');

        const { data: u } = await supabase.from(tabel).select('sandi').eq('id', sesi.id).single();
        if (!u || u.sandi !== sandi_lama) return err(res, 'Kata sandi lama tidak sesuai.');

        await supabase.from(tabel).update({ sandi: sandi_baru }).eq('id', sesi.id);
        return ok(res, { pesan: 'Kata sandi berhasil diperbarui.' });
    }

    return err(res, 'Aksi tidak dikenal.', 404);
};
