# Perapian seluruh 40 petak

Semua indeks 0–39 memakai tata letak baru yang sama pada katalog dan game.

- Area judul diperluas dari kedalaman 0,5 menjadi 0,8 unit. Warna zona dipindahkan ke pita sempit di tepi luar.
- Teks gelap di atas bidang krem; Musibah memakai teks terang di atas bidang arang. Kesempatan tetap kuning, sudut tetap beralas gelap.
- Ukuran teks maksimal naik dari 0,165 menjadi 0,24 unit; sudut dari 0,19 menjadi 0,30. Ukuran akhir menyesuaikan lebar nama menggunakan metrik font Barlow Condensed Bold yang dibundel.
- Setiap nama mendapat pemenggalan baris yang disengaja. Nama biasa tetap lengkap; judul sudut tetap memakai singkatan yang sudah ada, sedangkan nama lengkap tersedia di panel info game.
- Huruf SDF memakai resolusi glyph 128 dan material tanpa pengaruh lampu supaya kontrasnya stabil.
- Miniatur dipusatkan dan dibatasi ke area terpisah: lebar petak dikurangi 0,22, kedalaman 0,48, tinggi 0,46 unit. Atap dan asap ikut dihitung.
- Katalog menambahkan `tinjauan-petak`: 40 petak tersusun empat baris, masing-masing sepuluh petak. Jumlah entri kini 126.

## Verifikasi

175 tes aset lulus, termasuk pemeriksaan seluruh entri katalog serta 40 pemeriksaan khusus untuk memastikan nama lengkap, ukuran teks, dan batas miniatur. TypeScript lulus.

Pratinjau 40 petak telah ditinjau secara visual. Pemeriksaan dekat setelah penyesuaian font memperlihatkan teks lebih jelas dan area judul terpisah dari miniatur. Pengambilan gambar final dan pemeriksaan ulang papan lengkap terhambat karena kontrol browser berhenti merespons.

Pada tampilan seluruh dunia yang sangat jauh, judul tetap memerlukan zoom karena ukuran petak di layar sangat kecil.
