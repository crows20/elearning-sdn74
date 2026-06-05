// api/reset_sandi.js
const { supabase, ok, err, parseBody } = require('../lib/supabase');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return err(res, 'Method tidak valid.', 405);

    const { peran, id, nama, sandi_baru, konfirmasi } = await parseBody(req);
    if (!peran || !id || !nama || !sandi_baru) return err(res, 'Semua field wajib diisi.');
    if (sandi_baru.length < 6) return err(res, 'Kata sandi baru minimal 6 karakter.');
    if (sandi_baru !== konfirmasi) return err(res, 'Konfirmasi kata sandi tidak sesuai.');

    let user = null;
    if (peran === 'siswa') {
        const { data } = await supabase.from('siswa').select('id, nama').eq('nisn', id).single();
        user = data;
    } else {
        const { data } = await supabase.from('guru').select('id, nama').eq('nip', id).single();
        user = data;
    }

    if (!user || user.nama.toLowerCase() !== nama.toLowerCase()) {
        return err(res, 'ID dan nama tidak cocok. Periksa kembali data Anda.');
    }

    const tabel = peran === 'siswa' ? 'siswa' : 'guru';
    await supabase.from(tabel).update({ sandi: sandi_baru }).eq('id', user.id);

    ok(res, { pesan: 'Kata sandi berhasil direset! Silakan login.' });
};
