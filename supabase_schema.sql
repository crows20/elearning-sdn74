-- ============================================================
-- SUPABASE SCHEMA — E-Learning SDN 74 Krui
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- TABEL GURU (termasuk Kepala Sekolah)
CREATE TABLE IF NOT EXISTS guru (
    id         SERIAL PRIMARY KEY,
    nip        VARCHAR(30)  NOT NULL UNIQUE,
    nama       VARCHAR(100) NOT NULL,
    mapel      VARCHAR(100) NOT NULL DEFAULT 'Wali Kelas',
    peran      VARCHAR(20)  NOT NULL DEFAULT 'guru', -- 'guru' atau 'kepsek'
    sandi      VARCHAR(255) NOT NULL,
    foto       VARCHAR(255),
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- TABEL SISWA
CREATE TABLE IF NOT EXISTS siswa (
    id         SERIAL PRIMARY KEY,
    nisn       VARCHAR(20)  NOT NULL UNIQUE,
    nama       VARCHAR(100) NOT NULL,
    kelas      VARCHAR(10)  NOT NULL DEFAULT 'V A',
    sandi      VARCHAR(255) NOT NULL,
    foto       VARCHAR(255),
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- TABEL MATERI
CREATE TABLE IF NOT EXISTS materi (
    id         SERIAL PRIMARY KEY,
    judul      VARCHAR(200) NOT NULL,
    kelas      VARCHAR(10)  NOT NULL DEFAULT 'V',
    tipe       VARCHAR(20)  NOT NULL DEFAULT 'PDF',
    ukuran     VARCHAR(20)  NOT NULL DEFAULT '0 KB',
    nama_file  VARCHAR(255) NOT NULL,
    url_file   VARCHAR(500) NOT NULL,
    id_guru    INTEGER      NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    tanggal    DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- TABEL NILAI
CREATE TABLE IF NOT EXISTS nilai (
    id         SERIAL PRIMARY KEY,
    id_siswa   INTEGER      NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    mapel      VARCHAR(100) NOT NULL,
    tugas      DECIMAL(5,2) NOT NULL DEFAULT 0,
    uts        DECIMAL(5,2) NOT NULL DEFAULT 0,
    uas        DECIMAL(5,2) NOT NULL DEFAULT 0,
    akhir      DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  DEFAULT NOW(),
    updated_at TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE(id_siswa, mapel)
);

-- ============================================================
-- DATA AWAL
-- ============================================================

-- Kepala Sekolah
INSERT INTO guru (nip, nama, mapel, peran, sandi) VALUES
('196501011990031001', 'Bapak Suparman, S.Pd', 'Kepala Sekolah', 'kepsek', 'kepsek123');

-- Guru
INSERT INTO guru (nip, nama, mapel, peran, sandi) VALUES
('198501012010012001', 'Ibu Yeni Susanti', 'Wali Kelas V A', 'guru', 'guru123'),
('197803152005012002', 'Pak Hendra Saputra', 'Wali Kelas V B', 'guru', 'mengajar1');

-- Siswa
INSERT INTO siswa (nisn, nama, kelas, sandi) VALUES
('1234567890', 'Budi Santoso',  'V A', 'siswa123'),
('0987654321', 'Ani Rahayu',    'V A', 'belajar1'),
('1122334455', 'Dito Prasetyo', 'V B', 'krui2024'),
('5544332211', 'Sari Dewi',     'V B', 'siswa456'),
('9988776655', 'Rafi Maulana',  'V A', 'belajar2');

-- Nilai
INSERT INTO nilai (id_siswa, mapel, tugas, uts, uas, akhir) VALUES
(1,'Matematika',85,80,88,85),(1,'Bahasa Indonesia',90,88,92,90),(1,'IPA',78,75,80,78),(1,'IPS',82,79,85,82),(1,'PKn',95,90,93,93),
(2,'Matematika',72,68,74,71),(2,'Bahasa Indonesia',88,85,90,88),(2,'IPA',65,62,68,65),(2,'IPS',80,77,82,80),(2,'PKn',90,88,91,90),
(3,'Matematika',60,58,63,60),(3,'Bahasa Indonesia',72,70,74,72),(3,'IPA',55,52,58,55),(3,'IPS',65,62,67,65),(3,'PKn',70,68,72,70),
(4,'Matematika',92,90,94,92),(4,'Bahasa Indonesia',95,93,96,95),(4,'IPA',88,86,90,88),(4,'IPS',90,88,92,90),(4,'PKn',93,91,94,93),
(5,'Matematika',75,73,77,75),(5,'Bahasa Indonesia',80,78,82,80),(5,'IPA',70,68,72,70),(5,'IPS',76,74,78,76),(5,'PKn',78,76,80,78);
