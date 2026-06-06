// api/notifikasi.js — Ambil notifikasi real dari database
const { supabase, ok, err, ambilSesi } = require('../lib/supabase');

module.exports = async (req, res) => {
    if (req.method !== 'GET') return err(res, 'Method tidak valid.', 405);

    const sesi = ambilSesi(req);
    if (!sesi) return err(res, 'Sesi habis.', 401);

    const notifs = [];

    try {
        // 1. Materi terbaru (max 3)
        const { data: materiList } = await supabase
            .from('materi')
            .select('id, judul, tipe, tanggal, guru(nama)')
            .order('created_at', { ascending: false })
            .limit(3);

        (materiList || []).forEach(m => {
            notifs.push({
                id: `materi_${m.id}`,
                tipe: 'materi',
                judul: `📚 Materi Baru: ${m.judul}`,
                deskripsi: `Diunggah oleh ${m.guru?.nama || 'Guru'} · ${m.tanggal}`,
                halaman: 'materi',
                waktu: m.tanggal,
            });
        });

        // 2. Untuk siswa: nilai terbaru
        if (sesi.peran === 'siswa') {
            const { data: nilaiList } = await supabase
                .from('nilai')
                .select('id, mapel, akhir, updated_at')
                .eq('id_siswa', sesi.id)
                .order('updated_at', { ascending: false })
                .limit(2);

            (nilaiList || []).forEach(n => {
                const status = parseFloat(n.akhir) >= 75 ? 'Lulus ✅' : 'Perlu Remidi ⚠️';
                notifs.push({
                    id: `nilai_${n.id}`,
                    tipe: 'nilai',
                    judul: `📊 Nilai ${n.mapel} Tersedia`,
                    deskripsi: `Nilai Akhir: ${n.akhir} — ${status}`,
                    halaman: 'nilai',
                    waktu: n.updated_at,
                });
            });
        }

        // 3. Untuk guru: rekap siswa yang belum ada nilai
        if (sesi.peran === 'guru' || sesi.peran === 'kepsek') {
            const { data: guruData } = await supabase
                .from('guru').select('mapel').eq('id', sesi.id).single();

            const kelasGuru = guruData?.mapel?.replace('Wali Kelas','').trim();
            let query = supabase.from('siswa').select('id, nama');
            if (kelasGuru && sesi.peran === 'guru') query = query.eq('kelas', kelasGuru);

            const { data: siswaList } = await query.limit(20);
            const { data: nilaiAll } = await supabase.from('nilai').select('id_siswa');
            const sudahAdaNilai = new Set((nilaiAll||[]).map(n => n.id_siswa));
            const belumNilai = (siswaList||[]).filter(s => !sudahAdaNilai.has(s.id));

            if (belumNilai.length > 0) {
                notifs.push({
                    id: 'rekap_belum',
                    tipe: 'rekap',
                    judul: `⚠️ ${belumNilai.length} Siswa Belum Ada Nilai`,
                    deskripsi: `Segera input nilai untuk: ${belumNilai.slice(0,2).map(s=>s.nama).join(', ')}${belumNilai.length > 2 ? '...' : ''}`,
                    halaman: 'rekap',
                    waktu: new Date().toISOString(),
                });
            }
        }

        // Sort by waktu terbaru
        notifs.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

        return ok(res, { notifikasi: notifs.slice(0, 5), jumlah: notifs.length });
    } catch (e) {
        return ok(res, { notifikasi: [], jumlah: 0 });
    }
};
