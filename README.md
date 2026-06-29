# Galeri Dokumentasi Sekolah

File statis ringan: index.html + assets. Untuk menampilkan foto secara otomatis, jalankan generator manifest yang memindai folder `img/` dan membuat `data.json`.

1) Bangun manifest dari folder `img/`:

```bash
python build_manifest.py
```

2) Jalankan web server sederhana (dari folder project):

```bash
python -m http.server 8000
# lalu buka http://localhost:8000
```

Desain SPA: `index.html` menampilkan katalog per tahun -> event -> galeri; klik foto membuka lightbox dengan previous/next dan tombol download. Gambar dimuat secara lazy dan galeri menggunakan pagination batch (60) untuk performa.
