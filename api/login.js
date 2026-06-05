// api/login.js
const { supabase, ok, err, buatToken, parseBody } = require('../lib/supabase');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return err(res, 'Method tidak valid.', 405);

    const { peran, id, sandi } = await parseBody(req);
    if (!peran || !id || !sandi) return err(res, 'Semua field wajib diisi.');
    if (!['guru', 'siswa', 'kepsek'].includes(peran)) return err(res, 'Peran tidak valid.');

    let user = null;

    if (peran === 'siswa') {
        const { data } = await supabase.from('siswa').select('*').eq('nisn', id).single();
        user = data;
    } else {
        // guru & kepsek sama-sama dari tabel guru
        const { data } = await supabase.from('guru').select('*').eq('nip', id).single();
        if (data && peran === 'kepsek' && data.peran !== 'kepsek') return err(res, 'Akun ini bukan Kepala Sekolah.');
        if (data && peran === 'guru'   && data.peran === 'kepsek') return err(res, 'Gunakan login Kepala Sekolah.');
        user = data;
    }

    if (!user) return err(res, 'ID atau kata sandi salah.');
    if (user.sandi !== sandi) return err(res, 'ID atau kata sandi salah.');

    const token = buatToken({ id: user.id, peran: peran === 'kepsek' ? 'kepsek' : peran, nama: user.nama });

    const info = { id: user.id, nama: user.nama, peran: peran === 'kepsek' ? 'kepsek' : peran, foto: user.foto || null };
    if (peran === 'siswa')  info.kelas = user.kelas;
    if (peran === 'guru')   info.mapel = user.mapel;
    if (peran === 'kepsek') info.mapel = user.mapel;

    ok(res, { token, user: info });
};
