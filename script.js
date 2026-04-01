// ==========================================
// 1. KONFIGURASI FIREBASE KITA
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBpvbeaMUto17B_-gSOdzhUinMCSo8A8WU",
    authDomain: "manajemen-kontrakan.firebaseapp.com",
    databaseURL: "https://manajemen-kontrakan-default-rtdb.firebaseio.com",
    projectId: "manajemen-kontrakan",
    storageBucket: "manajemen-kontrakan.firebasestorage.app",
    messagingSenderId: "283924931275",
    appId: "1:283924931275:web:fde57b70415604a964f14e"
};

// ==========================================
// FUNGSI NAVIGASI SIDEBAR
// ==========================================
function bukaMenu(idHalaman) {
    // 1. Ambil semua div yang punya class 'halaman-menu'
    let semuaHalaman = document.getElementsByClassName('halaman-menu');
    
    // 2. Sembunyikan semuanya (display = 'none')
    for (let i = 0; i < semuaHalaman.length; i++) {
        semuaHalaman[i].style.display = 'none';
    }
    
    // 3. Tampilkan HANYA halaman yang ID-nya diklik di tombol sidebar
    document.getElementById(idHalaman).style.display = 'block';
}

// Nyalakan Mesin Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Variabel Global
let dataPengeluaran = [];
let grafikKita;
let berasAktif = null;

// ==========================================
// 2. FITUR PENGELUARAN (REAL-TIME)
// ==========================================

// AJAIBNYA FIREBASE: Kode ini akan otomatis berjalan SETIAP KALI ada data baru/dihapus di database
db.ref('pengeluaran').on('value', function(snapshot) {
    dataPengeluaran = []; // Kosongkan daftar lokal dulu
    
    // Baca data dari awan (cloud) satu per satu
    snapshot.forEach(function(childSnapshot) {
        let item = childSnapshot.val();
        item.id = childSnapshot.key; // Simpan Kunci Unik dari Firebase untuk fitur hapus
        dataPengeluaran.push(item);
    });
    
    // Segarkan layar dan grafik dengan data terbaru dari internet!
    tampilkanRiwayat();
});

// Fungsi untuk menggambar dan memperbarui grafik (Tidak ada yang berubah)
function perbaruiGrafik() {
    const dataPerHari = {};
    dataPengeluaran.forEach(function(item) {
        if (dataPerHari[item.tanggal]) {
            dataPerHari[item.tanggal] += Number(item.jumlah);
        } else {
            dataPerHari[item.tanggal] = Number(item.jumlah);
        }
    });

    const labelTanggal = Object.keys(dataPerHari);
    const uangPerHari = Object.values(dataPerHari);

    if (grafikKita) { grafikKita.destroy(); }

    const kanvas = document.getElementById('grafikPengeluaran').getContext('2d');
    grafikKita = new Chart(kanvas, {
        type: 'bar',
        data: {
            labels: labelTanggal,
            datasets: [{
                label: 'Total Pengeluaran (Rp)',
                data: uangPerHari,
                backgroundColor: '#3498db',
                borderRadius: 5
            }]
        }
    });
}

// Fungsi merakit tampilan riwayat (Sedikit modifikasi di tombol hapus)
function tampilkanRiwayat() {
    const daftarRiwayat = document.getElementById('daftar-riwayat');
    daftarRiwayat.innerHTML = ''; 
    let totalPengeluaran = 0;

    dataPengeluaran.forEach(function(item) {
        const itemBaru = document.createElement('li');
        itemBaru.style.background = '#ecf0f1';
        itemBaru.style.margin = '10px 0';
        itemBaru.style.padding = '12px';
        itemBaru.style.borderRadius = '5px';
        itemBaru.style.borderLeft = '5px solid #27ae60';
        itemBaru.style.display = 'flex';
        itemBaru.style.justifyContent = 'space-between';
        itemBaru.style.alignItems = 'center';
        
        const teksRiwayat = document.createElement('div');
        teksRiwayat.innerHTML = `<strong>${item.tanggal}</strong>: ${item.keterangan} - <b>Rp${item.jumlah}</b>`;
        
        const tombolHapus = document.createElement('button');
        tombolHapus.innerHTML = '❌';
        tombolHapus.style.background = 'transparent';
        tombolHapus.style.border = 'none';
        tombolHapus.style.cursor = 'pointer';
        tombolHapus.style.fontSize = '16px';
        tombolHapus.style.marginLeft = '15px';
        tombolHapus.style.margin = '0';
        tombolHapus.style.padding = '0';
        tombolHapus.style.display = 'flex';
        tombolHapus.style.alignItems = 'center';
        
        // LOGIKA HAPUS FIREBASE
        tombolHapus.addEventListener('click', function() {
            // Kita suruh Firebase menghapus data berdasarkan Kunci Uniknya
            db.ref('pengeluaran/' + item.id).remove();
        });

        itemBaru.appendChild(teksRiwayat);
        itemBaru.appendChild(tombolHapus);
        daftarRiwayat.appendChild(itemBaru);

        totalPengeluaran = totalPengeluaran + Number(item.jumlah);
    });

    document.getElementById('total-uang').innerHTML = `Rp${totalPengeluaran.toLocaleString('id-ID')}`;
    perbaruiGrafik();
}

// Tambah Pengeluaran Baru
document.getElementById('form-pengeluaran').addEventListener('submit', function(event){
    event.preventDefault();

    const pengeluaranBaru = {
        tanggal: document.getElementById('tanggal').value,
        keterangan: document.getElementById('keterangan').value,
        jumlah: document.getElementById('jumlah').value
    };

    // LOGIKA TAMBAH FIREBASE: Gunakan .push() untuk melempar data ke awan
    db.ref('pengeluaran').push(pengeluaranBaru);
    document.getElementById('form-pengeluaran').reset();
});

// ==========================================
// 3. FITUR MONITOR BERAS (REAL-TIME)
// ==========================================

const formBeras = document.getElementById('form-beras');
const statusBeras = document.getElementById('status-beras');
const infoBeras = document.getElementById('info-beras');
const btnBerasHabis = document.getElementById('btn-beras-habis');

// Tarik data beras dari Firebase (Otomatis update)
db.ref('beras').on('value', function(snapshot) {
    berasAktif = snapshot.val(); // Mengambil isi data beras
    perbaruiTampilanBeras();
});

function perbaruiTampilanBeras(){
    if (berasAktif){
        formBeras.style.display = 'none';
        statusBeras.style.display = 'block';
        infoBeras.innerHTML = `Beras <b>${berasAktif.berat} Kg</b> mulai dipakai pada <b>${berasAktif.tanggal}</b>.`;
    } else {
        formBeras.style.display = 'block';
        statusBeras.style.display = 'none';
    }
}

formBeras.addEventListener('submit', function(event) {
    event.preventDefault();
    const dataBerasBaru = {
        tanggal: document.getElementById('tanggal-beras').value,
        berat: document.getElementById('berat-beras').value
    };
    
    // Gunakan .set() untuk menimpa/membuat satu data beras saja (bukan berderet seperti riwayat)
    db.ref('beras').set(dataBerasBaru);
    formBeras.reset();
});

btnBerasHabis.addEventListener('click', function(){
    if (berasAktif){
        const tanggalMulai = new Date(berasAktif.tanggal);
        const tanggalHariIni = new Date();
        const selisihMilidetik = Math.abs(tanggalHariIni - tanggalMulai);
        const selisihHari = Math.ceil(selisihMilidetik / (1000 * 60 * 60 * 24));
        const rataRata = (berasAktif.berat / selisihHari).toFixed(2);

        alert(`🚨 LAPORAN STOK BERAS 🚨\n\nBeras ${berasAktif.berat} Kg habis dalam waktu ${selisihHari} hari.\nRata-rata pemakaian kalian ${rataRata} Kg/hari.`);

        // Hapus data beras dari Firebase!
        db.ref('beras').remove();
    }
});

// ==========================================
// 4. FITUR INVENTARIS KONTRAKAN (REAL-TIME)
// ==========================================

const formInventaris = document.getElementById('form-inventaris');
const daftarInventaris = document.getElementById('daftar-inventaris');

// A. FITUR READ: Mengambil dan Menampilkan Data dari Firebase
db.ref('inventaris').on('value', function(snapshot) {
    // Kosongkan daftar HTML sebelum diisi ulang agar tidak dobel
    daftarInventaris.innerHTML = ''; 

    snapshot.forEach(function(childSnapshot) {
        let item = childSnapshot.val();
        let idBarang = childSnapshot.key; // Simpan kunci unik Firebase

        // Bikin elemen <li> (list) baru untuk setiap barang
        const li = document.createElement('li');
        li.style.background = '#ecf0f1';
        li.style.margin = '10px 0';
        li.style.padding = '12px';
        li.style.borderRadius = '5px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        
        // Logika visual: Ganti warna pinggiran sesuai kondisi barang
        let warnaBorder = '#27ae60'; // Hijau (Baik)
        let ikonKondisi = '✅';
        if (item.kondisi === 'Rusak') {
            warnaBorder = '#f39c12'; // Oranye
            ikonKondisi = '⚠️';
        } else if (item.kondisi === 'Habis') {
            warnaBorder = '#e74c3c'; // Merah
            ikonKondisi = '❌';
        }
        li.style.borderLeft = `5px solid ${warnaBorder}`;

        // Isi teks barangnya
        const infoBarang = document.createElement('div');
        infoBarang.innerHTML = `
            <strong style="font-size: 16px;">${item.nama}</strong> (x${item.jumlah}) <br> 
            <small style="color: #7f8c8d;">Kondisi: ${ikonKondisi} ${item.kondisi} | PIC: <b>${item.pic}</b></small>
        `;

        // Bikin tombol hapus
        const tombolHapus = document.createElement('button');
        tombolHapus.innerHTML = '🗑️';
        tombolHapus.style.background = 'transparent';
        tombolHapus.style.border = 'none';
        tombolHapus.style.cursor = 'pointer';
        tombolHapus.style.fontSize = '18px';
        tombolHapus.style.width = 'auto'; // Mengakali CSS tombol default
        tombolHapus.style.marginTop = '0';
        tombolHapus.style.padding = '5px';

        // FITUR DELETE: Menghapus data dari Firebase saat tombol diklik
        tombolHapus.addEventListener('click', function() {
            if(confirm(`Yakin ingin menghapus ${item.nama} dari inventaris?`)) {
                db.ref('inventaris/' + idBarang).remove();
            }
        });

        // Masukkan teks dan tombol ke dalam elemen <li>, lalu masukkan ke <ul> utama
        li.appendChild(infoBarang);
        li.appendChild(tombolHapus);
        daftarInventaris.appendChild(li);
    });
});

// B. FITUR CREATE: Menyimpan Barang Baru ke Firebase
formInventaris.addEventListener('submit', function(event) {
    event.preventDefault(); // Cegah halaman refresh (khas form HTML)

    // Kumpulkan data dari isian form
    const barangBaru = {
        nama: document.getElementById('nama-barang').value,
        jumlah: document.getElementById('jumlah-barang').value,
        kondisi: document.getElementById('kondisi-barang').value,
        pic: document.getElementById('pic-barang').value
    };

    // Lempar datanya ke awan (Firebase) di dalam folder 'inventaris'
    db.ref('inventaris').push(barangBaru);
    
    // Kosongkan kotak isian form setelah tombol diklik
    formInventaris.reset();
});

// ==========================================
// 5. FITUR JADWAL PIKET (REAL-TIME)
// ==========================================

const formPiket = document.getElementById('form-piket');
const daftarPiket = document.getElementById('daftar-piket');

// A. FITUR READ: Menampilkan Jadwal dari Firebase
db.ref('piket').on('value', function(snapshot) {
    daftarPiket.innerHTML = ''; 

    snapshot.forEach(function(childSnapshot) {
        let jadwal = childSnapshot.val();
        let idPiket = childSnapshot.key;

        const li = document.createElement('li');
        li.style.background = '#ecf0f1';
        li.style.margin = '10px 0';
        li.style.padding = '12px';
        li.style.borderRadius = '5px';
        li.style.borderLeft = '5px solid #2980b9'; // Warna biru
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const infoPiket = document.createElement('div');
        infoPiket.innerHTML = `
            <strong style="font-size: 16px; color: #2980b9;">${jadwal.hari}</strong> <br>
            <span>${jadwal.tugas}</span> <br>
            <small style="color: #7f8c8d;">Oleh: <b>${jadwal.nama}</b></small>
        `;

        const tombolHapusPiket = document.createElement('button');
        tombolHapusPiket.innerHTML = '🗑️';
        tombolHapusPiket.style.background = 'transparent';
        tombolHapusPiket.style.border = 'none';
        tombolHapusPiket.style.cursor = 'pointer';
        tombolHapusPiket.style.fontSize = '18px';
        tombolHapusPiket.style.width = 'auto';
        tombolHapusPiket.style.marginTop = '0';
        tombolHapusPiket.style.padding = '5px';

        // FITUR DELETE
        tombolHapusPiket.addEventListener('click', function() {
            if(confirm(`Hapus jadwal ${jadwal.tugas} di hari ${jadwal.hari}?`)) {
                db.ref('piket/' + idPiket).remove();
            }
        });

        li.appendChild(infoPiket);
        li.appendChild(tombolHapusPiket);
        daftarPiket.appendChild(li);
    });
});

// B. FITUR CREATE: Menyimpan Jadwal Baru ke Firebase
formPiket.addEventListener('submit', function(event) {
    event.preventDefault();

    const jadwalBaru = {
        hari: document.getElementById('hari-piket').value,
        tugas: document.getElementById('tugas-piket').value,
        nama: document.getElementById('nama-piket').value
    };

    db.ref('piket').push(jadwalBaru);
    
    // Kosongkan form teks saja, hari biarkan saja biar gampang kalau mau nambah di hari yang sama
    document.getElementById('tugas-piket').value = '';
    document.getElementById('nama-piket').value = '';
});