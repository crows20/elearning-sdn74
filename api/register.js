// api/register.js
const { supabase, ok, err, parseBody } = require('../lib/supabase');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return err(res, 'Method tidak valid.', 405);

    const { peran, nama, id, kelas, mapel, sandi, konfirmasi } = await parseBody(req);
    if (!peran || !nama || !id || !sandi) return err(res, 'Semua field wajib diisi.');
    if (sandi.length < 6) return err(res, 'Kata sandi minimal 6 karakter.');
    if (sandi !== konfirmasi) return err(res, 'Konfirmasi kata sandi tidak sesuai.');

    if (peran === 'siswa') {
        const { data: cek } = await supabase.from('siswa').select('id').eq('nisn', id).single();
        if (cek) return err(res, 'NISN sudah terdaftar.');
        const { error } = await supabase.from('siswa').insert({ nisn: id, nama, kelas: kelas || 'V A', sandi });
        if (error) return err(res, 'Gagal mendaftar: ' + error.message);
    } else {
        const { data: cek } = await supabase.from('guru').select('id').eq('nip', id).single();
        if (cek) return err(res, 'NIP sudah terdaftar.');
        const { error } = await supabase.from('guru').insert({ nip: id, nama, mapel: mapel || 'Wali Kelas', peran: 'guru', sandi });
        if (error) return err(res, 'Gagal mendaftar: ' + error.message);
    }

    ok(res, { pesan: 'Akun berhasil dibuat! Silakan login.' });
};
