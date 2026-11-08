const MY_LINK4M_URL = "https://link4m.net/JtoYhsH";

// --- CẤU HÌNH FIREBASE CLOUD DATABASE (ONLINE REALTIME) ---
const firebaseConfig = {
    apiKey: "AIzaSyD-Tết2027DemoKeyOnlineRealtimeABC",
    authDomain: "tet2027-online.firebaseapp.com",
    projectId: "tet2027-online",
    storageBucket: "tet2027-online.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef"
};
// Khởi tạo Firebase (Sử dụng Firestore công khai cho dự án web Tết)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

// Quản lý Modal thông báo
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

// --- HỆ THỐNG XÁC THỰC TÀI KHOẢN (LƯU TRÊN FIREBASE CLOUD) ---
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

// Đăng ký tài khoản lên Cloud Database
document.getElementById('submitRegister').onclick = async function() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value.trim();

    if (!name) { showModal("Lỗi", "Vui lòng nhập tên hiển thị!"); return; }
    if (!isValidEmail(email)) { showModal("Lỗi Định Dạng", "Email không hợp lệ (cần chứa @ và .)"); return; }
    if (pass.length < 4) { showModal("Lỗi", "Mật khẩu phải từ 4 ký tự trở lên!"); return; }

    try {
        const userRef = db.collection('tet_users').doc(email);
        const doc = await userRef.get();
        if (doc.exists) {
            showModal("Lỗi Đăng Ký", "Email này đã được đăng ký tài khoản trước đó rồi!");
            return;
        }

        await userRef.set({ name, email, pass });
        authModal.classList.add('hidden');
        showModal("Đăng Ký Thành Công", `Tài khoản ${name} đã được tạo trên hệ thống online! Hãy đăng nhập.`, "fa-face-smile-beam");
        document.getElementById('tabLogin').click();
    } catch (error) {
        showModal("Lỗi Kết Nối", "Không thể kết nối đến máy chủ cloud. Vui lòng thử lại!");
    }
};

// Đăng nhập từ Cloud Database
document.getElementById('submitLogin').onclick = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    if (!isValidEmail(email)) { showModal("Lỗi", "Email đăng nhập không hợp lệ!"); return; }
    if (!pass) { showModal("Lỗi", "Vui lòng nhập mật khẩu!"); return; }

    try {
        const userRef = db.collection('tet_users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists || doc.data().pass !== pass) {
            showModal("Đăng Nhập Thất Bại", "Email hoặc mật khẩu không chính xác!");
            return;
        }

        const userData = doc.data();
        localStorage.setItem('tet_current_user', userData.name);
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
    document.getElementById('userDisplayName').innerText = 'Đăng Nhập';
    document.getElementById('userDropdownMenu').classList.add('hidden');
    checkCheckinStatus();
    showModal("Đã Thoát", "Đã đăng xuất tài khoản khỏi thiết bị.");
};

window.onload = function() {
    const savedUser = localStorage.getItem('tet_current_user');
    if(savedUser) document.getElementById('userDisplayName').innerText = savedUser;
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

checkinBtn.onclick = async function() {
    const username = localStorage.getItem('tet_current_user');
    if (!username) {
        showModal("Yêu Cầu Đăng Nhập", "Vui lòng đăng nhập tài khoản trước khi điểm danh!", "fa-user-lock");
        return;
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
            await ref.update({ streak: doc.data().streak + 1 });
        } else {
            await ref.set({ name: username, streak: 1 });
        }
        checkCheckinStatus();
        showModal("Điểm Danh Thành Công", `Chúc mừng ${username} đã tăng ngày streak trên bảng vàng toàn cầu!`, "fa-award");
    } catch (e) {
        showModal("Lỗi", "Không thể ghi điểm danh lên cloud.");
    }
};

// --- PHÒNG CHAT CHUNG REALTIME ---
function loadChatRealtime() {
    const box = document.getElementById('chatMessagesBox');
    const now = Date.now();
    
    db.collection('tet_chat').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        let htmlContent = `
            <div class="flex items-start gap-2">
                <div class="w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-yellow-300 font-bold text-[10px] flex-shrink-0">AD</div>
                <div class="bg-red-950/80 border border-yellow-500/30 p-2.5 rounded-2xl rounded-tl-none max-w-[85%] text-left shadow">
                    <div class="text-[9px] text-yellow-400 font-bold mb-0.5">Admin Web Tết 🧧</div>
                    <div class="text-red-100 text-[11px]">Chào mọi người! Tin nhắn đồng bộ trực tuyến toàn cầu! 🎉</div>
                    <div class="text-[8px] text-red-300/60 text-right mt-1">Vừa xong</div>
                </div>
            </div>
        `;
        const current = localStorage.getItem('tet_current_user');
        
        snapshot.forEach(doc => {
            const msg = doc.data();
            // Lọc tự động xóa tin nhắn sau 5 phút (300000 ms)
            if ((Date.now() - msg.timestamp) < 300000) {
                const isSelf = msg.sender === current;
                const avatarChar = msg.sender.charAt(0).toUpperCase();
                const avatarBg = isSelf ? 'bg-amber-500/30 border-amber-400 text-yellow-200' : 'bg-red-500/30 border-red-400 text-yellow-300';
                const bubbleBg = isSelf ? 'bg-amber-900/90 border-amber-400/50 rounded-tr-none' : 'bg-red-950/80 border-yellow-500/30 rounded-tl-none';

                htmlContent += `
                    <div class="flex items-start gap-2 ${isSelf ? 'flex-row-reverse' : ''}">
                        <div class="w-7 h-7 rounded-full ${avatarBg} border flex items-center justify-center font-bold text-[10px] flex-shrink-0">${avatarChar}</div>
                        <div class="${bubbleBg} border p-2.5 rounded-2xl max-w-[85%] text-left shadow">
                            <div class="text-[9px] ${isSelf ? 'text-amber-300' : 'text-yellow-400'} font-bold mb-0.5">${msg.sender}</div>
                            <div class="text-red-100 text-[11px] break-words">${msg.text}</div>
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

document.getElementById('chatForm').onsubmit = async function(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const username = localStorage.getItem('tet_current_user');
    if (!username) {
        showModal("Yêu Cầu Đăng Nhập", "Bạn cần đăng nhập tài khoản để nhắn tin trò chuyện!", "fa-user-lock");
        return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
        await db.collection('tet_chat').add({
            sender: username,
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
