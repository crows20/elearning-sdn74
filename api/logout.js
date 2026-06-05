// api/logout.js
const { ok, hapusSesi } = require('../lib/supabase');
module.exports = (req, res) => { hapusSesi(req); ok(res, { pesan: 'Berhasil keluar.' }); };
