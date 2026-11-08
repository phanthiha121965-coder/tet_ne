const MY_LINK4M_URL = "https://link4m.net/JtoYhsH";

// --- CẤU HÌNH FIREBASE CLOUD DATABASE THẬT CỦA DŨNG ---
const firebaseConfig = {
    apiKey: "AIzaSyC8oHf9Lhx_r--hsEmUPk9x1Y4u3-TFUEY",
    authDomain: "tet2027-cfd6f.firebaseapp.com",
    projectId: "tet2027-cfd6f",
    storageBucket: "tet2027-cfd6f.firebasestorage.app",
    messagingSenderId: "167099079711",
    appId: "1:167099079711:web:c1f300a15462f3eceb092a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- TÀI KHOẢN ADMIN ĐẶC BIỆT ---
const ADMIN_USER = "dunghoet";
const ADMIN_PASS = "10091990dung";

let clientDeviceID = localStorage.getItem('tet_device_id');
if (!clientDeviceID) {
    clientDeviceID = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('tet_device_id', clientDeviceID);
}

// Đếm ngược Tết 2027
const targetDate = new Date('February 6, 2027 00:00:00').getTime();
setInterval(() => {
    const diff = targetDate - new Date().getTime();
    if (diff > 0) {
        document.getElementById('days').innerText = Math.floor(diff / (1000 * 60 * 60 * 24));
        document.getElementById('hours').innerText = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        document.getElementById('minutes').innerText = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('seconds').innerText = Math.floor((diff % (1000 * 60)) / 1000);
    }
}, 1000);

function showModal(title, msg, icon = "fa-bell") {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = msg;
    document.getElementById('modalIcon').className = `fa-solid ${icon} text-yellow-300`;
    document.getElementById('authModal').classList.add('hidden');
    const modal = document.getElementById('customModal');
    modal.classList.remove('hidden');
    modal.style.zIndex = "99999";
}
document.getElementById('modalCloseBtn').onclick = () => {
    document.getElementById('customModal').classList.add('hidden');
};

// --- HỆ THỐNG XÁC THỰC TÀI KHOẢN (USER) ---
const authModal = document.getElementById('authModal');
document.getElementById('openAuthModalBtn').onclick = (e) => {
    e.stopPropagation();
    const savedUser = localStorage.getItem('tet_current_user');
    if (savedUser) {
        document.getElementById('userDropdownMenu').classList.toggle('hidden');
    } else {
        authModal.classList.remove('hidden');
        authModal.style.zIndex = "9998";
    }
};
document.getElementById('closeAuthModal').onclick = () => authModal.classList.add('hidden');

document.getElementById('tabLogin').onclick = function() {
    this.className = "flex-1 py-2 rounded-lg text-xs font-bold text-yellow-300 bg-yellow-500/20 cursor-pointer";
    document.getElementById('tabRegister').className = "flex-1 py-2 rounded-lg text-xs font-bold text-red-200 cursor-pointer";
    document.getElementById('formLogin').classList.remove('hidden');
    document.getElementById('formRegister').classList.add('hidden');
};
document.getElementById('tabRegister').onclick = function() {
    this.className = "flex-1 py-2 rounded-lg text-xs font-bold text-yellow-300 bg-yellow-500/20 cursor-pointer";
    document.getElementById('tabLogin').className = "flex-1 py-2 rounded-lg text-xs font-bold text-red-200 cursor-pointer";
    document.getElementById('formRegister').classList.remove('hidden');
    document.getElementById('formLogin').classList.add('hidden');
};

function isValidEmail(email) { 
    return email.includes('@') && email.includes('.') && email.length > 5; 
}

// Đăng ký (Kiểm tra Blacklist IP trước khi tạo)
document.getElementById('submitRegister').onclick = async function() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value.trim();

    if (!name) { showModal("Lỗi", "Vui lòng nhập tên hiển thị!"); return; }
    if (!isValidEmail(email)) { showModal("Lỗi Định Dạng", "Email không hợp lệ (cần chứa @ và .)"); return; }
    if (pass.length < 4) { showModal("Lỗi", "Mật khẩu phải từ 4 ký tự trở lên!"); return; }

    try {
        const blackDoc = await db.collection('tet_blacklist').doc(clientDeviceID).get();
        if (blackDoc.exists && blackDoc.data().banned === true) {
            showModal("Từ Chối Tạo Tài Khoản", "Thiết bị của bạn đã bị đưa vào danh sách đen (Blacklist IP), không thể đăng ký tài khoản mới!");
            return;
        }

        const userRef = db.collection('tet_users').doc(email);
        const doc = await userRef.get();
        if (doc.exists) {
            showModal("Lỗi Đăng Ký", "Email này đã được đăng ký tài khoản trước đó rồi!");
            return;
        }

        await userRef.set({ name, email, pass, banned: false, deviceId: clientDeviceID });
        authModal.classList.add('hidden');
        showModal("Đăng Ký Thành Công", `Tài khoản ${name} đã được tạo! Hãy đăng nhập.`, "fa-face-smile-beam");
        document.getElementById('tabLogin').click();
    } catch (error) {
        showModal("Lỗi Kết Nối", "Không thể kết nối đến máy chủ cloud.");
    }
};

// Đăng nhập (Kiểm tra khóa nick và Blacklist IP thời gian thực)
document.getElementById('submitLogin').onclick = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    if (!isValidEmail(email)) { showModal("Lỗi", "Email đăng nhập không hợp lệ!"); return; }
    if (!pass) { showModal("Lỗi", "Vui lòng nhập mật khẩu!"); return; }

    try {
        const blackDoc = await db.collection('tet_blacklist').doc(clientDeviceID).get();
        if (blackDoc.exists && blackDoc.data().banned === true) {
            showModal("Truy Cập Bị Từ Chối", "Thiết bị này đã bị Admin đưa vào danh sách đen!");
            return;
        }

        const userRef = db.collection('tet_users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists || doc.data().pass !== pass) {
            showModal("Đăng Nhập Thất Bại", "Email hoặc mật khẩu không chính xác!");
            return;
        }

        const userData = doc.data();
        if (userData.banned === true) {
            showModal("Tài Khoản Bị Khóa", "Tài khoản này đã bị Admin cấm vĩnh viễn, không thể đăng nhập!");
            return;
        }

        localStorage.setItem('tet_current_user', userData.name);
        localStorage.setItem('tet_current_email', userData.email);
        document.getElementById('userDisplayName').innerText = userData.name;
        authModal.classList.add('hidden');
        
        showModal("Thành Công", `Chào mừng ${userData.name} đã đăng nhập!`);
        checkCheckinStatus();
    } catch (error) {
        showModal("Lỗi Đăng Nhập", "Lỗi kết nối máy chủ dữ liệu.");
    }
};

document.getElementById('logoutBtn').onclick = function() {
    localStorage.removeItem('tet_current_user');
    localStorage.removeItem('tet_current_email');
    localStorage.removeItem('tet_is_admin');
    const enterpriseView = document.getElementById('enterpriseAdminPage');
    if(enterpriseView) enterpriseView.remove();
    document.getElementById('userDisplayName').innerText = 'Đăng Nhập';
    document.getElementById('userDropdownMenu').classList.add('hidden');
    checkCheckinStatus();
    showModal("Đã Thoát", "Đã đăng xuất tài khoản khỏi thiết bị.");
};

// --- GIAO DIỆN ADMIN & BÍ MẬT BẤM TRÁI TIM 10 LẦN ---
let heartClickCount = 0;
const adminModalsHTML = `
    <div id="adminLoginModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center hidden z-[99999]">
        <div class="bg-gradient-to-b from-red-900 to-red-950 border-2 border-yellow-400 p-6 rounded-2xl w-[90%] max-w-sm text-center shadow-2xl relative">
            <button id="closeAdminModal" class="absolute top-3 right-3 text-yellow-300 font-bold text-lg">✕</button>
            <div class="text-3xl text-yellow-400 mb-2">👑</div>
            <h3 class="text-yellow-300 font-extrabold text-base mb-4">CỔNG QUẢN TRỊ ADMIN TẾT 2027</h3>
            <input type="text" id="adminUser" placeholder="Tên đăng nhập Admin" class="w-full bg-red-950/80 border border-yellow-500/40 rounded-xl px-3 py-2 text-xs text-yellow-100 mb-3 focus:outline-none focus:border-yellow-400">
            <input type="password" id="adminPass" placeholder="Mật khẩu Admin" class="w-full bg-red-950/80 border border-yellow-500/40 rounded-xl px-3 py-2 text-xs text-yellow-100 mb-4 focus:outline-none focus:border-yellow-400">
            <button id="submitAdminLogin" class="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-red-950 font-extrabold rounded-xl text-xs shadow-lg hover:brightness-110">TRUY CẬP QUYỀN LỰC</button>
        </div>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', adminModalsHTML);

document.addEventListener('click', function(e) {
    if (e.target.closest('.fa-heart') || e.target.closest('h3')?.innerText.includes('Ủng Hộ Tác Giả')) {
        heartClickCount++;
        if (heartClickCount >= 10) {
            heartClickCount = 0;
            document.getElementById('adminLoginModal').classList.remove('hidden');
        }
    }
});

document.getElementById('closeAdminModal').onclick = () => {
    document.getElementById('adminLoginModal').classList.add('hidden');
};

document.getElementById('submitAdminLogin').onclick = function() {
    const u = document.getElementById('adminUser').value.trim();
    const p = document.getElementById('adminPass').value.trim();

    if (u === ADMIN_USER && p === ADMIN_PASS) {
        localStorage.setItem('tet_is_admin', 'true');
        localStorage.setItem('tet_current_user', 'Admin Dunghoet Tối Cao 👑');
        localStorage.setItem('tet_current_email', 'dunghoet@admin.com');
        document.getElementById('userDisplayName').innerText = 'Admin Dunghoet Tối Cao 👑';
        document.getElementById('adminLoginModal').classList.add('hidden');
        showModal("Đăng Nhập Thành Công", "Đã kích hoạt đặc quyền Admin tối cao!", "fa-crown");
        renderAdminControlBtn();
        loadChatRealtime();
    } else {
        showModal("Sai Thông Tin", "Tên đăng nhập hoặc mật khẩu quản trị không đúng!");
    }
};

function renderAdminControlBtn() {
    if (localStorage.getItem('tet_is_admin') === 'true') {
        if (!document.getElementById('openEnterpriseAdminBtn')) {
            const btnHtml = `
                <div class="fixed bottom-20 right-4 z-[9998]">
                    <button id="openEnterpriseAdminBtn" class="bg-gradient-to-r from-yellow-400 to-amber-600 text-red-950 font-extrabold px-3.5 py-2.5 rounded-2xl shadow-2xl border-2 border-white text-xs flex items-center gap-2 animate-bounce">
                        👑 Quản Trị Viên (Enterprise)
                    </button>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', btnHtml);
            document.getElementById('openEnterpriseAdminBtn').onclick = openEnterpriseAdminDashboard;
        }
    }
}

// --- TRANG QUẢN TRỊ ENTERPRISE CHUẨN XỊN (FULL MÀN HÌNH NHƯ ẢNH MẪU) ---
function openEnterpriseAdminDashboard() {
    let existingPage = document.getElementById('enterpriseAdminPage');
    if (existingPage) existingPage.remove();

    const enterpriseHTML = `
        <div id="enterpriseAdminPage" class="fixed inset-0 bg-[#0f0505] text-white z-[99999] flex flex-col font-sans overflow-hidden">
            
            <!-- Top Navbar -->
            <div class="h-14 bg-[#1a0808] border-b border-yellow-500/20 px-6 flex items-center justify-between flex-shrink-0">
                <div class="flex items-center gap-3">
                    <span class="text-xl">👑</span>
                    <span class="font-extrabold text-sm text-yellow-300 tracking-wider">TET 2027 ENTERPRISE CONTROL PANEL</span>
                </div>
                <div class="flex items-center gap-4 text-xs">
                    <div class="flex items-center gap-2 bg-red-950/60 border border-yellow-500/30 px-3 py-1.5 rounded-xl">
                        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span class="font-bold text-yellow-200">Admin: Dunghoet Tối Cao</span>
                    </div>
                    <button id="closeEnterprisePage" class="bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-1.5 rounded-xl transition shadow">Thoát Quản Trị</button>
                </div>
            </div>

            <!-- Body Layout: Sidebar + Content -->
            <div class="flex-1 flex overflow-hidden">
                
                <!-- Sidebar Trái -->
                <div class="w-64 bg-[#140606] border-r border-yellow-500/20 p-4 flex flex-col justify-between flex-shrink-0">
                    <div class="space-y-1.5">
                        <div class="text-[10px] text-yellow-500/60 font-bold px-3 pb-1 uppercase tracking-wider">Quản Trị Hệ Thống</div>
                        <button onclick="switchEnterpriseTab('users')" id="entTabUsers" class="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-yellow-300 bg-yellow-500/20 border border-yellow-400/40 flex items-center gap-2.5 transition">
                            👥 Quản Lý Người Dùng
                        </button>
                        <button onclick="switchEnterpriseTab('blacklist')" id="entTabBlacklist" class="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-200 hover:bg-yellow-500/10 flex items-center gap-2.5 transition">
                            🚫 Danh Sách Chặn (Blacklist IP)
                        </button>
                    </div>
                    <div class="text-[10px] text-center text-red-300/40 pb-2">Version 3.0 Enterprise</div>
                </div>

                <!-- Content Phải (Table Data) -->
                <div class="flex-1 flex flex-col overflow-hidden bg-[#090202]">
                    <div class="p-6 border-b border-yellow-500/20 bg-[#120505]/40 flex items-center justify-between">
                        <div>
                            <h2 id="entHeaderTitle" class="text-base font-extrabold text-yellow-300">Quản Lý Tài Khoản Người Dùng</h2>
                            <p id="entHeaderDesc" class="text-xs text-red-200/60 mt-0.5">Theo dõi, kiểm soát và cấp quyền hoặc khóa tài khoản vi phạm.</p>
                        </div>
                        <button onclick="refreshEnterpriseContent()" class="bg-yellow-500/20 border border-yellow-400/40 hover:bg-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded-xl text-xs font-bold transition">🔄 Làm Mới Dữ Liệu</button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-6">
                        <div class="bg-[#140606] border border-yellow-500/20 rounded-2xl overflow-hidden shadow-2xl">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr class="bg-red-950/80 border-b border-yellow-500/20 text-yellow-300">
                                            <th class="p-3.5 font-extrabold">NGƯỜI DÙNG / TÊN</th>
                                            <th class="p-3.5 font-extrabold">EMAIL ĐĂNG KÝ</th>
                                            <th class="p-3.5 font-extrabold">MÃ THIẾT BỊ (DEVICE ID)</th>
                                            <th class="p-3.5 font-extrabold">TRẠNG THÁI</th>
                                            <th class="p-3.5 font-extrabold text-right">THAO TÁC QUẢN TRỊ</th>
                                        </tr>
                                    </thead>
                                    <tbody id="entTableBody" class="divide-y divide-yellow-500/10 text-red-100">
                                        <tr><td colspan="5" class="p-6 text-center text-yellow-300/60">Đang tải dữ liệu từ Cloud Database...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', enterpriseHTML);
    document.getElementById('closeEnterprisePage').onclick = () => document.getElementById('enterpriseAdminPage').remove();

    loadEnterpriseUsersTable();
}

let currentEnterpriseTab = 'users';

window.switchEnterpriseTab = function(tab) {
    currentEnterpriseTab = tab;
    const btnUsers = document.getElementById('entTabUsers');
    const btnBlacklist = document.getElementById('entTabBlacklist');
    const title = document.getElementById('entHeaderTitle');
    const desc = document.getElementById('entHeaderDesc');

    if (tab === 'users') {
        btnUsers.className = "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-yellow-300 bg-yellow-500/20 border border-yellow-400/40 flex items-center gap-2.5 transition";
        btnBlacklist.className = "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-200 hover:bg-yellow-500/10 flex items-center gap-2.5 transition";
        title.innerText = "Quản Lý Tài Khoản Người Dùng";
        desc.innerText = "Theo dõi, kiểm soát và cấp quyền hoặc khóa tài khoản vi phạm.";
        loadEnterpriseUsersTable();
    } else {
        btnBlacklist.className = "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-yellow-300 bg-yellow-500/20 border border-yellow-400/40 flex items-center gap-2.5 transition";
        btnUsers.className = "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-200 hover:bg-yellow-500/10 flex items-center gap-2.5 transition";
        title.innerText = "Danh Sách Thiết Bị Bị Chặn (Blacklist IP)";
        desc.innerText = "Quản lý các thiết bị/IP bị hệ thống cấm truy cập.";
        loadEnterpriseBlacklistTable();
    }
}

window.refreshEnterpriseContent = function() {
    if (currentEnterpriseTab === 'users') loadEnterpriseUsersTable();
    else loadEnterpriseBlacklistTable();
}

// Bảng Users
async function loadEnterpriseUsersTable() {
    const tbody = document.getElementById('entTableBody');
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-yellow-300/60">Đang tải danh sách người dùng...</td></tr>`;
    try {
        const snapshot = await db.collection('tet_users').get();
        tbody.innerHTML = "";
        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-300/60">Chưa có người dùng nào đăng ký.</td></tr>`;
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const isBanned = data.banned === true;
            tbody.innerHTML += `
                <tr class="hover:bg-red-950/40 transition">
                    <td class="p-3.5 font-bold text-yellow-200">${data.name}</td>
                    <td class="p-3.5 text-red-200/80">${data.email}</td>
                    <td class="p-3.5 font-mono text-[11px] text-yellow-100/60">${data.deviceId || 'N/A'}</td>
                    <td class="p-3.5">
                        <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${isBanned ? 'bg-red-600/30 text-red-400 border border-red-500/40' : 'bg-green-600/30 text-green-400 border border-green-500/40'}">
                            ${isBanned ? 'ĐÃ KHÓA' : 'ĐANG HOẠT ĐỘNG'}
                        </span>
                    </td>
                    <td class="p-3.5 text-right">
                        <button onclick="toggleEntBanUser('${data.email}', '${data.deviceId || ''}', ${!isBanned})" class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold ${isBanned ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} shadow transition">
                            ${isBanned ? 'Mở Khóa' : 'Khóa Nick & IP'}
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-400">Lỗi tải dữ liệu từ Cloud.</td></tr>`;
    }
}

// Bảng Blacklist IP
async function loadEnterpriseBlacklistTable() {
    const tbody = document.getElementById('entTableBody');
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-yellow-300/60">Đang tải danh sách thiết bị chặn...</td></tr>`;
    try {
        const snapshot = await db.collection('tet_blacklist').get();
        tbody.innerHTML = "";
        let count = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.banned) {
                count++;
                tbody.innerHTML += `
                    <tr class="hover:bg-red-950/40 transition">
                        <td class="p-3.5 font-mono font-bold text-red-400">${doc.id}</td>
                        <td class="p-3.5 text-red-200/80">${data.email || 'Không rõ'}</td>
                        <td class="p-3.5 text-yellow-100/60">Thiết bị bị cấm vĩnh viễn</td>
                        <td class="p-3.5">
                            <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-red-600/30 text-red-400 border border-red-500/40">BỊ CHẶN IP</span>
                        </td>
                        <td class="p-3.5 text-right">
                            <button onclick="unbanEntDevice('${doc.id}')" class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-green-600 hover:bg-green-700 text-white shadow transition">
                                Gỡ Chặn IP
                            </button>
                        </td>
                    </tr>
                `;
            }
        });
        if (count === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-yellow-300/60">Chưa có thiết bị nào bị đưa vào danh sách đen.</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-red-400">Lỗi tải danh sách chặn.</td></tr>`;
    }
}

window.toggleEntBanUser = async function(email, deviceId, banStatus) {
    try {
        await db.collection('tet_users').doc(email).update({ banned: banStatus });
        if (deviceId) {
            await db.collection('tet_blacklist').doc(deviceId).set({ banned: banStatus, email: email, updatedAt: Date.now() });
        }
        alert(banStatus ? `Đã khóa tài khoản ${email} và vô hiệu hóa thiết bị thành công!` : `Đã mở khóa tài khoản thành công!`);
        refreshEnterpriseContent();
    } catch (e) {
        alert("Không thể thay đổi trạng thái.");
    }
}

window.unbanEntDevice = async function(deviceId) {
    try {
        await db.collection('tet_blacklist').doc(deviceId).update({ banned: false });
        const q = await db.collection('tet_users').where('deviceId', '==', deviceId).get();
        if (!q.empty) {
            await q.docs[0].ref.update({ banned: false });
        }
        alert("Đã gỡ chặn thiết bị thành công!");
        refreshEnterpriseContent();
    } catch (e) {
        alert("Không thể gỡ chặn thiết bị.");
    }
}

window.onload = function() {
    const savedUser = localStorage.getItem('tet_current_user');
    if(savedUser) document.getElementById('userDisplayName').innerText = savedUser;
    renderAdminControlBtn();
    loadLeaderboardRealtime();
    loadChatRealtime();
    checkCheckinStatus();
};

window.onclick = function(e) {
    if (e.target === authModal) { authModal.classList.add('hidden'); }
    if (!document.getElementById('authStatusContainer').contains(e.target)) { document.getElementById('userDropdownMenu').classList.add('hidden'); }
};

// --- BẢNG VÀNG ĐỒNG BỘ REALTIME ---
function loadLeaderboardRealtime() {
    db.collection('tet_leaderboard').orderBy('streak', 'desc').onSnapshot(snapshot => {
        const container = document.getElementById('leaderboardList');
        container.innerHTML = "";
        if (snapshot.empty) {
            container.innerHTML = `<div class="text-center text-red-300/60">Chưa có ai điểm danh.</div>`;
            return;
        }
        let index = 0;
        snapshot.forEach(doc => {
            const item = doc.data();
            let medalColor = "text-yellow-300";
            if(index === 0) medalColor = "text-yellow-400 font-extrabold";
            else if(index === 1) medalColor = "text-gray-300 font-bold";
            else if(index === 2) medalColor = "text-amber-600 font-bold";

            container.innerHTML += `
                <div class="flex items-center justify-between p-1.5 rounded-xl bg-red-950/60 border border-yellow-500/20 text-[11px]">
                    <div class="flex items-center gap-2">
                        <span class="w-5 text-center font-bold ${medalColor}">#${index + 1}</span>
                        <span class="font-semibold text-yellow-100">${item.name}</span>
                    </div>
                    <span class="text-[10px] text-yellow-300 font-bold">🔥 ${item.streak} Ngày</span>
                </div>
            `;
            index++;
        });
    });
}

const checkinBtn = document.getElementById('checkinBtn');
const checkinStatusBox = document.getElementById('checkinStatusBox');

function checkCheckinStatus() {
    const username = localStorage.getItem('tet_current_user');
    const today = new Date().toDateString();
    const lastCheckin = localStorage.getItem('tet_last_checkin_' + username);

    if (username && lastCheckin === today) {
        checkinStatusBox.innerText = "✅ Hôm nay đã điểm danh!";
        checkinBtn.innerText = "Đã Điểm Danh";
        checkinBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        checkinStatusBox.innerText = "Chưa điểm danh...";
        checkinBtn.innerText = "Điểm Danh Ngay";
        checkinBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Điểm danh (Kiểm tra chống ban realtime)
checkinBtn.onclick = async function() {
    const username = localStorage.getItem('tet_current_user');
    const email = localStorage.getItem('tet_current_email');
    if (!username) {
        showModal("Yêu Cầu Đăng Nhập", "Vui lòng đăng nhập tài khoản trước khi điểm danh!", "fa-user-lock");
        return;
    }

    const isAdmin = localStorage.getItem('tet_is_admin') === 'true';
    if (!isAdmin) {
        try {
            const blackDoc = await db.collection('tet_blacklist').doc(clientDeviceID).get();
            if (blackDoc.exists && blackDoc.data().banned === true) {
                localStorage.clear();
                showModal("Thiết Bị Bị Khóa", "Thiết bị của bạn đã bị đưa vào danh sách đen!", "fa-user-lock");
                setTimeout(() => location.reload(), 2000);
                return;
            }

            let userDoc = null;
            if (email) userDoc = await db.collection('tet_users').doc(email).get();
            if (userDoc && userDoc.exists && userDoc.data().banned === true) {
                localStorage.clear();
                showModal("Tài Khoản Bị Khóa", "Tài khoản của bạn đã bị khóa vĩnh viễn!", "fa-user-lock");
                setTimeout(() => location.reload(), 2000);
                return;
            }
        } catch(e) {}
    }

    const today = new Date().toDateString();
    const lastCheckin = localStorage.getItem('tet_last_checkin_' + username);

    if (lastCheckin === today) {
        showModal("Thông Báo", "Hôm nay bạn đã điểm danh rồi, hãy quay lại vào ngày mai nhé!");
        return;
    }

    localStorage.setItem('tet_last_checkin_' + username, today);
    
    try {
        const ref = db.collection('tet_leaderboard').doc(username);
        const doc = await ref.get();
        if (doc.exists) {
            const currentStreak = doc.data().streak || 0;
            await ref.update({ 
                name: username,
                streak: currentStreak + 1 
            });
        } else {
            await ref.set({ 
                name: username, 
                streak: 1 
            });
        }
        checkCheckinStatus();
        showModal("Điểm Danh Thành Công", `Chúc mừng ${username} đã tăng ngày streak trên bảng vàng!`, "fa-award");
    } catch (e) {
        showModal("Lỗi", "Không thể ghi điểm danh lên cloud.");
    }
};

// --- PHÒNG CHAT CHUNG REALTIME ---
function loadChatRealtime() {
    const box = document.getElementById('chatMessagesBox');
    
    db.collection('tet_chat').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        let htmlContent = `
            <div class="flex items-start gap-2">
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 border-2 border-white flex items-center justify-center text-red-950 font-black text-xs flex-shrink-0 shadow-lg animate-pulse">👑</div>
                <div class="bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 border-2 border-yellow-400 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-left shadow-2xl">
                    <div class="text-[10px] text-yellow-300 font-black mb-1 flex items-center gap-1 flex-wrap tracking-wider">
                        <span>👑 ADMIN DUNGHOET</span> 
                        <span class="bg-yellow-400 text-red-950 px-1.5 py-0.2 rounded text-[8px] font-extrabold shadow">TỐI CAO</span>
                    </div>
                    <div class="text-yellow-100 text-xs font-semibold">Chào anh em! Hệ thống bảo mật toàn quyền đã kích hoạt. 🎉</div>
                    <div class="text-[8px] text-yellow-300/70 text-right mt-1">Vừa xong</div>
                </div>
            </div>
        `;
        const current = localStorage.getItem('tet_current_user');
        
        snapshot.forEach(doc => {
            const msg = doc.data();
            const msgId = doc.id;
            if ((Date.now() - msg.timestamp) < 300000) {
                const isOwnerAdmin = msg.sender.includes('Admin') || msg.sender.includes('TỐI CAO');
                const isSelf = msg.sender === current;
                
                const avatarChar = isOwnerAdmin ? '👑' : msg.sender.charAt(0).toUpperCase();
                const avatarBg = isOwnerAdmin ? 'w-9 h-9 bg-gradient-to-tr from-yellow-500 to-amber-300 border-2 border-white text-red-950 text-xs shadow-lg animate-pulse' : (isSelf ? 'w-7 h-7 bg-amber-500/30 border-amber-400 text-yellow-200 text-[10px]' : 'w-7 h-7 bg-red-500/30 border-red-400 text-yellow-300 text-[10px]');
                const bubbleBg = isOwnerAdmin ? 'bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 border-2 border-yellow-400 shadow-xl' : (isSelf ? 'bg-amber-900/90 border-amber-400/50 rounded-tr-none' : 'bg-red-950/80 border-yellow-500/30 rounded-tl-none');

                let deleteBtnHtml = '';
                if (localStorage.getItem('tet_is_admin') === 'true') {
                    deleteBtnHtml = `<button onclick="deleteChatMessage('${msgId}')" class="ml-2 text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-bold hover:bg-red-700 shadow">🗑️ Xóa</button>`;
                }

                htmlContent += `
                    <div class="flex items-start gap-2 ${isSelf ? 'flex-row-reverse' : ''}">
                        <div class="${avatarBg} rounded-full flex items-center justify-center font-bold flex-shrink-0">${avatarChar}</div>
                        <div class="${bubbleBg} border p-2.5 rounded-2xl max-w-[85%] text-left relative group">
                            <div class="${isOwnerAdmin ? 'text-[11px] text-yellow-300 font-black tracking-wide' : (isSelf ? 'text-[9px] text-amber-300 font-bold' : 'text-[9px] text-yellow-400 font-bold')} mb-0.5 flex justify-between items-center gap-1 flex-wrap">
                                <span>${msg.sender} ${isOwnerAdmin ? '👑 TỐI CAO' : ''}</span>
                                ${deleteBtnHtml}
                            </div>
                            <div class="${isOwnerAdmin ? 'text-yellow-100 text-xs font-semibold' : 'text-red-100 text-[11px]'} break-words">${msg.text}</div>
                            <div class="text-[8px] text-red-300/60 ${isSelf ? 'text-left' : 'text-right'} mt-1">${msg.time}</div>
                        </div>
                    </div>
                `;
            }
        });
        box.innerHTML = htmlContent;
        box.scrollTop = box.scrollHeight;
    });
}

window.deleteChatMessage = async function(msgId) {
    if (confirm("Admin có chắc chắn muốn xóa tin nhắn này không?")) {
        try {
            await db.collection('tet_chat').doc(msgId).delete();
        } catch (e) {
            alert("Không thể xóa tin nhắn.");
        }
    }
}

// --- HỆ THỐNG GỬI TIN NHẮN (Kiểm tra realtime chống ban & rate limit) ---
let chatTimestamps = [];

document.getElementById('chatForm').onsubmit = async function(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const username = localStorage.getItem('tet_current_user');
    const email = localStorage.getItem('tet_current_email');
    if (!username) {
        showModal("Yêu Cầu Đăng Nhập", "Bạn cần đăng nhập tài khoản để nhắn tin trò chuyện!", "fa-user-lock");
        return;
    }

    const isAdmin = localStorage.getItem('tet_is_admin') === 'true';

    // Kiểm tra trạng thái bị ban thiết bị hoặc tài khoản trên Cloud trước khi cho chat
    if (!isAdmin) {
        try {
            const blackDoc = await db.collection('tet_blacklist').doc(clientDeviceID).get();
            if (blackDoc.exists && blackDoc.data().banned === true) {
                localStorage.clear();
                showModal("Thiết Bị Bị Khóa", "Thiết bị của bạn đã bị đưa vào danh sách đen!", "fa-user-lock");
                setTimeout(() => location.reload(), 2000);
                return;
            }

            let userDoc = null;
            if (email) {
                userDoc = await db.collection('tet_users').doc(email).get();
            }
            if (!userDoc || !userDoc.exists) {
                const q = await db.collection('tet_users').where('name', '==', username).get();
                if (!q.empty) {
                    userDoc = q.docs[0];
                }
            }

            if (userDoc && userDoc.exists && userDoc.data().banned === true) {
                localStorage.removeItem('tet_current_user');
                localStorage.removeItem('tet_current_email');
                showModal("Tài Khoản Bị Khóa", "Tài khoản của bạn đã bị Admin cấm vĩnh viễn khỏi hệ thống!", "fa-user-lock");
                setTimeout(() => location.reload(), 2000);
                return;
            }
        } catch (err) {}
    }

    const now = Date.now();
    if (!isAdmin) {
        chatTimestamps = chatTimestamps.filter(t => now - t < 5000);
        if (chatTimestamps.length >= 3) {
            showModal("Phát Hiện Spam", "Phát hiện hành vi gửi tin nhắn liên tục bất thường! Hệ thống khóa tạm thời yêu cầu đợi 15 giây.", "fa-shield-halved");
            return;
        }
        if (chatTimestamps.length > 0 && now - chatTimestamps[chatTimestamps.length - 1] < 2000) {
            showModal("Thao Tác Quá Nhanh", "Vui lòng từ tốn, mỗi tin nhắn cách nhau ít nhất 2 giây!", "fa-triangle-exclamation");
            return;
        }
        chatTimestamps.push(now);
    }

    const senderName = isAdmin ? 'Admin Dunghoet Tối Cao 👑' : username;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    try {
        await db.collection('tet_chat').add({
            sender: senderName,
            text: text,
            time: timeStr,
            timestamp: Date.now()
        });
        input.value = "";
    } catch (err) {
        showModal("Lỗi", "Không thể gửi tin nhắn lên server.");
    }
};

const queList = [
    "Quẻ Đại Cát: Công thành danh toạ, tài lộc dồi dào, vạn sự hanh thông suốt cả năm Đinh Mùi!",
    "Quẻ Phát Tài: Tiền vô như nước, kinh doanh hồng phát, gia đạo bình an thịnh vượng.",
    "Quẻ Bình An: Sức khỏe dồi dào, tai qua nạn khỏi, gia đình hạnh phúc viên mãn.",
    "Quẻ Tấn Thới: Học hành tiến tới, công danh thăng tiến, gặp dữ hóa lành.",
    "Quẻ Như Ý: Cầu được ước thấy, mọi mưu sự đều đạt kết quả tốt đẹp ngoài mong đợi."
];
document.getElementById('rutQueBtn').onclick = function() {
    const randomQue = queList[Math.floor(Math.random() * queList.length)];
    document.getElementById('queResultBox').innerText = randomQue;
    showModal("Quẻ Thẻ Đầu Năm 2027", randomQue, "fa-scroll");
};

document.getElementById('supportBtn').onclick = function() {
    window.open(MY_LINK4M_URL, '_blank');
};

// Pháo hoa siêu nhẹ chống lag
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.025 + 0.02;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += 0.08; this.alpha -= this.decay;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

let particles = [];
function createFirework(x, y) {
    if (particles.length > 50) return;
    const colors = ['#FBBF24', '#EF4444', '#10B981', '#3B82F6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function animateFireworks() {
    ctx.fillStyle = 'rgba(23, 2, 2, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        } else {
            p.update(); p.draw();
        }
    }
    requestAnimationFrame(animateFireworks);
}
animateFireworks();

setInterval(() => {
    createFirework(Math.random() * canvas.width * 0.8 + canvas.width * 0.1, Math.random() * canvas.height * 0.4);
}, 4000);
