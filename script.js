/* ============================================================
   E-Learning SDN 74 Krui — script.js (Versi PHP + MySQL)
   Skripsi "Perancangan UI/UX Sistem Informasi E-Learning
   Berbasis Website di SD Negeri 74 Krui Pesisir Barat"
   Oleh: Agung Stiawan (NPM: 2171020044)
   UIN Raden Intan Lampung, 2026
   ============================================================ */

'use strict';

/* ============================================================
   KONSTANTA
   ============================================================ */
const IKON_TIPE  = { PDF: 'fa-file-pdf', Video: 'fa-file-video', PPT: 'fa-file-powerpoint', Word: 'fa-file-word', Lainnya: 'fa-file' };
const WARNA_TIPE = { PDF: '#dc3545', Video: '#0d6efd', PPT: '#fd7e14', Word: '#2980b9', Lainnya: '#6c757d' };

const DAFTAR_MAPEL = [
    'Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PKn',
    'Bahasa Inggris', 'SBdP', 'PJOK',
];

/* ============================================================
   STATE APLIKASI
   ============================================================ */
let STATE = {
    peran:    'siswa',
    user:     null,   // data dari server setelah login
    halaman:  'dashboard',
    modalNilai: { buka: false, mode: 'tambah', idSiswa: null, idNilai: null },
};

/* ============================================================
   API HELPER — semua request ke PHP
   ============================================================ */
async function api(url, options = {}) {
    try {
        const token = localStorage.getItem('el74_token') || '';
        const headers = options.headers || {};
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const res = await fetch(url, {
            ...options,
            headers,
        });
        const data = await res.json().catch(() => ({ ok: false, pesan: 'Respons server tidak valid.' }));
        return data;
    } catch (e) {
        return { ok: false, pesan: 'Tidak dapat terhubung ke server. Pastikan XAMPP berjalan.' };
    }
}

async function apiJSON(url, body) {
    return api(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

async function apiForm(url, formData) {
    return api(url, { method: 'POST', body: formData });
}

/* ============================================================
   UTILITAS UI
   ============================================================ */
const el = id => document.getElementById(id);

const LOADING_TEXTS = [
    'Sedang memuat materi,\ntunggu sebentar ya!',
    'Yuk belajar bersama,\nsebentar lagi siap! 🌟',
    'Halaman sedang disiapkan,\nsemangat belajar!',
    'Sebentar ya,\nsistem sedang bekerja untukmu! 😊',
];
let _ltIdx = 0, _ltTimer = null;

function _startTextRotation() {
    const t = el('loading-text-msg');
    if (!t) return;
    _ltIdx = 0;
    t.innerHTML = LOADING_TEXTS[0].replace('\n', '<br>');
    t.style.opacity = '1'; t.style.transform = 'translateY(0)';
    _ltTimer = setInterval(() => {
        _ltIdx = (_ltIdx + 1) % LOADING_TEXTS.length;
        t.style.opacity = '0'; t.style.transform = 'translateY(6px)';
        setTimeout(() => {
            t.innerHTML = LOADING_TEXTS[_ltIdx].replace('\n', '<br>');
            t.style.opacity = '1'; t.style.transform = 'translateY(0)';
        }, 230);
    }, 1900);
}
function _stopTextRotation() {
    if (_ltTimer) { clearInterval(_ltTimer); _ltTimer = null; }
}

function _initLottie(lottieId, wrapId, fallbackId) {
    const player   = el(lottieId);
    const wrap     = el(wrapId);
    const fallback = el(fallbackId);
    if (!player || !wrap || !fallback) return;
    const useFallback = () => { wrap.style.display = 'none'; fallback.classList.add('aktif'); };
    if (!customElements.get('lottie-player')) { useFallback(); return; }
    player.addEventListener('error', useFallback);
    const t = setTimeout(() => { if (!player.__initialized) useFallback(); }, 3000);
    player.addEventListener('ready', () => clearTimeout(t));
}

function tampilLoading(ya) {
    el('loading-overlay').classList.toggle('d-none', !ya);
    if (ya) { _initLottie('lottie-star', 'lottie-wrap', 'star-fallback'); _startTextRotation(); }
    else    { _stopTextRotation(); }
}

const NAV_TEXTS = [
    'Sedang memuat materi,\ntunggu sebentar ya!',
    'Yuk belajar bersama,\nsebentar lagi siap! 🌟',
    'Halaman sedang disiapkan,\nsemangat belajar!',
    'Sebentar ya,\nsistem sedang bekerja untukmu! 😊',
];
let _ntIdx = 0, _ntTimer = null;

function _startNavText() {
    const t = el('nav-loading-text-msg');
    if (!t) return;
    _ntIdx = 0;
    t.innerHTML = NAV_TEXTS[0].replace('\n', '<br>');
    t.style.opacity = '1'; t.style.transform = 'translateY(0)';
    _ntTimer = setInterval(() => {
        _ntIdx = (_ntIdx + 1) % NAV_TEXTS.length;
        t.style.opacity = '0'; t.style.transform = 'translateY(5px)';
        setTimeout(() => {
            t.innerHTML = NAV_TEXTS[_ntIdx].replace('\n', '<br>');
            t.style.opacity = '1'; t.style.transform = 'translateY(0)';
        }, 220);
    }, 1900);
}
function _stopNavText() {
    if (_ntTimer) { clearInterval(_ntTimer); _ntTimer = null; }
}

function tampilNavLoading(ya) {
    const nav = el('nav-loading');
    if (!nav) return;
    nav.classList.toggle('d-none', !ya);
    if (ya) { _initLottie('nav-lottie-star','nav-lottie-wrap','nav-star-fallback'); _startNavText(); }
    else    { _stopNavText(); }
}

function tampilToast(pesan, tipe = 'sukses') {
    const c   = el('toast-container');
    const div = document.createElement('div');
    const ikon = tipe === 'sukses' ? 'check-circle' : tipe === 'galat' ? 'exclamation-circle' : 'info-circle';
    div.className = `toast-item ${tipe}`;
    div.innerHTML = `<i class="fas fa-${ikon}"></i>${pesan}`;
    c.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

function urlAvatar(nama, bg = '0D6EFD') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=${bg}&color=fff&size=80`;
}

function fotoSrc(foto, nama) {
    return foto ? foto : urlAvatar(nama);
}

/* ============================================================
   LOGIN
   ============================================================ */
function setRole(peran) {
    STATE.peran = peran;
    const isSiswa  = peran === 'siswa';
    const isKepsek = peran === 'kepsek';
    el('btn-siswa').classList.toggle('active', isSiswa);
    el('btn-guru').classList.toggle('active', !isSiswa && !isKepsek);
    el('btn-kepsek')?.classList.toggle('active', isKepsek);
    el('btn-siswa').setAttribute('aria-pressed', String(isSiswa));
    el('btn-guru').setAttribute('aria-pressed', String(!isSiswa && !isKepsek));
    if (isSiswa) {
        el('label-user').textContent = 'NISN SISWA';
        el('userInput').placeholder  = 'Contoh: 1234567890';
    } else if (isKepsek) {
        el('label-user').textContent = 'NIP KEPALA SEKOLAH';
        el('userInput').placeholder  = 'Contoh: 196501011990031001';
    } else {
        el('label-user').textContent = 'NIP GURU';
        el('userInput').placeholder  = 'Contoh: 198501012010012001';
    }
    bersihkanError();
}

function bersihkanError() {
    el('login-alert').classList.add('d-none');
    el('wrap-user').classList.remove('error');
    el('wrap-pass').classList.remove('error');
}

function tampilError(pesan) {
    el('login-alert-msg').textContent = pesan;
    el('login-alert').classList.remove('d-none');
    el('wrap-user').classList.add('error');
    el('wrap-pass').classList.add('error');
}

function toggleSandi() {
    const inp    = el('passInput');
    const tampil = inp.type === 'password';
    inp.type     = tampil ? 'text' : 'password';
    el('eye-icon').className = tampil ? 'fas fa-eye-slash' : 'fas fa-eye';
}

async function prosesLogin(e) {
    e.preventDefault();
    bersihkanError();
    const id    = el('userInput').value.trim();
    const sandi = el('passInput').value;
    if (!id)    { tampilError('ID tidak boleh kosong.'); return; }
    if (!sandi) { tampilError('Kata sandi tidak boleh kosong.'); return; }

    tampilLoading(true);
    const res = await apiJSON('api/login', { peran: STATE.peran, id, sandi });
    tampilLoading(false);

    if (!res.ok) {
        tampilError(res.pesan || 'ID atau kata sandi salah.');
        return;
    }

    STATE.user = res.user;
    if (res.token) localStorage.setItem('el74_token', res.token);
    masukDashboard();
}

function masukDashboard() {
    perbaruiHeader();
    buatSidebar();
    el('login-screen').classList.add('d-none');
    el('dashboard-screen').classList.remove('d-none');
    STATE.halaman = '';
    pindahHalaman('dashboard');
    muatNotifikasi(); // Load real notifications
}

async function muatNotifikasi() {
    const res = await api('api/notifikasi');
    if (!res.ok) return;

    const { notifikasi, jumlah } = res;

    // Update badge
    _notifSudahDibaca = false;
    const badge = el('notif-badge');
    if (badge) {
        if (jumlah > 0) {
            badge.textContent = jumlah > 9 ? '9+' : jumlah;
            badge.style.display = 'flex';
            badge.style.background = '#dc3545'; // merah kembali saat ada notif baru
        } else {
            badge.style.display = 'none';
        }
    }

    // Update panel
    const panel = el('notif-panel');
    if (!panel) return;

    if (notifikasi.length === 0) {
        panel.innerHTML = `
            <div class="notif-header">NOTIFIKASI</div>
            <div style="padding:1.5rem;text-align:center;color:#6c757d;font-size:.85rem">
                <i class="fas fa-check-circle d-block mb-2" style="font-size:1.5rem;color:#2ecc71"></i>
                Tidak ada notifikasi baru
            </div>`;
        return;
    }

    const items = notifikasi.map(n => `
        <div class="notif-item" onclick="pindahHalaman('${n.halaman}'); tutupNotif();"
             style="cursor:pointer">
            <div class="notif-title">${n.judul}</div>
            <div class="notif-desc">${n.deskripsi}</div>
        </div>`).join('');

    panel.innerHTML = `
        <div class="notif-header">NOTIFIKASI <span style="color:#0d6efd;font-weight:700">(${jumlah})</span></div>
        ${items}
        <div style="padding:8px 12px;border-top:1px solid #f0f0f0;text-align:center">
            <button onclick="muatNotifikasi();tutupNotif();"
                    style="background:none;border:none;color:#0d6efd;font-size:.8rem;cursor:pointer">
                <i class="fas fa-sync-alt me-1"></i>Perbarui
            </button>
        </div>`;
}

async function doLogout() {
    if (!confirm('Yakin ingin keluar dari sistem?')) return;
    tampilLoading(true);
    await api('api/logout');
    tampilLoading(false);
    localStorage.removeItem('el74_token');
    STATE = { peran: STATE.peran, user: null, halaman: 'dashboard', modalNilai: { buka: false, mode: 'tambah', idSiswa: null, idNilai: null } };
    el('dashboard-screen').classList.add('d-none');
    el('login-screen').classList.remove('d-none');
    el('formLogin').reset();
    bersihkanError();
}

/* ============================================================
   HEADER & SIDEBAR
   ============================================================ */
function perbaruiHeader() {
    const u = STATE.user;
    const roleLabel = u.peran === 'siswa'
        ? `Siswa · Kelas ${u.kelas}`
        : u.peran === 'kepsek'
        ? `Kepala Sekolah · ${u.mapel}`
        : `Guru · ${u.mapel}`;
    const src = fotoSrc(u.foto, u.nama);
    el('header-name').textContent   = u.nama;
    el('header-role').textContent   = roleLabel;
    el('dropdown-name').textContent = u.nama;
    el('dropdown-role').textContent = roleLabel;
    el('display-photo').src         = src;
    el('sidebar-photo').src         = fotoSrc(u.foto, u.nama);
    el('sidebar-name').textContent  = u.nama;
    el('sidebar-role').textContent  = roleLabel;
}

function buatSidebar() {
    const menuSiswa = [
        { ikon: 'fa-home',      halaman: 'dashboard', label: 'Dashboard'      },
        { ikon: 'fa-book',      halaman: 'materi',    label: 'Materi Belajar' },
        { ikon: 'fa-gamepad',   halaman: 'kuis',      label: 'Kuis Kahoot!'   },
        { ikon: 'fa-star',      halaman: 'nilai',     label: 'Nilai Saya'     },
    ];
    const menuGuru = [
        { ikon: 'fa-home',      halaman: 'dashboard', label: 'Dashboard'     },
        { ikon: 'fa-upload',    halaman: 'upload',    label: 'Unggah Materi' },
        { ikon: 'fa-tasks',     halaman: 'kuis',      label: 'Kelola Kuis'   },
        { ikon: 'fa-chart-bar', halaman: 'rekap',     label: 'Rekap Nilai'   },
    ];
    const menuKepsek = [
        { ikon: 'fa-home',         halaman: 'dashboard', label: 'Dashboard'        },
        { ikon: 'fa-chart-bar',    halaman: 'rekap',     label: 'Rekap Nilai'      },
        { ikon: 'fa-book-open',    halaman: 'materi',    label: 'Semua Materi'     },
        { ikon: 'fa-users',        halaman: 'kepsek',    label: 'Data Siswa & Guru'},
    ];
    const menus = STATE.user.peran === 'siswa' ? menuSiswa
                : STATE.user.peran === 'kepsek' ? menuKepsek
                : menuGuru;
    el('sidebar-nav').innerHTML = menus.map(m => `
        <a href="#" id="menu-${m.halaman}" role="menuitem" aria-label="${m.label}"
           onclick="pindahHalaman('${m.halaman}'); return false;">
            <i class="fas ${m.ikon}"></i>${m.label}
        </a>`).join('');
}

function setMenuAktif(h) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('aktif'));
    const a = el('menu-' + h);
    if (a) a.classList.add('aktif');
}

/* ============================================================
   NAVIGASI
   ============================================================ */
const NAV_LOADING_DELAY = 200;

function pindahHalaman(h) {
    if (STATE.halaman === h) return;
    STATE.halaman = h;
    setMenuAktif(h);
    tutupNotif();
    tutupProfilMenu();
    el('dynamic-content').innerHTML = '';
    tampilNavLoading(true);
    setTimeout(() => {
        tampilNavLoading(false);
        const render = {
            dashboard: renderDashboard,
            materi:    renderMateri,
            kuis:      renderKuis,
            nilai:     renderNilai,
            upload:    renderUpload,
            rekap:     renderRekap,
            profil:    renderProfil,
            kepsek:    renderKepsek,
        };
        (render[h] || renderDashboard)();
        if (window.innerWidth < 768) el('wrapper').classList.remove('toggled');
        el('dynamic-content').focus();
    }, NAV_LOADING_DELAY);
}

let _notifSudahDibaca = false;

function toggleNotif() {
    const panel = el('notif-panel');
    const isOpen = panel.classList.toggle('tampil');
    tutupProfilMenu();

    if (isOpen && !_notifSudahDibaca) {
        // Badge tetap tampil dengan angka, hanya warna berubah jadi abu
        const badge = el('notif-badge');
        if (badge && badge.style.display !== 'none') {
            badge.style.background = '#6c757d';
            badge.style.opacity = '0.8';
            // Angka TIDAK dihapus - tetap tampil
        }
        _notifSudahDibaca = true;
    }
}

function tutupNotif() { el('notif-panel').classList.remove('tampil'); }
function toggleProfilMenu()  { el('profil-dropdown').classList.toggle('tampil'); tutupNotif(); }
function tutupProfilMenu()   { el('profil-dropdown').classList.remove('tampil'); }

/* ============================================================
   RENDER — DASHBOARD
   ============================================================ */
async function renderDashboard() {
    const u       = STATE.user;
    const isSiswa = u.peran === 'siswa';
    const hari    = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-home me-2 text-primary"></i>Dashboard</h3>
            <span class="section-header-sub">${hari}</span>
        </div>
        <div class="welcome-banner">
            <img src="${fotoSrc(u.foto, u.nama)}" width="56" height="56" alt="Foto profil"
                 onerror="this.src='${urlAvatar(u.nama)}'">
            <div>
                <h5>Selamat datang, ${u.nama}!</h5>
                <small>${isSiswa ? 'Siswa · Kelas ' + u.kelas : 'Guru · ' + u.mapel} · SDN 74 Krui</small>
            </div>
        </div>
        <div class="stat-grid" id="stat-grid"><div class="text-muted p-3">Memuat data...</div></div>
        <div class="kartu">
            <h6 class="fw-bold mb-3">
                <i class="fas fa-bell me-2" style="color:#f39c12"></i>Pengumuman Terbaru
            </h6>
            <div class="pengumuman-kartu">
                <div class="px-judul">📌 Jadwal Kuis Matematika</div>
                <div class="px-isi">Kuis interaktif Matematika akan dilaksanakan Senin, 14 April 2026 pukul 08.00 WIB melalui Kahoot.</div>
                <div class="px-tanggal">📅 11 April 2026</div>
            </div>
            <div class="pengumuman-kartu hijau">
                <div class="px-judul">📚 Materi Baru Tersedia</div>
                <div class="px-isi">Materi terbaru telah diunggah oleh guru. Silakan unduh di menu Materi Belajar.</div>
                <div class="px-tanggal">📅 ${new Date().toLocaleDateString('id-ID')}</div>
            </div>
        </div>`;

    // Muat stat async
    const [resMateri, resNilai] = await Promise.all([
        api('api/materi?aksi=daftar'),
        isSiswa ? api('api/nilai?aksi=milik_saya') : api('api/nilai?aksi=rekap'),
    ]);

    const jmlMateri = resMateri.ok ? resMateri.materi.length : 0;
    let stats;

    if (isSiswa) {
        const nilai = resNilai.ok ? resNilai.nilai : [];
        const rata  = nilai.length
            ? (nilai.reduce((s, n) => s + parseFloat(n.akhir), 0) / nilai.length).toFixed(1) : '—';
        const lulus = nilai.filter(n => parseFloat(n.akhir) >= 75).length;
        stats = [
            { ikon: 'fa-book',         bg: '#e8f4fd', ic: '#3498db', label: 'Materi Tersedia', val: jmlMateri },
            { ikon: 'fa-chart-line',   bg: '#fef9e7', ic: '#f1c40f', label: 'Rata-rata Nilai', val: rata },
            { ikon: 'fa-gamepad',      bg: '#f5eef8', ic: '#9b59b6', label: 'Kuis Aktif',       val: 1 },
            { ikon: 'fa-check-circle', bg: '#eafaf1', ic: '#2ecc71', label: 'Nilai Lulus',      val: lulus },
        ];
    } else {
        const rekap  = resNilai.ok ? resNilai.rekap : [];
        const lulus  = rekap.filter(r => parseFloat(r.rata) >= 75).length;
        const remidi = rekap.length - lulus;
        stats = [
            { ikon: 'fa-users',        bg: '#e8f4fd', ic: '#3498db', label: 'Total Siswa',  val: rekap.length },
            { ikon: 'fa-book-open',    bg: '#fef9e7', ic: '#f1c40f', label: 'Materi Aktif', val: jmlMateri },
            { ikon: 'fa-check-circle', bg: '#eafaf1', ic: '#2ecc71', label: 'Siswa Lulus',  val: lulus },
            { ikon: 'fa-exclamation',  bg: '#fde8d8', ic: '#e67e22', label: 'Perlu Remidi', val: remidi },
        ];
    }

    const sg = el('stat-grid');
    if (sg) sg.innerHTML = stats.map(s => `
        <div class="stat-kartu">
            <div class="stat-icon" style="background:${s.bg}">
                <i class="fas ${s.ikon}" style="color:${s.ic}"></i>
            </div>
            <div>
                <div class="stat-label">${s.label}</div>
                <div class="stat-value">${s.val}</div>
            </div>
        </div>`).join('');
}

/* ============================================================
   RENDER — MATERI BELAJAR (SISWA)
   ============================================================ */
async function renderMateri() {
    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-book me-2 text-primary"></i>Materi Belajar</h3>
        </div>
        <div class="kartu"><div class="text-center py-5 text-muted">Memuat materi...</div></div>`;

    const res = await api('api/materi?aksi=daftar');
    if (!res.ok) { tampilToast(res.pesan, 'galat'); return; }

    const materi  = res.materi;
    const isSiswa = STATE.user.peran === 'siswa';

    function tombolSiswa(m) {
        return `<a class="btn-aksi primer" href="#" onclick="unduhMateri(${m.id}); return false;" download>
                    <i class="fas fa-download"></i>Unduh
                </a>`;
    }

    const kartu = materi.map(m => `
        <div class="materi-kartu">
            <div class="materi-ikon">
                <i class="fas ${IKON_TIPE[m.tipe] || 'fa-file'}"
                   style="color:${WARNA_TIPE[m.tipe] || '#6c757d'}"></i>
            </div>
            <div class="materi-judul">${m.judul}</div>
            <div class="materi-meta">
                <span class="badge-tipe">${m.tipe}</span>
                <span class="ms-2">${m.ukuran}</span> ·
                <span>${m.tanggal}</span>
            </div>
            <div class="materi-meta" style="margin-top:4px;color:#6c757d;font-size:.78rem">
                <i class="fas fa-chalkboard-teacher me-1"></i>${m.nama_guru || 'Guru'}
            </div>
            ${isSiswa
                ? tombolSiswa(m)
                : `<button class="btn-aksi bahaya" onclick="hapusMateri(${m.id})">
                       <i class="fas fa-trash"></i>Hapus
                   </button>`}
        </div>`).join('');

    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-book me-2 text-primary"></i>Materi Belajar</h3>
            <span class="section-header-sub">${materi.length} materi tersedia</span>
        </div>
        <div class="kartu">
            ${materi.length
                ? `<div class="materi-grid">${kartu}</div>`
                : `<div class="text-center py-5" style="color:#adb5bd">
                       <i class="fas fa-folder-open fa-3x d-block mb-3"></i>
                       Belum ada materi yang tersedia.
                   </div>`}
        </div>`;
}

async function hapusMateri(id) {
    if (!confirm('Hapus materi ini?')) return;
    const fd = new FormData();
    fd.append('id', id);
    const res = await apiForm('api/materi?aksi=hapus', fd);
    if (res.ok) {
        tampilToast('Materi berhasil dihapus.');
        renderMateri();
        renderTabelMateriGuru();
    } else {
        tampilToast(res.pesan, 'galat');
    }
}

/* ============================================================
   RENDER — KUIS KAHOOT!
   ============================================================ */
function renderKuis() {
    const peran = STATE.user.peran;
    const isGuru = peran === 'guru' || peran === 'kepsek';
    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-gamepad me-2 text-primary"></i>
                ${isGuru ? 'Kelola Kuis' : 'Kuis Interaktif'}
            </h3>
        </div>
        <div class="kartu" style="max-width:600px">
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:1.5rem">
                <div style="width:56px;height:56px;background:#7B2FBE;border-radius:14px;
                     display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="fas fa-gamepad" style="color:#fff;font-size:1.5rem"></i>
                </div>
                <div>
                    <h5 class="fw-bold mb-1">Latihan Kuis Interaktif</h5>
                    <p class="text-muted mb-0" style="font-size:.9rem">
                        Platform Kahoot untuk latihan soal yang seru dan menyenangkan
                    </p>
                </div>
            </div>
            <div style="background:#f8f9fa;border-radius:12px;padding:1.25rem;margin-bottom:1.5rem">
                <div style="font-size:.72rem;font-weight:700;color:#6c757d;
                     letter-spacing:.1em;margin-bottom:.5rem">GAME PIN AKTIF</div>
                <div class="pin-display" style="font-size:2.5rem;font-weight:800;
                     color:#7B2FBE;letter-spacing:.15em">740074</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.75rem">
                <a href="https://kahoot.it" target="_blank" rel="noopener noreferrer"
                   style="display:flex;align-items:center;justify-content:center;gap:10px;
                          padding:1rem;background:#7B2FBE;color:#fff;border-radius:12px;
                          text-decoration:none;font-weight:700;font-size:1rem">
                    <i class="fas fa-play-circle"></i>BUKA KAHOOT
                </a>
                ${isGuru ? `
                <a href="https://kahoot.com" target="_blank" rel="noopener noreferrer"
                   style="display:flex;align-items:center;justify-content:center;gap:10px;
                          padding:.85rem;background:#f0e6ff;color:#7B2FBE;border-radius:12px;
                          text-decoration:none;font-weight:600;font-size:.95rem">
                    <i class="fas fa-cog"></i>Kelola Kuis di Kahoot.com
                </a>` : ''}
            </div>
            <div style="margin-top:1.25rem;padding:.75rem;background:#fff8e1;
                 border-radius:8px;font-size:.85rem;color:#856404;display:flex;
                 align-items:flex-start;gap:8px">
                <i class="fas fa-info-circle" style="margin-top:2px;flex-shrink:0"></i>
                <span>Gunakan nama asli saat bergabung agar guru dapat merekap nilai dengan benar.</span>
            </div>
        </div>`;
}

/* ============================================================
   RENDER — NILAI SAYA (SISWA)
   ============================================================ */
async function renderNilai() {
    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-star me-2 text-primary"></i>Nilai Saya</h3>
        </div>
        <div class="kartu"><div class="text-center py-5 text-muted">Memuat nilai...</div></div>`;

    const res = await api('api/nilai?aksi=milik_saya');
    if (!res.ok) { tampilToast(res.pesan, 'galat'); return; }

    const nilai = res.nilai;
    const lulus = nilai.filter(n => parseFloat(n.akhir) >= 75).length;
    const rata  = nilai.length
        ? (nilai.reduce((s, n) => s + parseFloat(n.akhir), 0) / nilai.length).toFixed(1) : 0;

    const baris = nilai.map(n => {
        const ok    = parseFloat(n.akhir) >= 75;
        const warna = ok ? '#2ecc71' : '#e67e22';
        return `<tr>
            <td class="fw-semibold">${n.mapel}</td>
            <td class="text-center">${n.tugas}</td>
            <td class="text-center">${n.uts}</td>
            <td class="text-center">${n.uas}</td>
            <td>
                <div class="nilai-bar-wrap">
                    <div class="nilai-bar-bg">
                        <div class="nilai-bar" style="width:${n.akhir}%;background:${warna}"></div>
                    </div>
                    <span class="fw-bold" style="min-width:28px">${n.akhir}</span>
                </div>
            </td>
            <td class="text-center">
                <span class="${ok ? 'badge-lulus' : 'badge-remidi'}">${ok ? 'Lulus' : 'Remidi'}</span>
            </td>
        </tr>`;
    }).join('');

    el('dynamic-content').innerHTML = nilai.length ? `
        <div class="section-header">
            <h3><i class="fas fa-star me-2 text-primary"></i>Nilai Saya</h3>
            <a class="btn-aksi primer" href="api/nilai?aksi=download_siswa" download>
                <i class="fas fa-download"></i>Unduh Nilai
            </a>
        </div>
        <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#e8f4fd">
                    <i class="fas fa-chart-bar" style="color:#3498db"></i>
                </div>
                <div><div class="stat-label">Rata-rata</div><div class="stat-value">${rata}</div></div>
            </div>
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#eafaf1">
                    <i class="fas fa-check-circle" style="color:#2ecc71"></i>
                </div>
                <div><div class="stat-label">Lulus</div><div class="stat-value">${lulus} / ${nilai.length}</div></div>
            </div>
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#fde8d8">
                    <i class="fas fa-exclamation" style="color:#e67e22"></i>
                </div>
                <div><div class="stat-label">Remidi</div><div class="stat-value">${nilai.length - lulus}</div></div>
            </div>
        </div>
        <div class="kartu">
            <div class="tabel-wrapper">
                <table class="tabel">
                    <thead><tr>
                        <th>Mata Pelajaran</th>
                        <th class="text-center">Tugas</th>
                        <th class="text-center">UTS</th>
                        <th class="text-center">UAS</th>
                        <th>Nilai Akhir</th>
                        <th class="text-center">Status</th>
                    </tr></thead>
                    <tbody>${baris}</tbody>
                </table>
            </div>
        </div>`
    : `<div class="section-header">
            <h3><i class="fas fa-star me-2 text-primary"></i>Nilai Saya</h3>
       </div>
       <div class="kartu text-center py-5" style="color:#adb5bd">
            <i class="fas fa-inbox fa-3x d-block mb-3"></i>
            Nilai belum tersedia. Hubungi guru untuk informasi lebih lanjut.
       </div>`;
}

/* ============================================================
   RENDER — UPLOAD MATERI (GURU)
   ============================================================ */
let _fileDipilih = null;

function renderUpload() {
    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-upload me-2 text-primary"></i>Unggah Materi</h3>
        </div>
        <div class="kartu" style="max-width:700px">
            <h6 class="fw-bold mb-4" style="color:#0d6efd;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase">
                <i class="fas fa-info-circle me-2"></i>Informasi Materi
            </h6>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
                <div>
                    <label class="form-label fw-semibold small">Judul Materi *</label>
                    <input type="text" id="inp-judul" class="form-control"
                           placeholder="Contoh: Matematika — Pecahan">
                </div>
                <div>
                    <label class="form-label fw-semibold small">Mata Pelajaran *</label>
                    <select id="inp-mapel" class="form-select">
                        <option value="">Pilih mata pelajaran...</option>
                        ${DAFTAR_MAPEL.map(m => `<option>${m}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div style="margin-bottom:1.25rem">
                <label class="form-label fw-semibold small">Kelas</label>
                <select id="inp-kelas" class="form-select" style="max-width:200px">
                    <option>V A</option><option>V B</option>
                </select>
            </div>
            <div class="upload-zone" id="upload-zone"
                 onclick="el('fileInput').click()"
                 ondragover="dragMasuk(event)"
                 ondragleave="dragKeluar()"
                 ondrop="dropFile(event)"
                 style="margin-bottom:1rem">
                <div class="upload-zone-ikon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="upload-zone-judul">Klik atau seret file ke sini</div>
                <div class="upload-zone-sub">PDF, PPT, Word, Video · Maks. 50 MB</div>
                <div class="upload-nama-file" id="nama-file"></div>
            </div>
            <input type="file" id="fileInput" class="d-none"
                   accept=".pdf,.ppt,.pptx,.mp4,.avi,.mkv,.doc,.docx"
                   onchange="pilihFile(this)">
            <button class="btn-simpan" onclick="prosesUpload()" style="width:100%">
                <i class="fas fa-cloud-upload-alt me-2"></i>Simpan & Unggah Materi
            </button>
            <div class="progress-wrap" id="progress-wrap" style="display:none;margin-top:.75rem">
                <div class="progress-bg">
                    <div class="progress-bar-fill" id="progress-bar"></div>
                </div>
                <div class="progress-status" id="progress-status">Mengunggah...</div>
            </div>
        </div>
        <div class="kartu">
            <h6 class="fw-bold mb-3">Daftar Materi Tersimpan</h6>
            <div id="tabel-materi-guru"><div class="text-center py-3 text-muted">Memuat...</div></div>
        </div>`;

    _fileDipilih = null;
    renderTabelMateriGuru();
}

function pilihFile(input) {
    const file   = input.files[0] || null;
    _fileDipilih = file;
    el('nama-file').textContent = file ? `📎 ${file.name}` : '';
}

function dragMasuk(e) { e.preventDefault(); el('upload-zone').classList.add('drag-aktif'); }
function dragKeluar() { el('upload-zone').classList.remove('drag-aktif'); }
function dropFile(e) {
    e.preventDefault();
    dragKeluar();
    const f = e.dataTransfer?.files[0];
    if (f) { _fileDipilih = f; el('nama-file').textContent = `📎 ${f.name}`; }
}

async function prosesUpload() {
    const judul = el('inp-judul')?.value?.trim();
    const mapel = el('inp-mapel')?.value;
    const kelas = el('inp-kelas')?.value || 'V A';
    const file  = _fileDipilih;

    if (!judul) { tampilToast('Mohon isi judul materi.', 'galat'); return; }
    if (!mapel) { tampilToast('Mohon pilih mata pelajaran.', 'galat'); return; }
    if (!file)  { tampilToast('Pilih file terlebih dahulu.', 'galat'); return; }

    const wrap = el('progress-wrap');
    const bar  = el('progress-bar');
    const sts  = el('progress-status');
    wrap.style.display = 'block';
    bar.style.width = '30%';
    sts.textContent = 'Mengunggah ke server...';
    sts.style.color = '#6c757d';

    const fd = new FormData();
    fd.append('judul', judul + (mapel ? ` — ${mapel}` : ''));
    fd.append('kelas', kelas);
    fd.append('file', file);

    // Simulasi progress
    let pct = 30;
    const timer = setInterval(() => {
        pct = Math.min(pct + 5, 90);
        bar.style.width = pct + '%';
    }, 200);

    const res = await apiForm('api/materi?aksi=upload', fd);
    clearInterval(timer);
    bar.style.width = '100%';

    if (res.ok) {
        sts.textContent = '✅ Materi berhasil diunggah!';
        sts.style.color = '#2ecc71';
        tampilToast(`Materi "${judul}" berhasil disimpan!`, 'sukses');
        el('inp-judul').value = '';
        el('inp-mapel').value = '';
        el('nama-file').textContent = '';
        el('fileInput').value = '';
        _fileDipilih = null;
        renderTabelMateriGuru();
    } else {
        sts.textContent = '⚠️ ' + (res.pesan || 'Upload gagal.');
        sts.style.color = '#e74c3c';
        tampilToast(res.pesan || 'Upload gagal.', 'galat');
    }

    setTimeout(() => { wrap.style.display = 'none'; bar.style.width = '0%'; }, 2500);
}

async function renderTabelMateriGuru() {
    const target = el('tabel-materi-guru');
    if (!target) return;

    const res = await api('api/materi?aksi=daftar');
    if (!res.ok) { target.innerHTML = `<div class="text-center py-3 text-danger">${res.pesan}</div>`; return; }

    const materi = res.materi;
    if (!materi.length) {
        target.innerHTML = `<div class="text-center py-4" style="color:#adb5bd">Belum ada materi yang diunggah.</div>`;
        return;
    }

    const baris = materi.map((m, i) => `
        <tr>
            <td class="text-muted">${i + 1}</td>
            <td class="fw-semibold">
                <i class="fas ${IKON_TIPE[m.tipe] || 'fa-file'}"
                   style="color:${WARNA_TIPE[m.tipe] || '#6c757d'};margin-right:8px"></i>
                ${m.judul}
            </td>
            <td><span class="badge-tipe">${m.tipe}</span></td>
            <td class="text-muted">${m.ukuran}</td>
            <td class="text-muted">${m.tanggal}</td>
            <td>
                <span style="color:#2ecc71;font-size:.8rem;font-weight:600">
                    <i class="fas fa-check-circle me-1"></i>Tersedia
                </span>
            </td>
            <td>
                <div class="d-flex gap-2">
                    <a class="btn-aksi abu btn-aksi-sm" href="#" onclick="unduhMateri(${m.id}); return false;" download
                       title="Download file ini">
                        <i class="fas fa-download"></i>Lihat
                    </a>
                    <button class="btn-aksi bahaya btn-aksi-sm" onclick="hapusMateriGuru(${m.id})">
                        <i class="fas fa-trash"></i>Hapus
                    </button>
                </div>
            </td>
        </tr>`).join('');

    target.innerHTML = `
        <div class="tabel-wrapper">
            <table class="tabel">
                <thead><tr>
                    <th>#</th><th>Judul Materi</th><th>Tipe</th>
                    <th>Ukuran</th><th>Tanggal</th><th>Status</th><th>Aksi</th>
                </tr></thead>
                <tbody>${baris}</tbody>
            </table>
        </div>`;
}

async function hapusMateriGuru(id) {
    if (!confirm('Hapus materi ini?')) return;
    const fd = new FormData();
    fd.append('id', id);
    const res = await apiForm('api/materi?aksi=hapus', fd);
    if (res.ok) { tampilToast('Materi berhasil dihapus.'); renderTabelMateriGuru(); }
    else tampilToast(res.pesan, 'galat');
}

/* ============================================================
   RENDER — REKAP NILAI (GURU)
   ============================================================ */
async function renderRekap() {
    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-chart-bar me-2 text-primary"></i>Rekap Nilai Siswa</h3>
        </div>
        <div class="kartu"><div class="text-center py-5 text-muted">Memuat rekap...</div></div>`;

    const res = await api('api/nilai?aksi=rekap');
    if (!res.ok) { tampilToast(res.pesan, 'galat'); return; }

    // Filter: wali kelas hanya tampilkan siswa kelasnya sendiri
    const u = STATE.user;
    let rekap = res.rekap;
    if (u.peran === 'guru' && u.mapel) {
        // Ambil kelas dari mapel guru, contoh "Wali Kelas V A" -> "V A"
        const kelasGuru = u.mapel.replace('Wali Kelas', '').trim();
        if (kelasGuru) rekap = rekap.filter(r => r.kelas === kelasGuru);
    }
    const lulus  = rekap.filter(r => parseFloat(r.rata || 0) >= 75).length;
    const remidi = rekap.length - lulus;
    const rataK  = rekap.length
        ? (rekap.reduce((s, r) => s + parseFloat(r.rata || 0), 0) / rekap.length).toFixed(1) : 0;

    const baris = rekap.map((r, i) => {
        const ok = parseFloat(r.rata || 0) >= 75;
        return `<tr>
            <td class="text-muted">${i + 1}</td>
            <td class="text-muted" style="font-size:.82rem">${r.nisn}</td>
            <td class="fw-semibold">${r.nama}</td>
            <td>${r.kelas}</td>
            <td>
                <div class="nilai-bar-wrap">
                    <div class="nilai-bar-bg">
                        <div class="nilai-bar"
                             style="width:${r.rata || 0}%;background:${ok ? '#2ecc71' : '#e67e22'}">
                        </div>
                    </div>
                    <span class="fw-bold" style="min-width:32px">${r.rata || '—'}</span>
                </div>
            </td>
            <td class="text-center">
                <span class="${ok ? 'badge-lulus' : 'badge-remidi'}">${ok ? 'Lulus' : 'Remidi'}</span>
            </td>
            <td>
                <button class="btn-aksi primer btn-aksi-sm" onclick="bukaModalNilai(${r.id})">
                    <i class="fas fa-pen-to-square"></i>Kelola
                </button>
            </td>
        </tr>`;
    }).join('');

    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-chart-bar me-2 text-primary"></i>Rekap Nilai Siswa</h3>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn-aksi primer" onclick="bukaModalNilai(null)">
                    <i class="fas fa-plus"></i>Input Nilai
                </button>
                <a class="btn-aksi abu" href="api/nilai?aksi=export_csv" download>
                    <i class="fas fa-download"></i>Export CSV
                </a>
            </div>
        </div>
        <div class="stat-grid">
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#e8f4fd"><i class="fas fa-users" style="color:#3498db"></i></div>
                <div><div class="stat-label">Total Siswa</div><div class="stat-value">${rekap.length}</div></div>
            </div>
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#eafaf1"><i class="fas fa-check-circle" style="color:#2ecc71"></i></div>
                <div><div class="stat-label">Lulus</div><div class="stat-value">${lulus}</div></div>
            </div>
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#fde8d8"><i class="fas fa-exclamation" style="color:#e67e22"></i></div>
                <div><div class="stat-label">Remidi</div><div class="stat-value">${remidi}</div></div>
            </div>
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#f5eef8"><i class="fas fa-chart-line" style="color:#9b59b6"></i></div>
                <div><div class="stat-label">Rata-rata Kelas</div><div class="stat-value">${rataK}</div></div>
            </div>
        </div>
        <div class="kartu">
            <div class="tabel-wrapper">
                <table class="tabel">
                    <thead><tr>
                        <th>#</th><th>NISN</th><th>Nama Siswa</th>
                        <th>Kelas</th><th>Rata-rata</th>
                        <th class="text-center">Status</th><th class="text-center">Aksi</th>
                    </tr></thead>
                    <tbody id="tbody-rekap">${baris}</tbody>
                </table>
            </div>
        </div>
        ${_templateModalNilai(rekap)}`;

    _pasangEventModal();
}

/* ============================================================
   MODAL NILAI
   ============================================================ */
function _templateModalNilai(rekap) {
    const opsiSiswa = rekap.map(r =>
        `<option value="${r.id}">${r.nama} — Kelas ${r.kelas}</option>`).join('');
    const opsiMapel = DAFTAR_MAPEL.map(m => `<option value="${m}">${m}</option>`).join('');
    return `
    <div id="modal-overlay" class="modal-overlay d-none" onclick="_klikLuarModal(event)">
        <div class="modal-box" role="dialog" aria-modal="true" style="max-width:480px;width:95%">
            <div class="modal-header-custom" style="padding:1rem 1.25rem;border-bottom:1px solid #e9ecef">
                <h5 class="modal-title-custom" style="font-size:1rem;margin:0;display:flex;align-items:center;gap:8px">
                    <span style="width:32px;height:32px;background:#e8f4fd;border-radius:8px;
                          display:flex;align-items:center;justify-content:center">
                        <i class="fas fa-pen-to-square" style="color:#0d6efd;font-size:.85rem"></i>
                    </span>
                    <span id="modal-judul-teks">Input Nilai Siswa</span>
                </h5>
                <button class="modal-close-btn" onclick="tutupModalNilai()" aria-label="Tutup"
                        style="width:32px;height:32px;border-radius:8px;border:1px solid #dee2e6;
                               background:#fff;display:flex;align-items:center;justify-content:center">
                    <i class="fas fa-times" style="font-size:.85rem;color:#6c757d"></i>
                </button>
            </div>
            <div class="modal-body-custom" style="padding:1.25rem">
                <div class="mb-3" id="wrap-pilih-siswa">
                    <label class="form-label fw-semibold small">SISWA *</label>
                    <select id="modal-siswa" class="form-select">
                        <option value="">— Pilih Siswa —</option>${opsiSiswa}
                    </select>
                </div>
                <div class="mb-3 d-none" id="wrap-nama-siswa">
                    <label class="form-label fw-semibold small">SISWA</label>
                    <input type="text" id="modal-nama-siswa" class="form-control" readonly
                           style="background:#f8f9fa;font-weight:600">
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold small">MATA PELAJARAN *</label>
                    <select id="modal-mapel" class="form-select">
                        <option value="">— Pilih Mata Pelajaran —</option>${opsiMapel}
                    </select>
                </div>
                <div style="background:#f8f9fa;border-radius:10px;padding:1rem;margin-bottom:.75rem">
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem;margin-bottom:.75rem">
                        <div>
                            <label class="form-label fw-semibold small">TUGAS *</label>
                            <input type="number" id="modal-tugas" class="form-control text-center fw-bold"
                                   placeholder="0–100" min="0" max="100"
                                   oninput="if(this.value>100)this.value=100;if(this.value<0)this.value=0;_hitungNilaiAkhir()"
                                   style="font-size:1.1rem">
                            <div style="font-size:.7rem;color:#6c757d;text-align:center;margin-top:3px">bobot 30%</div>
                        </div>
                        <div>
                            <label class="form-label fw-semibold small">UTS *</label>
                            <input type="number" id="modal-uts" class="form-control text-center fw-bold"
                                   placeholder="0–100" min="0" max="100"
                                   oninput="if(this.value>100)this.value=100;if(this.value<0)this.value=0;_hitungNilaiAkhir()"
                                   style="font-size:1.1rem">
                            <div style="font-size:.7rem;color:#6c757d;text-align:center;margin-top:3px">bobot 30%</div>
                        </div>
                        <div>
                            <label class="form-label fw-semibold small">UAS *</label>
                            <input type="number" id="modal-uas" class="form-control text-center fw-bold"
                                   placeholder="0–100" min="0" max="100"
                                   oninput="if(this.value>100)this.value=100;if(this.value<0)this.value=0;_hitungNilaiAkhir()"
                                   style="font-size:1.1rem">
                            <div style="font-size:.7rem;color:#6c757d;text-align:center;margin-top:3px">bobot 40%</div>
                        </div>
                    </div>
                    <div style="background:#fff;border-radius:8px;padding:.75rem;
                                display:flex;align-items:center;justify-content:space-between">
                        <div style="font-size:.8rem;color:#6c757d;font-weight:600">NILAI AKHIR</div>
                        <div style="display:flex;align-items:center;gap:8px">
                            <span id="nilai-akhir-angka" style="font-size:1.5rem;font-weight:800;color:#0d6efd">—</span>
                            <span id="nilai-akhir-status" class="nilai-akhir-badge"></span>
                        </div>
                    </div>
                </div>
                <div class="form-text">
                    <i class="fas fa-calculator text-primary me-1"></i>
                    Nilai akhir = (Tugas×30% + UTS×30% + UAS×40%) · KKM: 75
                </div>
            </div>
            <div class="modal-footer-custom">
                <button class="btn-aksi abu" onclick="tutupModalNilai()"><i class="fas fa-times me-1"></i>Batal</button>
                <button class="btn-aksi primer" id="btn-simpan-nilai" onclick="simpanNilai()">
                    <i class="fas fa-save me-1"></i>Simpan Nilai
                </button>
            </div>
        </div>
    </div>
    <div id="panel-detail-nilai" class="d-none">
        <div class="kartu mt-1" id="isi-panel-detail"></div>
    </div>`;
}

let _modalKeyListener = null;
function _pasangEventModal() {
    if (_modalKeyListener) document.removeEventListener('keydown', _modalKeyListener);
    _modalKeyListener = e => { if (e.key === 'Escape') tutupModalNilai(); };
    document.addEventListener('keydown', _modalKeyListener);
}
function _klikLuarModal(e) { if (e.target === el('modal-overlay')) tutupModalNilai(); }

function _hitungNilaiAkhir() {
    // Auto clamp 0-100
    ["modal-tugas","modal-uts","modal-uas"].forEach(id => {
        const inp = el(id); if (!inp || inp.value === "") return;
        let v = parseFloat(inp.value);
        if (v > 100) { inp.value = 100; v = 100; }
        if (v < 0)   { inp.value = 0;   v = 0; }
    });
    const t = parseFloat(el("modal-tugas")?.value);
    const u = parseFloat(el("modal-uts")?.value);
    const a = parseFloat(el("modal-uas")?.value);
    const angkaEl  = el('nilai-akhir-angka');
    const statusEl = el('nilai-akhir-status');
    if (!angkaEl) return;
    if (isNaN(t) || isNaN(u) || isNaN(a)) {
        angkaEl.textContent = '—'; statusEl.textContent = ''; statusEl.className = 'nilai-akhir-badge';
        return;
    }
    const akhir = +((t * 0.3) + (u * 0.3) + (a * 0.4)).toFixed(1);
    angkaEl.textContent  = akhir;
    statusEl.textContent = akhir >= 75 ? 'Lulus' : 'Remidi';
    statusEl.className   = `nilai-akhir-badge ${akhir >= 75 ? 'lulus' : 'remidi'}`;
}

async function bukaModalNilai(idSiswa) {
    STATE.modalNilai = { buka: true, mode: 'tambah', idSiswa, idNilai: null };
    const overlay = el('modal-overlay');
    if (!overlay) return;
    _resetFormModal();

    if (idSiswa) {
        // Cari nama siswa dari tabel rekap
        const row = document.querySelector(`#tbody-rekap button[onclick="bukaModalNilai(${idSiswa})"]`);
        const nama = row?.closest('tr')?.querySelector('td:nth-child(3)')?.textContent || '';
        el('modal-judul-teks').textContent = `Input Nilai — ${nama}`;
        el('wrap-pilih-siswa').classList.add('d-none');
        el('wrap-nama-siswa').classList.remove('d-none');
        el('modal-nama-siswa').value = nama;
        await _tampilPanelDetailNilai(idSiswa);
    } else {
        el('modal-judul-teks').textContent = 'Input Nilai Siswa';
        el('wrap-pilih-siswa').classList.remove('d-none');
        el('wrap-nama-siswa').classList.add('d-none');
        el('panel-detail-nilai')?.classList.add('d-none');
    }

    el('btn-simpan-nilai').innerHTML = '<i class="fas fa-save me-1"></i>Simpan Nilai';
    el('btn-simpan-nilai').onclick = () => simpanNilai();
    overlay.classList.remove('d-none');
    setTimeout(() => overlay.classList.add('tampil'), 10);
}

function tutupModalNilai() {
    const overlay = el('modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('tampil');
    setTimeout(() => overlay.classList.add('d-none'), 200);
}

function _resetFormModal() {
    ['modal-siswa','modal-mapel','modal-tugas','modal-uts','modal-uas'].forEach(id => {
        const e = el(id); if (e) e.value = '';
    });
    const a = el('nilai-akhir-angka');
    const s = el('nilai-akhir-status');
    if (a) a.textContent = '—';
    if (s) { s.textContent = ''; s.className = 'nilai-akhir-badge'; }
}

async function _tampilPanelDetailNilai(idSiswa) {
    const panel = el('panel-detail-nilai');
    const isi   = el('isi-panel-detail');
    if (!panel || !isi) return;

    isi.innerHTML = '<div class="text-center py-3 text-muted">Memuat nilai...</div>';
    panel.classList.remove('d-none');

    const res = await api(`php/nilai.php?aksi=detail&id_siswa=${idSiswa}`);
    if (!res.ok) { isi.innerHTML = `<div class="text-danger">${res.pesan}</div>`; return; }

    const nilai = res.nilai;
    const nama  = res.siswa?.nama || '';

    if (!nilai.length) {
        isi.innerHTML = `<div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold mb-0">Nilai ${nama}</h6></div>
            <div class="text-center py-4" style="color:#adb5bd">
                <i class="fas fa-inbox fa-2x d-block mb-2"></i>
                Belum ada nilai. Gunakan form di atas untuk menambahkan.
            </div>`;
        return;
    }

    const baris = nilai.map(n => {
        const ok = parseFloat(n.akhir) >= 75;
        return `<tr>
            <td class="fw-semibold">${n.mapel}</td>
            <td class="text-center">${n.tugas}</td>
            <td class="text-center">${n.uts}</td>
            <td class="text-center">${n.uas}</td>
            <td>
                <div class="nilai-bar-wrap">
                    <div class="nilai-bar-bg">
                        <div class="nilai-bar" style="width:${n.akhir}%;background:${ok?'#2ecc71':'#e67e22'}"></div>
                    </div>
                    <span class="fw-bold">${n.akhir}</span>
                </div>
            </td>
            <td class="text-center"><span class="${ok?'badge-lulus':'badge-remidi'}">${ok?'Lulus':'Remidi'}</span></td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn-aksi abu btn-aksi-sm" onclick="editNilai(${idSiswa},${n.id})">
                        <i class="fas fa-pencil"></i>Edit
                    </button>
                    <button class="btn-aksi bahaya btn-aksi-sm" onclick="hapusNilai(${idSiswa},${n.id},'${n.mapel}')">
                        <i class="fas fa-trash"></i>Hapus
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    isi.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold mb-0"><i class="fas fa-list me-2 text-primary"></i>Nilai ${nama}</h6>
            <span class="text-muted" style="font-size:.8rem">${nilai.length} mata pelajaran</span>
        </div>
        <div class="tabel-wrapper">
            <table class="tabel">
                <thead><tr>
                    <th>Mata Pelajaran</th>
                    <th class="text-center">Tugas</th><th class="text-center">UTS</th>
                    <th class="text-center">UAS</th><th>Nilai Akhir</th>
                    <th class="text-center">Status</th><th class="text-center">Aksi</th>
                </tr></thead>
                <tbody>${baris}</tbody>
            </table>
        </div>`;
}

async function simpanNilai() {
    const idSiswa = STATE.modalNilai.idSiswa || parseInt(el('modal-siswa')?.value);
    if (!idSiswa) { tampilToast('Pilih siswa terlebih dahulu.', 'galat'); return; }
    const mapel = el('modal-mapel')?.value?.trim();
    if (!mapel)  { tampilToast('Pilih mata pelajaran.', 'galat'); return; }
    const tugas = parseFloat(el('modal-tugas')?.value);
    const uts   = parseFloat(el('modal-uts')?.value);
    const uas   = parseFloat(el('modal-uas')?.value);
    if (isNaN(tugas) || isNaN(uts) || isNaN(uas)) { tampilToast('Semua nilai harus diisi.', 'galat'); return; }
    if ([tugas,uts,uas].some(v => v < 0 || v > 100)) { tampilToast('Nilai harus antara 0–100.', 'galat'); return; }
    // Clamp values
    ['modal-tugas','modal-uts','modal-uas'].forEach(id => {
        const inp = el(id); if (!inp) return;
        let v = parseFloat(inp.value);
        if (v > 100) inp.value = 100;
        if (v < 0)   inp.value = 0;
    });

    const res = await apiJSON('api/nilai?aksi=tambah', { id_siswa: idSiswa, mapel, tugas, uts, uas });
    if (!res.ok) { tampilToast(res.pesan, 'galat'); return; }
    tampilToast(`Nilai ${mapel} berhasil disimpan!`, 'sukses');
    _resetFormModal();
    await _tampilPanelDetailNilai(idSiswa);
    // Refresh tabel rekap di background
    const resRekap = await api('api/nilai?aksi=rekap');
    if (resRekap.ok) _refreshTabelRekap(resRekap.rekap);
}

async function editNilai(idSiswa, idNilai) {
    STATE.modalNilai = { buka: true, mode: 'edit', idSiswa, idNilai };
    const res = await api(`php/nilai.php?aksi=detail&id_siswa=${idSiswa}`);
    if (!res.ok) return;
    const entri = res.nilai.find(n => n.id == idNilai);
    if (!entri) return;

    el('modal-judul-teks').textContent = `Edit Nilai — ${res.siswa?.nama || ''}`;
    el('wrap-pilih-siswa').classList.add('d-none');
    el('wrap-nama-siswa').classList.remove('d-none');
    el('modal-nama-siswa').value = res.siswa?.nama || '';
    el('modal-mapel').value = entri.mapel;
    el('modal-tugas').value = entri.tugas;
    el('modal-uts').value   = entri.uts;
    el('modal-uas').value   = entri.uas;
    _hitungNilaiAkhir();

    el('btn-simpan-nilai').innerHTML = '<i class="fas fa-sync me-1"></i>Update Nilai';
    el('btn-simpan-nilai').onclick   = () => updateNilai();
    const overlay = el('modal-overlay');
    overlay?.classList.remove('d-none');
    setTimeout(() => overlay?.classList.add('tampil'), 10);
}

async function updateNilai() {
    const { idSiswa, idNilai } = STATE.modalNilai;
    const mapel = el('modal-mapel')?.value?.trim();
    const tugas = parseFloat(el('modal-tugas')?.value);
    const uts   = parseFloat(el('modal-uts')?.value);
    const uas   = parseFloat(el('modal-uas')?.value);
    if (!mapel || isNaN(tugas) || isNaN(uts) || isNaN(uas)) { tampilToast('Lengkapi semua data.', 'galat'); return; }

    const res = await apiJSON('api/nilai?aksi=edit', { id: idNilai, tugas, uts, uas });
    if (!res.ok) { tampilToast(res.pesan, 'galat'); return; }
    tampilToast(`Nilai ${mapel} berhasil diperbarui!`, 'sukses');
    el('btn-simpan-nilai').innerHTML = '<i class="fas fa-save me-1"></i>Simpan Nilai';
    el('btn-simpan-nilai').onclick   = () => simpanNilai();
    STATE.modalNilai = { ...STATE.modalNilai, mode: 'tambah', idNilai: null };
    _resetFormModal();
    await _tampilPanelDetailNilai(idSiswa);
    const resRekap = await api('api/nilai?aksi=rekap');
    if (resRekap.ok) _refreshTabelRekap(resRekap.rekap);
}

async function hapusNilai(idSiswa, idNilai, mapel) {
    if (!confirm(`Hapus nilai ${mapel}?\nTindakan ini tidak dapat dibatalkan.`)) return;
    const res = await apiJSON('api/nilai?aksi=hapus', { id: idNilai });
    if (!res.ok) { tampilToast(res.pesan, 'galat'); return; }
    tampilToast(`Nilai ${mapel} berhasil dihapus.`, 'sukses');
    await _tampilPanelDetailNilai(idSiswa);
    const resRekap = await api('api/nilai?aksi=rekap');
    if (resRekap.ok) _refreshTabelRekap(resRekap.rekap);
}

function _refreshTabelRekap(rekap) {
    const tbody = el('tbody-rekap');
    if (!tbody) return;
    tbody.innerHTML = rekap.map((r, i) => {
        const ok = parseFloat(r.rata || 0) >= 75;
        return `<tr>
            <td class="text-muted">${i + 1}</td>
            <td class="text-muted" style="font-size:.82rem">${r.nisn}</td>
            <td class="fw-semibold">${r.nama}</td>
            <td>${r.kelas}</td>
            <td>
                <div class="nilai-bar-wrap">
                    <div class="nilai-bar-bg">
                        <div class="nilai-bar" style="width:${r.rata||0}%;background:${ok?'#2ecc71':'#e67e22'}"></div>
                    </div>
                    <span class="fw-bold">${r.rata||'—'}</span>
                </div>
            </td>
            <td class="text-center"><span class="${ok?'badge-lulus':'badge-remidi'}">${ok?'Lulus':'Remidi'}</span></td>
            <td>
                <button class="btn-aksi primer btn-aksi-sm" onclick="bukaModalNilai(${r.id})">
                    <i class="fas fa-pen-to-square"></i>Kelola
                </button>
            </td>
        </tr>`;
    }).join('');
}

/* ============================================================
   RENDER — EDIT PROFIL
   ============================================================ */
async function renderProfil() {
    const u = STATE.user;
    const labelID    = u.peran === 'siswa' ? 'NISN' : 'NIP';
    const nilaiID    = u.peran === 'siswa' ? (u.nisn||'') : (u.nip||'');
    const labelExtra = u.peran === 'siswa' ? 'Kelas' : u.peran === 'kepsek' ? 'Jabatan' : 'Wali Kelas';
    const nilaiExtra = u.peran === 'siswa' ? (u.kelas||'') : u.peran === 'kepsek' ? 'Kepala Sekolah' : (u.mapel||'');
    const roleLabel  = u.peran === 'siswa' ? `Siswa · Kelas ${u.kelas}` : u.peran === 'kepsek' ? 'Kepala Sekolah' : `Guru · ${u.mapel}`;
    const warnaBadge = u.peran === 'siswa' ? '#27ae60' : u.peran === 'kepsek' ? '#8e44ad' : '#2980b9';

    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-user-edit me-2 text-primary"></i>Edit Profil</h3>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;max-width:800px">

            <!-- KARTU KIRI: Foto & Info -->
            <div class="kartu" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:2rem">
                <div style="position:relative;margin-bottom:1rem">
                    <img src="${fotoSrc(u.foto, u.nama)}" id="profil-avatar"
                         style="width:100px;height:100px;border-radius:50%;object-fit:cover;
                                border:3px solid #e8f4fd;box-shadow:0 2px 12px rgba(0,0,0,.1)"
                         onerror="this.src='${urlAvatar(u.nama)}'">
                    <label for="foto-input"
                           style="position:absolute;bottom:2px;right:2px;width:28px;height:28px;
                                  background:#0d6efd;color:#fff;border-radius:50%;display:flex;
                                  align-items:center;justify-content:center;cursor:pointer;
                                  font-size:.7rem;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2)"
                           title="Ganti foto profil">
                        <i class="fas fa-camera"></i>
                    </label>
                    <input type="file" id="foto-input" class="d-none" accept="image/jpeg,image/png,image/webp"
                           onchange="uploadFoto(this)">
                </div>
                <div id="foto-loading" class="d-none" style="font-size:.8rem;color:#0d6efd;margin-bottom:.5rem">
                    <i class="fas fa-spinner fa-spin me-1"></i>Mengupload foto...
                </div>
                <h5 class="fw-bold mb-1" id="profil-nama-tampil">${u.nama}</h5>
                <span style="background:${warnaBadge}1A;color:${warnaBadge};padding:3px 14px;
                             border-radius:999px;font-size:.75rem;font-weight:600;margin-bottom:1rem">
                    ${roleLabel}
                </span>
                <div style="width:100%;background:#f8f9fa;border-radius:10px;padding:1rem;text-align:left">
                    <div style="font-size:.72rem;color:#6c757d;font-weight:600;margin-bottom:.5rem">INFO AKUN</div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:.35rem;font-size:.85rem">
                        <span style="color:#6c757d">${labelID}</span>
                        <span class="fw-semibold">${nilaiID || '—'}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:.85rem">
                        <span style="color:#6c757d">${labelExtra}</span>
                        <span class="fw-semibold">${nilaiExtra || '—'}</span>
                    </div>
                </div>
                <button onclick="el('foto-input').click()"
                        style="margin-top:1rem;width:100%;padding:.6rem;background:#f0f4ff;
                               color:#0d6efd;border:1px solid #c7d9ff;border-radius:8px;
                               font-size:.85rem;font-weight:600;cursor:pointer">
                    <i class="fas fa-camera me-2"></i>Ganti Foto Profil
                </button>
            </div>

            <!-- KARTU KANAN: Form Edit -->
            <div style="display:flex;flex-direction:column;gap:1rem">

                <!-- Section: Informasi Dasar -->
                <div class="kartu">
                    <div style="font-size:.72rem;font-weight:700;color:#0d6efd;
                                letter-spacing:.08em;text-transform:uppercase;margin-bottom:1rem">
                        <i class="fas fa-user me-2"></i>Informasi Dasar
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Nama Lengkap</label>
                        <input type="text" class="form-control" id="input-nama-baru"
                               value="${u.nama}" placeholder="Masukkan nama lengkap">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">${labelID}</label>
                        <input type="text" class="form-control" id="input-id-baru"
                               value="${nilaiID}" placeholder="Masukkan ${labelID}">
                        <div class="form-text" style="color:#e67e22">
                            <i class="fas fa-exclamation-triangle me-1"></i>
                            Ubah ${labelID} hanya jika ada kesalahan data.
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">${labelExtra}</label>
                        <input type="text" class="form-control" value="${nilaiExtra}"
                               disabled style="background:#f8f9fa;color:#6c757d">
                    </div>
                    <button class="btn-simpan" onclick="simpanProfil()" style="width:100%">
                        <i class="fas fa-save me-2"></i>Simpan Perubahan
                    </button>
                </div>

                <!-- Section: Keamanan -->
                <div class="kartu">
                    <div style="font-size:.72rem;font-weight:700;color:#e74c3c;
                                letter-spacing:.08em;text-transform:uppercase;margin-bottom:1rem">
                        <i class="fas fa-lock me-2"></i>Keamanan Akun
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Kata Sandi Lama</label>
                        <div style="position:relative">
                            <input type="password" class="form-control" id="sandi-lama"
                                   placeholder="Masukkan kata sandi lama"
                                   style="padding-right:2.5rem">
                            <button onclick="toggleSandiField('sandi-lama','eye-lama')"
                                    type="button"
                                    style="position:absolute;right:.75rem;top:50%;transform:translateY(-50%);
                                           background:none;border:none;color:#6c757d;cursor:pointer;padding:0">
                                <i class="fas fa-eye" id="eye-lama"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Kata Sandi Baru</label>
                        <div style="position:relative">
                            <input type="password" class="form-control" id="sandi-baru"
                                   placeholder="Minimal 6 karakter"
                                   style="padding-right:2.5rem">
                            <button onclick="toggleSandiField('sandi-baru','eye-baru')"
                                    type="button"
                                    style="position:absolute;right:.75rem;top:50%;transform:translateY(-50%);
                                           background:none;border:none;color:#6c757d;cursor:pointer;padding:0">
                                <i class="fas fa-eye" id="eye-baru"></i>
                            </button>
                        </div>
                    </div>
                    <button onclick="gantiSandi()"
                            style="width:100%;padding:.75rem;background:#fff0f0;color:#e74c3c;
                                   border:1px solid #ffc0c0;border-radius:10px;font-weight:600;
                                   cursor:pointer;font-size:.9rem">
                        <i class="fas fa-key me-2"></i>Perbarui Kata Sandi
                    </button>
                </div>

            </div>
        </div>`;
}

function toggleSandiField(inputId, iconId) {
    const inp  = el(inputId);
    const icon = el(iconId);
    if (!inp || !icon) return;
    const show = inp.type === 'password';
    inp.type   = show ? 'text' : 'password';
    icon.className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
}

async function simpanProfil() {
    const nama   = el('input-nama-baru')?.value?.trim();
    const idBaru = el('input-id-baru')?.value?.trim();
    if (!nama) { tampilToast('Nama tidak boleh kosong.', 'galat'); return; }

    const res = await apiJSON('api/profil?aksi=update_nama', { nama });
    if (!res.ok) { tampilToast(res.pesan, 'galat'); return; }
    STATE.user.nama = nama;

    const u = STATE.user;
    const idLama = u.peran === 'siswa' ? (u.nisn||'') : (u.nip||'');
    if (idBaru && idBaru !== idLama) {
        const res2 = await apiJSON('api/profil?aksi=update_id', { id_baru: idBaru, peran: u.peran });
        if (!res2.ok) { tampilToast(res2.pesan, 'galat'); return; }
        if (u.peran === 'siswa') STATE.user.nisn = idBaru;
        else STATE.user.nip = idBaru;
        tampilToast('Profil berhasil diperbarui!', 'sukses');
    } else {
        tampilToast('Profil berhasil diperbarui!', 'sukses');
    }

    perbaruiHeader();
    const pnt = el('profil-nama-tampil');
    if (pnt) pnt.textContent = nama;
}

async function uploadFoto(input) {
    const file = input.files[0];
    if (!file) return;

    const loading = el('foto-loading');
    const avatar  = el('profil-avatar');
    if (loading) loading.classList.remove('d-none');

    // Preview langsung sebelum upload
    const reader = new FileReader();
    reader.onload = e => { if (avatar) avatar.src = e.target.result; };
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append('foto', file);
    const res = await apiForm('api/profil?aksi=upload_foto', fd);

    if (loading) loading.classList.add('d-none');

    if (!res.ok) {
        tampilToast(res.pesan || 'Gagal upload foto.', 'galat');
        if (avatar) avatar.src = fotoSrc(STATE.user.foto, STATE.user.nama);
        return;
    }
    STATE.user.foto = res.foto;
    if (avatar) avatar.src = res.foto;
    perbaruiHeader();
    tampilToast('Foto profil berhasil diperbarui!', 'sukses');
}

async function gantiSandi() {
    const sandi_lama = el('sandi-lama')?.value;
    const sandi_baru = el('sandi-baru')?.value;
    if (!sandi_lama || !sandi_baru) { tampilToast('Isi semua field kata sandi.', 'galat'); return; }
    if (sandi_baru.length < 6) { tampilToast('Kata sandi baru minimal 6 karakter.', 'galat'); return; }
    const res = await apiJSON('api/profil?aksi=ganti_sandi', { sandi_lama, sandi_baru });
    if (!res.ok) { tampilToast(res.pesan, 'galat'); return; }
    tampilToast('Kata sandi berhasil diperbarui!', 'sukses');
    el('sandi-lama').value = '';
    el('sandi-baru').value = '';
}

/* ============================================================
   UNDUH MATERI (Vercel - via signed URL)
   ============================================================ */
async function unduhMateri(id) {
    const res = await api(`api/materi?aksi=url_unduh&id=${id}`);
    if (!res.ok) { tampilToast(res.pesan || 'Gagal mendapatkan link download.', 'galat'); return; }
    const a = document.createElement('a');
    a.href = res.url;
    a.download = res.nama_file || 'materi';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* ============================================================
   RENDER KEPALA SEKOLAH
   ============================================================ */
async function renderKepsek() {
    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-users me-2 text-primary"></i>Data Siswa & Guru</h3>
        </div>
        <div class="kartu"><div class="text-center py-5 text-muted">Memuat data...</div></div>`;

    const [resSiswa, resGuru] = await Promise.all([
        api('api/nilai?aksi=rekap'),
        api('api/profil?aksi=info'),
    ]);

    const rekap   = resSiswa.ok ? resSiswa.rekap : [];
    const lulus   = rekap.filter(r => parseFloat(r.rata || 0) >= 75).length;
    const remidi  = rekap.length - lulus;
    const rataAll = rekap.length
        ? (rekap.filter(r => r.rata).reduce((s,r) => s + parseFloat(r.rata),0) / rekap.filter(r=>r.rata).length).toFixed(1)
        : '—';

    const barisSiswa = rekap.map((r,i) => {
        const ok = parseFloat(r.rata || 0) >= 75;
        return `<tr>
            <td class="text-muted">${i+1}</td>
            <td class="text-muted" style="font-size:.82rem">${r.nisn}</td>
            <td class="fw-semibold">${r.nama}</td>
            <td>${r.kelas}</td>
            <td class="fw-bold" style="color:${ok?'#2ecc71':'#e67e22'}">${r.rata ?? '—'}</td>
            <td class="text-center"><span class="${ok?'badge-lulus':'badge-remidi'}">${r.rata ? (ok?'Lulus':'Remidi') : 'Belum ada nilai'}</span></td>
        </tr>`;
    }).join('');

    el('dynamic-content').innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-users me-2 text-primary"></i>Data Siswa & Guru</h3>
            <a class="btn-aksi primer" href="api/nilai?aksi=export_csv" download>
                <i class="fas fa-download"></i>Export CSV
            </a>
        </div>
        <div class="stat-grid">
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#e8f4fd"><i class="fas fa-users" style="color:#3498db"></i></div>
                <div><div class="stat-label">Total Siswa</div><div class="stat-value">${rekap.length}</div></div>
            </div>
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#eafaf1"><i class="fas fa-check-circle" style="color:#2ecc71"></i></div>
                <div><div class="stat-label">Siswa Lulus</div><div class="stat-value">${lulus}</div></div>
            </div>
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#fde8d8"><i class="fas fa-exclamation" style="color:#e67e22"></i></div>
                <div><div class="stat-label">Perlu Remidi</div><div class="stat-value">${remidi}</div></div>
            </div>
            <div class="stat-kartu">
                <div class="stat-icon" style="background:#f5eef8"><i class="fas fa-chart-line" style="color:#9b59b6"></i></div>
                <div><div class="stat-label">Rata-rata Sekolah</div><div class="stat-value">${rataAll}</div></div>
            </div>
        </div>
        <div class="kartu">
            <h6 class="fw-bold mb-3"><i class="fas fa-graduation-cap me-2 text-primary"></i>Daftar Siswa</h6>
            <div class="tabel-wrapper">
                <table class="tabel">
                    <thead><tr>
                        <th>#</th><th>NISN</th><th>Nama</th><th>Kelas</th>
                        <th>Rata-rata</th><th class="text-center">Status</th>
                    </tr></thead>
                    <tbody>${barisSiswa || '<tr><td colspan="6" class="text-center text-muted py-4">Belum ada data</td></tr>'}</tbody>
                </table>
            </div>
        </div>`;
}

/* ============================================================
   MODAL REGISTER
   ============================================================ */
function bukaRegister() {
    el('login-screen').classList.add('d-none');
    el('register-screen').classList.remove('d-none');
    setRoleRegister('siswa');
}

function tutupRegister() {
    el('register-screen').classList.add('d-none');
    el('login-screen').classList.remove('d-none');
    el('formRegister').reset();
}

function setRoleRegister(peran) {
    STATE.peran = peran;
    const isSiswa = peran === 'siswa';
    el('rbtn-siswa').classList.toggle('active', isSiswa);
    el('rbtn-guru').classList.toggle('active', !isSiswa);
    el('rlabel-id').textContent  = isSiswa ? 'NISN SISWA' : 'NIP GURU';
    el('rinput-id').placeholder  = isSiswa ? 'Contoh: 1234567890' : 'Contoh: 198501012010012001';
    el('wrap-kelas').classList.toggle('d-none', !isSiswa);
    el('wrap-mapel').classList.toggle('d-none', isSiswa);
}

async function prosesRegister(e) {
    e.preventDefault();
    const nama       = el('rinput-nama').value.trim();
    const id         = el('rinput-id').value.trim();
    const kelas      = el('rinput-kelas')?.value || 'V A';
    const mapel      = el('rinput-mapel')?.value || 'Wali Kelas';
    const sandi      = el('rinput-sandi').value;
    const konfirmasi = el('rinput-konfirmasi').value;

    if (!nama || !id || !sandi || !konfirmasi) {
        el('register-alert-msg').textContent = 'Semua field wajib diisi.';
        el('register-alert').classList.remove('d-none'); return;
    }
    if (sandi.length < 6) {
        el('register-alert-msg').textContent = 'Kata sandi minimal 6 karakter.';
        el('register-alert').classList.remove('d-none'); return;
    }
    if (sandi !== konfirmasi) {
        el('register-alert-msg').textContent = 'Konfirmasi kata sandi tidak sesuai.';
        el('register-alert').classList.remove('d-none'); return;
    }

    tampilLoading(true);
    const res = await apiJSON('api/register', { peran: STATE.peran, nama, id, kelas, mapel, sandi, konfirmasi });
    tampilLoading(false);

    if (!res.ok) {
        el('register-alert-msg').textContent = res.pesan;
        el('register-alert').classList.remove('d-none'); return;
    }

    tampilToast(res.pesan, 'sukses');
    tutupRegister();
}

/* ============================================================
   MODAL LUPA PASSWORD
   ============================================================ */
function bukaLupaPassword() {
    el('login-screen').classList.add('d-none');
    el('lupa-screen').classList.remove('d-none');
    setRoleLupa('siswa');
}

function tutupLupaPassword() {
    el('lupa-screen').classList.add('d-none');
    el('login-screen').classList.remove('d-none');
    el('formLupa').reset();
    el('lupa-alert').classList.add('d-none');
}

function setRoleLupa(peran) {
    STATE.peran = peran;
    const isSiswa = peran === 'siswa';
    el('lbtn-siswa').classList.toggle('active', isSiswa);
    el('lbtn-guru').classList.toggle('active', !isSiswa);
    el('llabel-id').textContent = isSiswa ? 'NISN SISWA' : 'NIP GURU';
    el('linput-id').placeholder = isSiswa ? 'Contoh: 1234567890' : 'Contoh: 198501012010012001';
}

async function prosesResetSandi(e) {
    e.preventDefault();
    const id         = el('linput-id').value.trim();
    const nama       = el('linput-nama').value.trim();
    const sandi_baru = el('linput-sandi-baru').value;
    const konfirmasi = el('linput-konfirmasi').value;

    if (!id || !nama || !sandi_baru || !konfirmasi) {
        el('lupa-alert-msg').textContent = 'Semua field wajib diisi.';
        el('lupa-alert').classList.remove('d-none'); return;
    }
    if (sandi_baru !== konfirmasi) {
        el('lupa-alert-msg').textContent = 'Konfirmasi kata sandi tidak sesuai.';
        el('lupa-alert').classList.remove('d-none'); return;
    }

    tampilLoading(true);
    const res = await apiJSON('api/reset_sandi', { peran: STATE.peran, id, nama, sandi_baru, konfirmasi });
    tampilLoading(false);

    if (!res.ok) {
        el('lupa-alert-msg').textContent = res.pesan;
        el('lupa-alert').classList.remove('d-none'); return;
    }

    tampilToast(res.pesan, 'sukses');
    tutupLupaPassword();
}

/* ============================================================
   INISIALISASI
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    setRole('siswa');
    el('formLogin').addEventListener('submit', prosesLogin);
    el('formRegister')?.addEventListener('submit', prosesRegister);
    el('formLupa')?.addEventListener('submit', prosesResetSandi);
    el('menu-toggle').addEventListener('click', () => {
        el('wrapper').classList.toggle('toggled');
    });
});
