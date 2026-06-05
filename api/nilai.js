// api/nilai.js
const { supabase, ok, err, ambilSesi, parseBody } = require('../lib/supabase');

module.exports = async (req, res) => {
    const aksi = req.query?.aksi || '';
    const sesi = ambilSesi(req);
    if (!sesi) return err(res, 'Sesi habis.', 401);

    // ── Nilai milik siswa sendiri ────────────────────────
    if (req.method === 'GET' && aksi === 'milik_saya') {
        if (sesi.peran !== 'siswa') return err(res, 'Hanya untuk siswa.');
        const { data } = await supabase.from('nilai').select('*').eq('id_siswa', sesi.id).order('mapel');
        return ok(res, { nilai: data || [] });
    }

    // ── Rekap semua siswa (guru + kepsek) ────────────────
    if (req.method === 'GET' && aksi === 'rekap') {
        if (!['guru','kepsek'].includes(sesi.peran)) return err(res, 'Akses ditolak.', 403);
        const { data: siswaList } = await supabase.from('siswa').select('id, nisn, nama, kelas').order('kelas').order('nama');
        const { data: nilaiAll }  = await supabase.from('nilai').select('id_siswa, akhir');

        const rekap = (siswaList || []).map(s => {
            const nilaiSiswa = (nilaiAll || []).filter(n => n.id_siswa === s.id);
            const rata = nilaiSiswa.length
                ? parseFloat((nilaiSiswa.reduce((sum, n) => sum + parseFloat(n.akhir), 0) / nilaiSiswa.length).toFixed(1))
                : null;
            return { ...s, rata, jml_mapel: nilaiSiswa.length };
        });
        return ok(res, { rekap });
    }

    // ── Detail nilai 1 siswa ─────────────────────────────
    if (req.method === 'GET' && aksi === 'detail') {
        if (!['guru','kepsek'].includes(sesi.peran)) return err(res, 'Akses ditolak.', 403);
        const id_siswa = parseInt(req.query.id_siswa);
        const { data: nilai } = await supabase.from('nilai').select('*').eq('id_siswa', id_siswa).order('mapel');
        const { data: siswa } = await supabase.from('siswa').select('nama, kelas').eq('id', id_siswa).single();
        return ok(res, { nilai: nilai || [], siswa });
    }

    // ── Export CSV semua siswa ───────────────────────────
    if (req.method === 'GET' && aksi === 'export_csv') {
        if (!['guru','kepsek'].includes(sesi.peran)) return err(res, 'Akses ditolak.', 403);
        const { data: rows } = await supabase
            .from('nilai')
            .select('*, siswa(nisn, nama, kelas)')
            .order('mapel');

        let csv = '\uFEFFNISN,Nama,Kelas,Mata Pelajaran,Tugas,UTS,UAS,Nilai Akhir,Status\n';
        (rows || []).forEach(r => {
            const status = r.akhir >= 75 ? 'Lulus' : 'Remidi';
            csv += `${r.siswa?.nisn},${r.siswa?.nama},${r.siswa?.kelas},${r.mapel},${r.tugas},${r.uts},${r.uas},${r.akhir},${status}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="rekap_nilai_${new Date().toISOString().slice(0,10)}.csv"`);
        return res.send(csv);
    }

    // ── Download nilai 1 siswa ───────────────────────────
    if (req.method === 'GET' && aksi === 'download_siswa') {
        const id_siswa = sesi.peran === 'siswa' ? sesi.id : parseInt(req.query.id_siswa);
        const { data: nilai } = await supabase.from('nilai').select('*').eq('id_siswa', id_siswa).order('mapel');
        const { data: siswa } = await supabase.from('siswa').select('nama, kelas, nisn').eq('id', id_siswa).single();
        if (!nilai?.length) return err(res, 'Tidak ada nilai.');

        let csv = `\uFEFFLAPORAN NILAI SISWA\nE-Learning SD Negeri 74 Krui Pesisir Barat\n\n`;
        csv += `Nama Siswa,${siswa?.nama}\nKelas,${siswa?.kelas}\nNISN,${siswa?.nisn}\nTanggal Cetak,${new Date().toLocaleDateString('id-ID')}\n\n`;
        csv += `No,Mata Pelajaran,Tugas (30%),UTS (30%),UAS (40%),Nilai Akhir,Status\n`;

        let total = 0;
        nilai.forEach((n, i) => {
            const s = n.akhir >= 75 ? 'Lulus' : 'Remidi';
            csv += `${i+1},${n.mapel},${n.tugas},${n.uts},${n.uas},${n.akhir},${s}\n`;
            total += parseFloat(n.akhir);
        });
        const rata = (total / nilai.length).toFixed(1);
        csv += `\n,Rata-rata,,,,${rata},${rata >= 75 ? 'Lulus' : 'Perlu Perhatian'}\n`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="Nilai_${siswa?.nama?.replace(/ /g,'_')}_${new Date().toISOString().slice(0,10)}.csv"`);
        return res.send(csv);
    }

    // ── Tambah nilai ─────────────────────────────────────
    if (req.method === 'POST' && aksi === 'tambah') {
        if (!['guru','kepsek'].includes(sesi.peran)) return err(res, 'Akses ditolak.', 403);
        const { id_siswa, mapel, tugas, uts, uas } = await parseBody(req);
        if (!id_siswa || !mapel) return err(res, 'Data tidak lengkap.');
        const t = Math.min(100, Math.max(0, parseFloat(tugas)));
        const u = Math.min(100, Math.max(0, parseFloat(uts)));
        const a = Math.min(100, Math.max(0, parseFloat(uas)));
        const akhir = parseFloat(((t * 0.3) + (u * 0.3) + (a * 0.4)).toFixed(1));

        const { error } = await supabase.from('nilai').insert({ id_siswa, mapel, tugas: t, uts: u, uas: a, akhir });
        if (error) return err(res, error.code === '23505' ? 'Nilai mapel ini sudah ada.' : error.message);
        return ok(res, { pesan: 'Nilai berhasil ditambahkan.', akhir });
    }

    // ── Edit nilai ───────────────────────────────────────
    if (req.method === 'POST' && aksi === 'edit') {
        if (!['guru','kepsek'].includes(sesi.peran)) return err(res, 'Akses ditolak.', 403);
        const { id, tugas, uts, uas } = await parseBody(req);
        if (!id) return err(res, 'ID tidak valid.');
        const t = Math.min(100, Math.max(0, parseFloat(tugas)));
        const u = Math.min(100, Math.max(0, parseFloat(uts)));
        const a = Math.min(100, Math.max(0, parseFloat(uas)));
        const akhir = parseFloat(((t * 0.3) + (u * 0.3) + (a * 0.4)).toFixed(1));
        await supabase.from('nilai').update({ tugas: t, uts: u, uas: a, akhir, updated_at: new Date() }).eq('id', id);
        return ok(res, { pesan: 'Nilai berhasil diperbarui.', akhir });
    }

    // ── Hapus nilai ──────────────────────────────────────
    if (req.method === 'POST' && aksi === 'hapus') {
        if (!['guru','kepsek'].includes(sesi.peran)) return err(res, 'Akses ditolak.', 403);
        const { id } = await parseBody(req);
        await supabase.from('nilai').delete().eq('id', id);
        return ok(res, { pesan: 'Nilai berhasil dihapus.' });
    }

    return err(res, 'Aksi tidak dikenal.', 404);
};
