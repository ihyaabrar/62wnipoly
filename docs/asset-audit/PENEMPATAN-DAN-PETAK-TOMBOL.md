# Tinjauan penempatan dan petak tombol

## Penempatan

Tinjauan visual menggunakan papan lengkap dari sudut miring dan dari atas, sebelum perubahan ketebalan petak.

| Area | Temuan | Prioritas perapian |
|---|---|---|
| Papan tengah | Monas menjadi pusat yang jelas; empat sisi papan dan tema zona sudah mudah dikenali. Celah petak sebelumnya terlalu tipis sehingga membentuk satu bidang. | Ketebalan dan celah petak sudah diperbaiki. |
| Timur | Gedung, demo, papan slogan, dan properti kecil membuat sisi ini lebih padat dibanding area lain. | Sisakan ruang di depan landmark, susun gedung pendukung dalam kelompok, lalu cek dari sudut kamera game. |
| Selatan | Sungai dan banjir terbaca sebagai satu aliran. Rumah, kayu, jalan rusak, dan area pantai menumpuk pada beberapa titik. | Pertahankan bukaan pandangan ke muara, kelompokkan puing mengikuti arah aliran, dan perjelas akses ke posko. |
| Barat | Peralihan vegetasi sehat ke area hangus sudah terbaca, tetapi pohon dan asap saling menutupi dari sudut rendah. | Beri koridor pandangan di sekitar jalur dan titik pemadam. |
| Utara | Gunung terbaca kuat; bangunan kecil di kaki gunung cenderung membentuk deretan. | Kelompokkan desa dan pos pengamatan dengan jarak yang lebih disengaja. |
| Jalan dan pojok | Beberapa segmen jalan terlihat terpisah dari bangunan dan papan. Kerusakan sesuai tema, tetapi fungsi akses belum selalu jelas. | Perjelas jalur akses bangunan dan bedakan jalan terputus akibat bencana dari jalan yang sekadar belum tersambung. |

Temuan ini merupakan penilaian komposisi visual, bukan bukti benturan geometri setiap bangunan. Penempatan dekorasi belum diubah dalam pekerjaan efek tombol.

## Implementasi petak tombol

- Permukaan istirahat naik dari 0,12 menjadi 0,34 unit, dengan badan petak setebal 0,30 unit.
- Badan petak dikurangi 0,10 unit dari ukuran slot sehingga terdapat celah antarpetak, termasuk di pertemuan sudut.
- Gerakan tekan sedalam 0,14 unit memakai pegas teredam dengan sublangkah untuk menjaga kestabilan frame lambat.
- Judul, miniatur, dan badan petak bergerak bersama. Bidak mengikuti tinggi permukaan, termasuk saat berpindah dan mendarat.
- Muatan beberapa bidak dijumlahkan dan dibatasi; petak tetap turun sampai seluruh bidak meninggalkannya.
- Bingkai pilihan dan bidang pemilih disesuaikan. Kurungan lapas mengikuti tinggi dukungan bidak.
- Katalog papan lengkap menampilkan satu bidak berjalan untuk memperlihatkan respons petak. Game mengikuti pergerakan bidak sebenarnya.
- Geometri statis pada setiap bagian petak digabung secara terpisah agar tetap bisa dianimasikan.

## Verifikasi

178 tes aset lulus. Mencakup celah seluruh 40 petak, dukungan beberapa bidak, pemulihan petak, tidak adanya akumulasi perubahan tinggi bidak, kestabilan frame lambat, dan seluruh entri katalog. TypeScript dan pemeriksaan whitespace lulus.

Pemeriksaan visual animasi final belum selesai: kontrol browser berhenti merespons ketika membuka papan lengkap dari dekat. Tidak ada klaim verifikasi animasi game secara visual.
