/*
===============================================================================
STUDYMATE — CẤU HÌNH DỊCH VỤ (CHỈ SỬA TRONG KHỐI NÀY)
- Firebase: dán nguyên firebaseConfig từ Firebase Console > Project settings > Your apps.
- EmailJS: dùng Public Key + Service ID + Template ID trong dashboard EmailJS.
- OneSignal: dùng App ID trong OneSignal > Settings > Keys & IDs.
LƯU Ý: KHÔNG dán OneSignal REST API Key, Firebase Admin SDK private key hoặc mật khẩu
vào frontend. Các khóa bí mật chỉ được đặt ở backend/server.
===============================================================================
*/
const STUDYMATE_CONFIG = {
  firebase: {
    apiKey: "AIzaSyB4QNiATSNKFcTzEmqPOsqbsV9KH4p0-iM",
    authDomain: "studymate-209b6.firebaseapp.com",
    projectId: "studymate-209b6",
    storageBucket: "studymate-209b6.firebasestorage.app",
    messagingSenderId: "458359250086",
    appId: "1:458359250086:web:1cd45ef64c6948532ba867",
    measurementId: "G-DREJY2E46W"
  },
  emailjs: {
    publicKey: "KDB1p6acCE9CdHZhk",
    serviceId: "service_k5w9gqn",
    templateId: "template_8v5iu9f"
  },
  oneSignal: {
    appId: "e60f9cb6-8b65-4e57-8aef-88c5beab5a7a"
  }
};

const firebaseConfig = STUDYMATE_CONFIG.firebase;

if (typeof firebase !== "undefined") {
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
}
var auth = (typeof firebase !== "undefined" && firebase.auth) ? firebase.auth() : null;
var db = (typeof firebase !== "undefined" && firebase.firestore) ? firebase.firestore() : null;

let oneSignalReady = false;
window.OneSignalDeferred = window.OneSignalDeferred || [];
function initOneSignal() {
    if (!STUDYMATE_CONFIG.oneSignal.appId || !window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async function (OneSignal) {
        try {
            if (!oneSignalReady) {
                await OneSignal.init({
                    appId: STUDYMATE_CONFIG.oneSignal.appId,
                    serviceWorkerPath: "./sw.js",
                    serviceWorkerParam: { scope: "/" }
                });
                oneSignalReady = true;
            }
        } catch (err) {
            console.warn("OneSignal chưa khởi tạo được. Kiểm tra domain HTTPS, worker và App ID.", err);
        }
    });
}
initOneSignal();
function promptOneSignalPermission() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    window.OneSignalDeferred.push(async function (OneSignal) {
        try {
            if (OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === "function") {
                await OneSignal.Slidedown.promptPush();
            }
        } catch (err) { console.debug("OneSignal permission prompt was skipped", err); }
    });
}

let currentUser = null; 

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn("Service worker chưa đăng ký được.", err));
}

function toggleVis(id) { const el=document.getElementById(id); el.type=el.type==='password'?'text':'password'; el.nextElementSibling.innerText = el.type==='password'?'HIỆN':'ẨN';}
function playNotificationSound(soundType = 'ting') {
    // Âm thanh trong trang chỉ phát được khi trình duyệt cho phép phát audio.
    try {
        const audio = document.getElementById(soundType === 'ring' ? 'snd-ring' : 'snd-ting');
        if (audio) { audio.currentTime = 0; const result = audio.play(); if (result && result.catch) result.catch(() => {}); }
    } catch (e) {}
}

async function showPhoneNotification(title, bodyMsg, soundType = 'ting', tag = '') {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const options = {
        body: bodyMsg,
        icon: './logo.png',
        badge: './logo.png',
        vibrate: soundType === 'ring' ? [350, 150, 350, 150, 500] : [120, 80, 120],
        requireInteraction: soundType === 'ring',
        tag: tag || `studymate-${Date.now()}`,
        renotify: true,
        data: { source: 'studymate' }
    };
    try {
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(title, options);
        } else {
            new Notification(title, options);
        }
    } catch (e) {
        // Trình duyệt có thể chặn notification nếu chưa cấp quyền hoặc chưa dùng HTTPS.
        console.warn('Không hiển thị được thông báo trên điện thoại:', e);
    }
}

function pushNotify(title, bodyMsg, soundType = 'ting') {
    playNotificationSound(soundType);
    showPhoneNotification(title, bodyMsg, soundType, soundType === 'ring' ? 'studymate-pomodoro-finished' : '');
}

const EMAILJS_SERVICE_ID = STUDYMATE_CONFIG.emailjs.serviceId;
const EMAILJS_TEMPLATE_ID = STUDYMATE_CONFIG.emailjs.templateId;
let isEmailReady = false;
try {
    if (typeof emailjs !== 'undefined' && STUDYMATE_CONFIG.emailjs.publicKey) {
        emailjs.init(STUDYMATE_CONFIG.emailjs.publicKey);
        isEmailReady = true;
    }
} catch(err) { console.warn("EmailJS chưa khởi tạo được.", err); }

async function forgotPassword() {
    const e = prompt("Nhập email cậu đã dùng để đăng ký:"); if (!e) return;
    auth.sendPasswordResetEmail(e).then(() => {
        alert("✅ Đã gửi một link đặt lại mật khẩu đến Email của cậu. Hãy kiểm tra Hộp thư đến (hoặc Spam).");
    }).catch(err => {
        alert("❌ Lỗi: Có thể email này chưa được đăng ký hoặc sai định dạng.");
    });
}

const ALL_SUBJECTS = ["Toán", "Văn", "NgoaiNgu", "Sinh", "Lý", "Hóa", "Sử", "Địa", "Tin", "KinhTe"];
const SUBJ_LABELS = {"Toán":"Toán", "Văn":"Văn", "NgoaiNgu":"Ng.Ngữ", "Sinh":"Sinh", "Lý":"Lý", "Hóa":"Hóa", "Sử":"Sử", "Địa":"Địa", "Tin":"Tin", "KinhTe":"KT&PL"};
const SUBJ_COLORS = {"Toán":"#f87171", "Văn":"#60a5fa", "NgoaiNgu":"#fbbf24", "Sinh":"#34d399", "Lý":"#a78bfa", "Hóa":"#f472b6", "Sử":"#fb923c", "Địa":"#2dd4bf", "Tin":"#94a3b8", "KinhTe":"#fcd34d"};

let state = { em:"", nm:"", scl:"", cls:"", coins:50, en:50, hp:50, curPet:"pet_white", eq:{neck:"", aura:"", eyes:"", head:"", hair:""}, myPets:["pet_white"], myItems:[], inventory:{}, savedLib:[], todos:[], tkb:[], studyHours:{}, weeklyGoals:{}, activeGoals:["Toán", "Văn", "NgoaiNgu"], exams:[], studyByDay:{}, goalsPeriodStart:"", dailyResetDate:"", notificationLog:{}, pomoBreak:null };
ALL_SUBJECTS.forEach(s => state.weeklyGoals[s] = 1);
let authM = 'LOGIN';

window.onload = function() {
    if (!auth) { console.error("Firebase chưa được tải. Kiểm tra cấu hình và kết nối mạng."); return; }
    auth.onAuthStateChanged(user => {
        if (user) {
            if (user.emailVerified) {
                currentUser = user;
                loadUserDataFromCloud(user.uid, user.email);
            } else {
                auth.signOut();
            }
        }
    });
}

function loadUserDataFromCloud(uid, email) {
    db.collection('users').doc(uid).get().then((doc) => {
        if (doc.exists) state = doc.data();
        else state.em = email;
        normalizeUserState();
        applyDailyPetReset();
        document.getElementById('step-auth').classList.add('hidden');
        if (doc.exists) startMain();
        else document.getElementById('step-info').classList.remove('hidden');
    }).catch(err => {
        console.error("Không tải được dữ liệu Firebase:", err);
        alert("Chưa tải được dữ liệu. Kiểm tra kết nối mạng hoặc quyền Firestore rồi thử lại.");
    });
}

function switchAuthTab(m) {
    authM = m; document.getElementById('auth-btn-submit').innerText = m==='LOGIN'?'Đăng Nhập':'Đăng Ký';
    document.getElementById('auth-repass-field').classList[m==='LOGIN'?'add':'remove']('hidden');
    document.getElementById('tab-login').className = m==='LOGIN'?"flex-1 py-2 text-xs font-bold rounded-xl bg-white text-slate-800 shadow-sm border border-slate-200":"flex-1 py-2 text-xs font-bold rounded-xl text-slate-500 border border-transparent";
    document.getElementById('tab-register').className = m==='REGISTER'?"flex-1 py-2 text-xs font-bold rounded-xl bg-white text-slate-800 shadow-sm border border-slate-200":"flex-1 py-2 text-xs font-bold rounded-xl text-slate-500 border border-transparent";
}

function checkPass(p) { return p.length>=8 && /\d/.test(p) && /[!@#$%^&*(),.?":{}|<>]/.test(p); }

function handleAuth() {
    const e=document.getElementById('auth-email').value.trim(), p=document.getElementById('auth-pass').value;
    const authStatus = document.getElementById('auth-status');
    authStatus.innerText = "Đang xử lý...";
    if(!e||!p) return authStatus.innerText = "Nhập đủ Email và Mật khẩu!";
    
    if(authM === 'REGISTER') {
        const rp=document.getElementById('auth-repass').value;
        if(!checkPass(p)) return authStatus.innerText = "Mật khẩu cần 8 ký tự, có số và ký tự đặc biệt.";
        if(p!==rp) return authStatus.innerText = "Mật khẩu không khớp!";
        
        auth.createUserWithEmailAndPassword(e, p).then((uc) => {
            uc.user.sendEmailVerification().then(() => {
                alert("✅ ĐĂNG KÝ THÀNH CÔNG!\nHệ thống đã gửi một Email Xác nhận đến hòm thư của cậu.\n\n⚠️ BẮT BUỘC bấm vào link trong email để kích hoạt tài khoản.");
                auth.signOut(); authStatus.innerText = ""; switchAuthTab('LOGIN');
            });
        }).catch(err => authStatus.innerText = "Lỗi: " + err.message);
    } else {
        auth.signInWithEmailAndPassword(e, p).then((uc) => {
            if (!uc.user.emailVerified) {
                alert("❌ EMAIL CHƯA ĐƯỢC XÁC THỰC!\nTìm thư từ StudyMate và click vào link xác nhận.");
                auth.signOut(); authStatus.innerText = "Yêu cầu xác thực Email!"; return;
            }
            authStatus.innerText = "Đang tải dữ liệu...";
            currentUser = uc.user;
            loadUserDataFromCloud(currentUser.uid, e);
        }).catch(err => authStatus.innerText = "Sai Email hoặc Mật khẩu!");
    }
}

function logOut() { auth.signOut().then(() => location.reload()); }

function saveInfoAndStartTest() {
    const n=document.getElementById('input-name').value.trim(), s=document.getElementById('input-school').value.trim(), c=document.getElementById('input-class').value.trim();
    if(!n||!s||!c) return alert("Điền đủ thông tin nha!");
    state.nm=n; state.scl=s; state.cls=c;
    document.getElementById('step-info').classList.add('hidden'); document.getElementById('step-quiz').classList.remove('hidden');
    diagIdx=0; diagScore=0; loadDiag();
}

const diagQs = [ "Bồn chồn khi mất mạng?", "Sợ bỏ lỡ thông tin trên mạng (FOMO)?", "Áp lực trả lời tin nhắn ngay lập tức?", "Xem story bạn bè thấy tự ti/trống rỗng?", "Vô thức mở app MXH liên tục?", "Vừa học vừa bật video lướt ngắn?", "Nhủ 'lướt 5 phút' nhưng bị cuốn 30 phút?", "Khó tập trung học 25 phút không đụng máy?", "Lướt điện thoại khiến ngủ rất muộn?", "Mỏi mắt, đau nửa đầu do nhìn màn hình?", "Phản xạ kiểm tra máy ngay khi giật mình thức giấc?", "Sáng dậy uể oải dù ngủ đủ?" ];
let diagIdx=0, diagScore=0;
function loadDiag() {
    document.getElementById('quiz-progress-text').innerText=`${diagIdx+1}/12`;
    document.getElementById('quiz-progress-bar').style.width=`${((diagIdx+1)/12)*100}%`;
    document.getElementById('quiz-question-title').innerText=`Câu hỏi ${diagIdx+1}: ${diagQs[diagIdx]}`;
}
function handleDiagAnswer(v) {
    diagScore+=v; diagIdx++;
    if(diagIdx < 12) { loadDiag(); } else {
        const avg = diagScore/12;
        if(avg > 4) { state.en=20; state.hp=20; } else if(avg > 3) { state.en=40; state.hp=40; } else { state.en=70; state.hp=70; }
        if (currentUser && db) {
            normalizeUserState();
            applyDailyPetReset();
            db.collection('users').doc(currentUser.uid).set(state).then(() => {
                document.getElementById('step-quiz').classList.add('hidden'); startMain();
            }).catch(err => alert("Chưa lưu được dữ liệu. Kiểm tra Firebase/Firestore nhé."));
        }
    }
}

function normalizeUserState() {
    // Bổ sung trường mới nhưng không ghi đè dữ liệu cũ của người dùng.
    const defaults = { coins:50, en:50, hp:50, eq:{neck:"",aura:"",eyes:"",head:"",hair:""}, myPets:["pet_white"], myItems:[], inventory:{}, savedLib:[], todos:[], tkb:[], studyHours:{}, weeklyGoals:{}, activeGoals:["Toán","Văn","NgoaiNgu"], exams:[], studyByDay:{}, goalsPeriodStart: localDateKey(), dailyResetDate:"", notificationLog:{}, pomoBreak:null };
    for (const [key, value] of Object.entries(defaults)) {
        if (state[key] === undefined || state[key] === null) state[key] = Array.isArray(value) ? [...value] : (typeof value === "object" ? {...value} : value);
    }
    if (!state.eq || typeof state.eq !== "object") state.eq = {...defaults.eq};
    if (!state.weeklyGoals || typeof state.weeklyGoals !== "object") state.weeklyGoals = {};
    ALL_SUBJECTS.forEach(s => { if (!(s in state.weeklyGoals)) state.weeklyGoals[s] = 1; });
    if (!Array.isArray(state.activeGoals)) state.activeGoals = ["Toán","Văn","NgoaiNgu"];
    if (!state.studyByDay || typeof state.studyByDay !== "object") state.studyByDay = {};
    if (!state.notificationLog || typeof state.notificationLog !== "object") state.notificationLog = {};
}
function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function applyDailyPetReset() {
    const today = localDateKey();
    if (state.dailyResetDate !== today) {
        state.en = 10;
        state.hp = 10;
        state.dailyResetDate = today;
        // Coins intentionally persist across days.
        saveState();
    }
}
function saveState() {
    if (!state || typeof state !== "object") return;
    try { renderPet(); renderInventory(); renderSched(); updateShopCoin(); } catch (e) {}
    if (currentUser && db) db.collection('users').doc(currentUser.uid).set(state).catch(e => console.log("Chờ mạng đồng bộ...", e));
}

function drawSvg(content) { return `<svg viewBox="0 0 100 100" class="w-full h-full object-contain pointer-events-none drop-shadow-sm">${content}</svg>`; }
function makePet(fill, stroke, isGrad=false) {
    if(isGrad) return `<defs><linearGradient id="g_${stroke.replace('#','')}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${fill}"/><stop offset="100%" stop-color="${stroke}"/></linearGradient></defs><ellipse cx="50" cy="55" rx="45" ry="40" fill="url(#g_${stroke.replace('#','')})" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>`;
    return `<ellipse cx="50" cy="55" rx="45" ry="40" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
}

// ĐÃ KHÔI PHỤC ĐẦY ĐỦ 14 CỤC BÔNG, 17 PHỤ KIỆN VÀ 13 THỨC ĂN
const PETS = [ 
    { id: "pet_white", n: "Trắng Sứ", svg: drawSvg(makePet("#FDFBF7", "#E5DDD3")), p: 0 }, 
    { id: "pet_pink", n: "Hồng Phấn", svg: drawSvg(makePet("#FFE4E1", "#FFB6C1")), p: 50 }, 
    { id: "pet_yellow", n: "Vàng Chanh", svg: drawSvg(makePet("#FFFACD", "#F0E68C")), p: 50 }, 
    { id: "pet_green", n: "Xanh Bơ", svg: drawSvg(makePet("#E0FFF0", "#98FB98")), p: 50 }, 
    { id: "pet_blue", n: "Xanh Dương", svg: drawSvg(makePet("#E0FFFF", "#AFEEEE")), p: 50 }, 
    { id: "pet_purple", n: "Tím Mộng Mơ", svg: drawSvg(makePet("#E6E6FA", "#DDA0DD")), p: 50 }, 
    { id: "pet_gray", n: "Xám Khói", svg: drawSvg(makePet("#F0F8FF", "#B0C4DE")), p: 50 }, 
    { id: "pet_red", n: "Đỏ Ruby (Hiếm)", svg: drawSvg(makePet("#FF7F50", "#FF4500")), p: 150 }, 
    { id: "pet_emerald", n: "Lục Bảo (Hiếm)", svg: drawSvg(makePet("#40E0D0", "#20B2AA")), p: 150 }, 
    { id: "pet_brown", n: "Hạt Dẻ (Hiếm)", svg: drawSvg(makePet("#DEB887", "#D2691E")), p: 150 }, 
    { id: "pet_black", n: "Đen Tuyền (Hiếm)", svg: drawSvg(makePet("#2F4F4F", "#000000")), p: 150 }, 
    { id: "pet_silver", n: "Bạc Ngọc Trai", svg: drawSvg(makePet("#FFFFFF", "#A9A9A9", true)), p: 300 }, 
    { id: "pet_gold", n: "Vàng Hoàng Kim", svg: drawSvg(makePet("#FFD700", "#FF8C00", true)), p: 500 }, 
    { id: "pet_galaxy", n: "Vũ Trụ Galaxy", svg: drawSvg(makePet("#8A2BE2", "#FF1493", true)), p: 1000 }
];
const petFace = {
    normal: drawSvg(`<circle cx="35" cy="50" r="4.5" fill="#1E293B"/><circle cx="65" cy="50" r="4.5" fill="#1E293B"/><path d="M45 60 Q50 65 55 60" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>`),
    angry:  drawSvg(`<path d="M23 44 L38 49 L23 54" fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/><path d="M77 44 L62 49 L77 54" fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/><path d="M45 65 Q50 60 55 65" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>`),
    eating: drawSvg(`<path d="M30 48 Q35 45 40 48" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/><path d="M60 48 Q65 45 70 48" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="62" r="6" fill="#FDA4AF"/>`)
};
const ACCS = [ 
    { id: "kinh1", name: "Kính Cận Tròn", slot: "eyes", svg: drawSvg(`<circle cx="35" cy="50" r="12" fill="rgba(255,255,255,0.3)" stroke="#111" stroke-width="3"/><circle cx="65" cy="50" r="12" fill="rgba(255,255,255,0.3)" stroke="#111" stroke-width="3"/><path d="M47 50 L53 50" stroke="#111" stroke-width="3"/>`), price: 20 }, 
    { id: "kinh2", name: "Kính Râm Cool", slot: "eyes", svg: drawSvg(`<path d="M20 45 Q35 40 47 45 L35 55 Z" fill="#111"/><path d="M80 45 Q65 40 53 45 L65 55 Z" fill="#111"/><path d="M47 45 L53 45" stroke="#111" stroke-width="2"/>`), price: 30 }, 
    { id: "mu1", name: "Mũ Rơm Nông Dân", slot: "head", svg: drawSvg(`<path d="M10 35 Q50 15 90 35" fill="none" stroke="#DAA520" stroke-width="8" stroke-linecap="round"/><path d="M30 32 Q50 -10 70 32" fill="#F0E68C" stroke="#DAA520" stroke-width="2"/>`), price: 40 }, 
    { id: "mu2", name: "Mũ Lưỡi Trai Đỏ", slot: "head", svg: drawSvg(`<path d="M30 30 Q50 5 70 30 L70 35 L30 35 Z" fill="#EF4444"/><path d="M70 35 Q85 35 90 40 L30 40 Q25 35 30 35" fill="#DC2626"/>`), price: 45 },
    { id: "mu3", name: "Mũ Phù Thủy", slot: "head", svg: drawSvg(`<path d="M15 35 L85 35 L50 0 Z" fill="#4B0082"/><path d="M10 35 L90 35" stroke="#000" stroke-width="4"/><rect x="40" y="30" width="20" height="5" fill="#FFD700"/>`), price: 60 },
    { id: "mu4", name: "Mũ Cử Nhân", slot: "head", svg: drawSvg(`<path d="M50 10 L80 20 L50 30 L20 20 Z" fill="#111"/><path d="M35 25 L35 40 L65 40 L65 25" fill="#111"/><path d="M80 20 L80 40" stroke="#FFD700" stroke-width="2"/><circle cx="80" cy="40" r="3" fill="#FFD700"/>`), price: 70 },
    { id: "vuongmien1", name: "Vương Miện Vàng", slot: "head", svg: drawSvg(`<path d="M30 35 L35 10 L50 25 L65 10 L70 35 Z" fill="#FFD700" stroke="#DAA520" stroke-width="2"/><circle cx="35" cy="10" r="3" fill="#EF4444"/><circle cx="50" cy="25" r="3" fill="#3B82F6"/><circle cx="65" cy="10" r="3" fill="#EF4444"/>`), price: 100 }, 
    { id: "toc1", name: "Tai Mèo Nhỏ", slot: "hair", svg: drawSvg(`<path d="M25 30 L30 5 L45 25 Z" fill="#475569"/><path d="M75 30 L70 5 L55 25 Z" fill="#475569"/><path d="M28 26 L31 12 L40 23 Z" fill="#FBCFE8"/><path d="M72 26 L69 12 L60 23 Z" fill="#FBCFE8"/>`), price: 40 }, 
    { id: "toc2", name: "Tai Thỏ Trắng", slot: "hair", svg: drawSvg(`<ellipse cx="35" cy="15" rx="8" ry="25" fill="#FFF" stroke="#CBD5E1" stroke-width="2" transform="rotate(-15 35 15)"/><ellipse cx="65" cy="15" rx="8" ry="25" fill="#FFF" stroke="#CBD5E1" stroke-width="2" transform="rotate(15 65 15)"/><ellipse cx="35" cy="15" rx="4" ry="15" fill="#FBCFE8" transform="rotate(-15 35 15)"/><ellipse cx="65" cy="15" rx="4" ry="15" fill="#FBCFE8" transform="rotate(15 65 15)"/>`), price: 50 }, 
    { id: "toc3", name: "Kẹp Nơ Hồng", slot: "hair", svg: drawSvg(`<path d="M60 25 L75 15 L75 35 Z" fill="#F472B6"/><path d="M90 25 L75 15 L75 35 Z" fill="#F472B6"/><circle cx="75" cy="25" r="4" fill="#FCE7F3"/>`), price: 30 }, 
    { id: "toc4", name: "Kẹp Ngôi Sao", slot: "hair", svg: drawSvg(`<path d="M75 15 L78 22 L85 22 L79 27 L81 34 L75 30 L69 34 L71 27 L65 22 L72 22 Z" fill="#FBBF24"/>`), price: 30 },
    { id: "co1", name: "Nơ Đỏ Lịch Lãm", slot: "neck", svg: drawSvg(`<path d="M35 80 L50 85 L35 90 Z" fill="#EF4444"/><path d="M65 80 L50 85 L65 90 Z" fill="#EF4444"/><circle cx="50" cy="85" r="4" fill="#FCA5A5"/>`), price: 25 }, 
    { id: "co2", name: "Khăn Quàng Xanh", slot: "neck", svg: drawSvg(`<path d="M30 80 Q50 90 70 80 L65 95 L55 85 Z" fill="#3B82F6" stroke="#2563EB" stroke-width="2"/>`), price: 35 }, 
    { id: "co3", name: "Balo Học Sinh", slot: "neck", svg: drawSvg(`<rect x="25" y="40" width="10" height="30" rx="4" fill="#F59E0B"/><rect x="65" y="40" width="10" height="30" rx="4" fill="#F59E0B"/>`), price: 50 },
    { id: "aura1", name: "Hào Quang Sao", slot: "aura", svg: drawSvg(`<circle cx="50" cy="55" r="48" fill="none" stroke="#FDE047" stroke-width="3" stroke-dasharray="8 4"/>`), price: 100 }, 
    { id: "aura2", name: "Cánh Thiên Thần", slot: "aura", svg: drawSvg(`<path d="M45 55 Q20 20 -10 50 Q20 80 45 55" fill="#FFF" stroke="#E2E8F0" stroke-width="2"/><path d="M55 55 Q80 20 110 50 Q80 80 55 55" fill="#FFF" stroke="#E2E8F0" stroke-width="2"/>`), price: 150 },
    { id: "aura3", name: "Cánh Ác Quỷ", slot: "aura", svg: drawSvg(`<path d="M45 55 Q20 30 -5 20 Q10 40 -10 60 Q20 60 45 55" fill="#1E293B" stroke="#0F172A" stroke-width="2"/><path d="M55 55 Q80 30 105 20 Q90 40 110 60 Q80 60 55 55" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>`), price: 150 }
];
const FOODS = [ 
    { id: "f1", name: "Nước Lọc", price: 5, svg: drawSvg(`<rect x="40" y="40" width="20" height="35" rx="3" fill="#E0F2FE" stroke="#38BDF8" stroke-width="2"/><path d="M40 55 L60 55" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>`) }, 
    { id: "f2", name: "Sữa Tươi", price: 10, svg: drawSvg(`<rect x="35" y="40" width="30" height="40" rx="3" fill="#FFF" stroke="#94A3B8" stroke-width="2"/><path d="M35 50 L65 50" stroke="#3B82F6" stroke-width="8"/>`) }, 
    { id: "f3", name: "Trà Sữa Trân Châu", price: 15, svg: drawSvg(`<path d="M30 30 L35 80 L65 80 L70 30 Z" fill="#DEB887" stroke="#D2B48C" stroke-width="2"/><circle cx="45" cy="70" r="4" fill="#3E2723"/><circle cx="55" cy="65" r="4" fill="#3E2723"/><circle cx="40" cy="55" r="4" fill="#3E2723"/><path d="M50 30 L50 10" stroke="#EF4444" stroke-width="4"/>`) }, 
    { id: "f4", name: "Cà Phê Đen", price: 15, svg: drawSvg(`<path d="M25 40 L35 80 L65 80 L75 40 Z" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="2"/><path d="M28 50 L72 50" stroke="#8B4513" stroke-width="15"/><path d="M75 50 A 10 10 0 0 1 75 70" fill="none" stroke="#F1F5F9" stroke-width="4"/>`) }, 
    { id: "f5", name: "Bánh Bao", price: 10, svg: drawSvg(`<path d="M20 70 Q50 20 80 70 Z" fill="#FFF" stroke="#E2E8F0" stroke-width="3"/><path d="M20 70 L80 70" stroke="#E2E8F0" stroke-width="4"/><path d="M50 30 L50 40 M40 35 L45 45 M60 35 L55 45" stroke="#CBD5E1" stroke-width="2"/>`) },
    { id: "f6", name: "Bánh Kem Dâu", price: 20, svg: drawSvg(`<path d="M20 70 L80 70 L80 80 L20 80 Z" fill="#F59E0B"/><path d="M20 50 Q35 70 50 50 Q65 70 80 50 L80 70 L20 70 Z" fill="#FBCFE8"/><circle cx="50" cy="42" r="6" fill="#EF4444"/>`) }, 
    { id: "f7", name: "Dưa Hấu", price: 15, svg: drawSvg(`<path d="M20 30 A 30 30 0 0 0 80 30 Z" fill="#EF4444" stroke="#22C55E" stroke-width="4"/><circle cx="40" cy="45" r="2" fill="#111"/><circle cx="60" cy="45" r="2" fill="#111"/><circle cx="50" cy="55" r="2" fill="#111"/>`) },
    { id: "f8", name: "Pizza Phô Mai", price: 25, svg: drawSvg(`<path d="M20 30 L80 30 L50 80 Z" fill="#FBBF24" stroke="#D97706" stroke-width="2"/><path d="M20 30 L80 30" stroke="#B45309" stroke-width="6"/><circle cx="40" cy="45" r="4" fill="#EF4444"/><circle cx="60" cy="45" r="4" fill="#EF4444"/><circle cx="50" cy="60" r="4" fill="#EF4444"/>`) },
    { id: "f9", name: "Hamburger", price: 30, svg: drawSvg(`<path d="M20 45 Q50 15 80 45 Z" fill="#F59E0B"/><path d="M20 75 Q50 95 80 75 Z" fill="#F59E0B"/><path d="M15 65 L85 65" stroke="#22C55E" stroke-width="5"/><path d="M15 55 L85 55" stroke="#78350F" stroke-width="8"/><circle cx="40" cy="30" r="1.5" fill="#FFF"/><circle cx="60" cy="30" r="1.5" fill="#FFF"/>`) },
    { id: "f10", name: "Mì Ramen", price: 35, svg: drawSvg(`<path d="M20 60 Q50 95 80 60 Z" fill="#EF4444"/><path d="M25 60 Q50 50 75 60" fill="none" stroke="#FDE047" stroke-width="3"/><path d="M35 55 L35 25" stroke="#D2B48C" stroke-width="3"/><path d="M45 55 L45 25" stroke="#D2B48C" stroke-width="3"/><circle cx="65" cy="55" r="6" fill="#FFF" stroke="#F59E0B" stroke-width="2"/>`) },
    { id: "f11", name: "Sushi", price: 30, svg: drawSvg(`<rect x="25" y="55" width="50" height="20" rx="5" fill="#FFF" stroke="#E2E8F0" stroke-width="2"/><path d="M20 50 Q50 30 80 50 L75 60 Q50 50 25 60 Z" fill="#F97316"/>`) },
    { id: "f12", name: "Gà Rán", price: 40, svg: drawSvg(`<path d="M40 70 Q20 50 40 30 Q70 10 80 40 Q90 80 60 80 Z" fill="#D97706"/><path d="M35 65 L10 85" stroke="#FDE68A" stroke-width="8" stroke-linecap="round"/>`) },
    { id: "f13", name: "Bít Tết", price: 50, svg: drawSvg(`<path d="M20 50 Q50 30 80 50 Q90 70 50 80 Q10 70 20 50 Z" fill="#78350F"/><path d="M30 50 L70 50 M40 60 L60 60" stroke="#451A03" stroke-width="3"/>`) }
];

function renderPet() {
    document.getElementById('header-coins').innerText = state.coins; updateShopCoin();
    document.getElementById('pet-energy-bar').style.width = `${state.en}%`; document.getElementById('pet-energy-text').innerText = `${state.en}%`;
    document.getElementById('pet-happy-bar').style.width = `${state.hp}%`; document.getElementById('pet-happy-text').innerText = `${state.hp}%`;
    
    const pObj = PETS.find(x=>x.id===state.curPet)||PETS[0];
    document.getElementById('st-pet-title').innerText = pObj.n;
    document.getElementById('layer-body').innerHTML = pObj.svg;

    let faceSvg = petFace.normal;
    if (document.getElementById('main-pet-container').classList.contains('animate-angry')) faceSvg = petFace.angry;
    else if (document.getElementById('main-pet-container').classList.contains('animate-rub')) faceSvg = petFace.eating;
    document.getElementById('layer-face').innerHTML = faceSvg;

    document.getElementById('layer-aura').innerHTML = state.eq.aura ? ACCS.find(x=>x.id===state.eq.aura).svg : '';
    document.getElementById('layer-neck').innerHTML = state.eq.neck ? ACCS.find(x=>x.id===state.eq.neck).svg : '';
    document.getElementById('layer-eyes').innerHTML = state.eq.eyes ? ACCS.find(x=>x.id===state.eq.eyes).svg : '';
    document.getElementById('layer-head').innerHTML = state.eq.head ? ACCS.find(x=>x.id===state.eq.head).svg : '';
    document.getElementById('layer-hair').innerHTML = state.eq.hair ? ACCS.find(x=>x.id===state.eq.hair).svg : '';
}

function renderInventory() {
    const invDiv = document.getElementById('inventory-list'); invDiv.innerHTML = ""; let hasFood = false;
    for(let id in state.inventory) {
        if(state.inventory[id] > 0) {
            hasFood = true; let f = FOODS.find(x=>x.id === id);
            if(f) invDiv.innerHTML += `<div class="p-2 border border-slate-200 rounded-xl flex justify-between items-center bg-white shadow-sm"><div class="flex items-center gap-2"><div class="w-8 h-8">${f.svg}</div><span class="text-[10px] font-bold text-slate-700">${f.name} <span class="text-emerald-600">(x${state.inventory[id]})</span></span></div><button onclick="consumeFood('${id}')" class="px-3 py-1.5 bg-[#B4CBB3] text-slate-900 text-[10px] font-bold rounded-lg hover:scale-95 transition-all">Cho Ăn</button></div>`;
        }
    }
    if(!hasFood) invDiv.innerHTML = "<p class='text-[10px] text-slate-400 italic py-2 col-span-2 text-center'>Túi trống!</p>";
}

function consumeFood(id) {
    if(!state.inventory[id] || state.inventory[id] <= 0) return;
    state.inventory[id]--; state.hp = Math.min(100, state.hp + 15); state.en = Math.min(100, state.en + 15);
    document.getElementById('main-pet-container').classList.add('animate-rub');
    saveState(); setTimeout(()=>{ document.getElementById('main-pet-container').classList.remove('animate-rub'); }, 600);
}

function updateShopCoin() { const e = document.getElementById('shop-coin-display'); if(e) e.innerText = state.coins; }
function petClickAction() { document.getElementById('main-pet-container').classList.add('animate-angry'); renderPet(); setTimeout(()=>{ document.getElementById('main-pet-container').classList.remove('animate-angry'); renderPet(); }, 500); }

function startMain() {
    normalizeUserState();
    applyDailyPetReset();
    document.getElementById('step-main').classList.remove('hidden'); document.getElementById('bottom-nav-bar').classList.remove('hidden');
    document.getElementById('top-header-name').innerText=`Hi, ${state.nm || "bạn"}`; document.getElementById('sb-name').innerText=state.nm || "Bạn";
    renderPet(); renderInventory(); renderSched(); buildShop(); renderStatsChart();
    restorePomodoroSession();
    setTimeout(promptOneSignalPermission, 1000);
    checkScheduledReminders();
    startReminderWatcher();
}

function nav(id) {
    ['pet','pomo','schedule','library','shop'].forEach(x=>{ 
        document.getElementById('tab-'+x).classList.add('hidden'); 
        const btn = document.getElementById('nav-'+x);
        if(btn) { btn.className="nav-btn w-[20%] flex flex-col items-center text-slate-400 transition-all"; btn.children[0].classList.add('opacity-60'); btn.children[0].classList.remove('drop-shadow-sm'); }
    });
    document.getElementById('tab-'+id).classList.remove('hidden'); 
    const actBtn = document.getElementById('nav-'+id);
    if(actBtn) { actBtn.className="nav-btn w-[20%] flex flex-col items-center text-emerald-600 scale-110 transition-all"; actBtn.children[0].classList.remove('opacity-60'); actBtn.children[0].classList.add('drop-shadow-sm'); }
    window.scrollTo({top:0, behavior:'smooth'});
}

let isSbOpen=false;
function toggleSidebar() { isSbOpen=!isSbOpen; document.getElementById('sidebar-drawer').classList[isSbOpen?'remove':'add']('-translate-x-full'); document.getElementById('sidebar-overlay').classList[isSbOpen?'remove':'add']('hidden'); }

let pTimer=null, pSec=25*60, totalPomoSec=25*60, isPomoRun=false;
let pTargetTime = 0, isPausedByAntiCheat = false, pRemainingWhenPaused = 0, pauseTimestamp = 0;
let pomoAwayChoice = "pending", pomoPenaltyApplied = false;
const POMO_SESSION_KEY = 'studymate_pomodoro_session_v2';

function getPomoStorageKey() {
    const identity = (currentUser && currentUser.uid) || state.em || 'guest';
    return `${POMO_SESSION_KEY}_${String(identity).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}
function persistPomodoroSession(status = (isPausedByAntiCheat ? 'paused' : (isPomoRun ? 'running' : 'idle'))) {
    try {
        const record = {
            status, totalPomoSec, pSec,
            remaining: isPausedByAntiCheat ? pRemainingWhenPaused : Math.max(0, Math.ceil((pTargetTime - Date.now()) / 1000)),
            targetTime: pTargetTime, pauseTimestamp,
            subject: document.getElementById('pomo-subject')?.value || 'Toán',
            updatedAt: Date.now()
        };
        if (status === 'idle') localStorage.removeItem(getPomoStorageKey());
        else localStorage.setItem(getPomoStorageKey(), JSON.stringify(record));
    } catch (e) { console.debug('Không lưu được phiên Pomodoro trên thiết bị.', e); }
}
function clearPomodoroSession() {
    try { localStorage.removeItem(getPomoStorageKey()); } catch (e) {}
}
function restorePomodoroSession() {
    try {
        const raw = localStorage.getItem(getPomoStorageKey());
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!saved || !['running', 'paused'].includes(saved.status)) return;
        totalPomoSec = Math.max(60, Number(saved.totalPomoSec) || 25 * 60);
        pSec = Math.max(0, Number(saved.remaining ?? saved.pSec) || 0);
        const subject = document.getElementById('pomo-subject');
        if (subject && saved.subject) subject.value = saved.subject;
        if (saved.status === 'running') {
            // Tính theo mốc thời gian tuyệt đối để tránh đồng hồ bị reset khi Android tải lại trang.
            pTargetTime = Number(saved.targetTime) || (Date.now() + pSec * 1000);
            pSec = Math.max(0, Math.ceil((pTargetTime - Date.now()) / 1000));
            isPomoRun = true; isPausedByAntiCheat = false;
            if (pSec <= 0) { finishPomodoroSession(); return; }
            document.getElementById('btn-start-pomo').innerText = 'Đang đếm ngược...';
            updatePomoUI(); startPomoInterval();
        } else {
            isPomoRun = true; isPausedByAntiCheat = true;
            pRemainingWhenPaused = Math.max(0, Number(saved.remaining) || 0);
            pauseTimestamp = Number(saved.pauseTimestamp) || Number(saved.updatedAt) || Date.now();
            pSec = pRemainingWhenPaused; updatePomoUI();
            document.getElementById('btn-start-pomo').innerText = 'TIẾP TỤC TẬP TRUNG';
            if (!document.hidden) reconcilePausedPomodoro();
        }
    } catch (e) { console.warn('Không khôi phục được phiên Pomodoro:', e); }
}
function recordStudyTime(subject, hours) {
    normalizeUserState();
    const h = Math.max(0, Number(hours) || 0);
    if (!subject || h <= 0) return;
    state.studyHours[subject] = (Number(state.studyHours[subject]) || 0) + h;
    const day = localDateKey();
    if (!state.studyByDay[day]) state.studyByDay[day] = {};
    state.studyByDay[day][subject] = (Number(state.studyByDay[day][subject]) || 0) + h;
}
function finishPomodoroSession() {
    if (!isPomoRun && !isPausedByAntiCheat) return;
    clearInterval(pTimer); pTimer = null;
    isPomoRun = false; isPausedByAntiCheat = false; pomoAwayChoice = 'pending';
    state.coins += 10;
    const subjStr = document.getElementById('pomo-subject').value;
    recordStudyTime(subjStr, totalPomoSec / 3600); saveState(); clearPomodoroSession();
    playNotificationSound('ring');
    showPhoneNotification('HẾT GIỜ RỒI! 🎉', `Hoàn thành ${Math.round(totalPomoSec/60)} phút học!`, 'ring', 'studymate-pomodoro-finished');
    alert(`🎉 Hoàn thành phiên học! Bạn được cộng +10 Xu.`);
    pSec = totalPomoSec; updatePomoUI(); document.getElementById('btn-start-pomo').innerText = 'BẮT ĐẦU TẬP TRUNG';
}
function startPomoInterval() {
    clearInterval(pTimer);
    pTimer = setInterval(() => {
        if (!isPomoRun || isPausedByAntiCheat) return;
        let remain = Math.ceil((pTargetTime - Date.now()) / 1000);
        if (remain <= 0) { finishPomodoroSession(); }
        else {
            pSec = remain; updatePomoUI();
            // Lưu mốc giờ định kỳ để phục hồi nếu Android reload trang nền.
            if (remain % 5 === 0) persistPomodoroSession('running');
        }
    }, 1000);
    persistPomodoroSession(isPausedByAntiCheat ? 'paused' : 'running');
}
function changePomoTime() { if(isPomoRun) return; let mins = parseInt(document.getElementById('pomo-time').value); if(isNaN(mins) || mins < 1) mins = 1; pSec = mins * 60; totalPomoSec = mins * 60; updatePomoUI(); }
function adjPomo(m) { if(isPomoRun) return; let mins = Math.floor(pSec/60) + m; if(mins < 1) mins = 1; document.getElementById('pomo-time').value = mins; changePomoTime(); }
function updatePomoUI() { const m=Math.floor(pSec/60), s=pSec%60; document.getElementById('pomodoro-clock').innerText=`${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; }
function togglePomodoro() {
    if(isPomoRun && !isPausedByAntiCheat) return;
    clearInterval(pTimer);
    isPomoRun = true; isPausedByAntiCheat = false; pomoAwayChoice = 'pending'; pomoPenaltyApplied = false;
    pTargetTime = Date.now() + pSec * 1000;
    document.getElementById('btn-start-pomo').innerText='Đang đếm ngược...';
    persistPomodoroSession('running'); startPomoInterval();
}
function resumePomodoroFromNotification() {
    if (!isPomoRun || !isPausedByAntiCheat) return;
    isPausedByAntiCheat = false; pomoAwayChoice = 'research';
    pSec = Math.max(1, pRemainingWhenPaused || pSec);
    pTargetTime = Date.now() + pSec * 1000;
    document.getElementById('btn-start-pomo').innerText = 'Đang đếm ngược...';
    persistPomodoroSession('running'); startPomoInterval();
}
function reconcilePausedPomodoro() {
    if (!isPausedByAntiCheat) return;
    const timeAway = Date.now() - pauseTimestamp;
    if (timeAway > 5 * 60 * 1000) {
        clearInterval(pTimer); pTimer = null; isPausedByAntiCheat = false; isPomoRun = false;
        if (!pomoPenaltyApplied) { state.coins = Math.max(0, state.coins - 5); pomoPenaltyApplied = true; saveState(); petClickAction(); }
        clearPomodoroSession();
        alert('🚨 Cậu đã đi quá 5 phút! Phiên học bị hủy và bị trừ 5 Xu.');
        pSec = totalPomoSec; updatePomoUI(); document.getElementById('btn-start-pomo').innerText = 'BẮT ĐẦU TẬP TRUNG';
    } else {
        resumePomodoroFromNotification();
        pushNotify('Chào mừng trở lại!', 'Tớ tự động chạy tiếp đồng hồ rồi nhé!', 'ting');
    }
}
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isPomoRun && !isSwMode && !isPausedByAntiCheat) {
        clearInterval(pTimer); pTimer = null;
        pSec = Math.max(0, Math.ceil((pTargetTime - Date.now()) / 1000));
        isPausedByAntiCheat = true; pomoAwayChoice = 'pending';
        pRemainingWhenPaused = pSec; pauseTimestamp = Date.now();
        persistPomodoroSession('paused');
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SHOW_ANTI_CHEAT' });
        } else if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => reg.active && reg.active.postMessage({ type: 'SHOW_ANTI_CHEAT' })).catch(() => {});
        }
    } else if (!document.hidden && isPausedByAntiCheat) {
        reconcilePausedPomodoro();
    }
});
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        const type = event.data && event.data.type;
        if (type === 'POMODORO_RESEARCH') {
            // Không mở/focus lại app; chỉ tiếp tục phiên đang chạy trong client nền.
            resumePomodoroFromNotification();
        } else if (type === 'POMODORO_BREAK') {
            if (isPomoRun) {
                clearInterval(pTimer); pTimer = null;
                // Giữ nguyên thời gian còn lại lúc app chuyển nền; không tính lại theo deadline cũ.
                pSec = Math.max(0, Number(pRemainingWhenPaused) || pSec);
                isPausedByAntiCheat = true; pomoAwayChoice = 'break';
                pRemainingWhenPaused = pSec; pauseTimestamp = Date.now();
                persistPomodoroSession('paused');
            }
        } else if (type === 'RESUME_POMODORO' && isPausedByAntiCheat) {
            resumePomodoroFromNotification();
        }
    });
}

function stopPomodoroSafely() { 
    if(!isPomoRun)return; 
    clearInterval(pTimer); pTimer = null; isPomoRun=false; isPausedByAntiCheat=false; clearPomodoroSession();
    let elapsed = totalPomoSec - pSec;
    if (elapsed >= totalPomoSec / 2) {
        let subjStr = document.getElementById('pomo-subject').value; state.coins += 5; recordStudyTime(subjStr, elapsed/3600); saveState();
        alert(`⏱️ Cậu dừng sớm nhưng đã qua 50% thời gian.\nCộng giờ vào thống kê và thưởng +5 Xu!`);
    } else {
        state.coins = Math.max(0, state.coins - 5); state.hp = Math.max(0, state.hp - 10); saveState();
        pushNotify("Phạt bỏ cuộc", "Dừng học quá sớm! Cục bông bị trừ 5 Xu!", "ting"); petClickAction(); 
        alert("⚠️ Cậu từ bỏ quá sớm. Trừ 5 Xu!");
    }
    pSec = totalPomoSec; updatePomoUI(); document.getElementById('btn-start-pomo').innerText="BẮT ĐẦU TẬP TRUNG"; 
}

let swActive=false, swTimerInst=null, swSec=0, isSwMode=false;
function switchPomoMode(m) { 
    isSwMode=(m==='STOPWATCH'); 
    document.getElementById("pomo-view-pomo").classList[isSwMode?'add':'remove']('hidden'); 
    document.getElementById("pomo-view-stopwatch").classList[isSwMode?'remove':'add']('hidden'); 
}
function toggleStopwatch() {
    if(swActive) { clearInterval(swTimerInst); swActive=false; document.getElementById("btn-start-sw").innerText="Tiếp tục"; }
    else { swActive=true; document.getElementById("btn-start-sw").innerText="Dừng lại"; swTimerInst=setInterval(() => { swSec++; const h=Math.floor(swSec/3600), m=Math.floor((swSec%3600)/60), s=swSec%60; document.getElementById("stopwatch-clock").innerText=`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; }, 1000); }
}
function resetStopwatch() { clearInterval(swTimerInst); swActive=false; swSec=0; document.getElementById("stopwatch-clock").innerText="00:00:00"; document.getElementById("btn-start-sw").innerText="BẮT ĐẦU"; }

function switchSched(t) { 
    ['TODO','GOAL','MONTH','TIME'].forEach(x=>{
        const b = document.getElementById('btn-sch-'+x.toLowerCase()); const v = document.getElementById('sch-'+x.toLowerCase()+'-view');
        if(b) { b.classList.remove('bg-white', 'shadow-sm', 'text-slate-800', 'border-slate-200'); b.classList.add('text-slate-500', 'border-transparent'); }
        if(v) v.classList.add('hidden');
    });
    const ab = document.getElementById('btn-sch-'+t.toLowerCase()); const av = document.getElementById('sch-'+t.toLowerCase()+'-view');
    if(ab) { ab.classList.remove('text-slate-500', 'border-transparent'); ab.classList.add('bg-white', 'shadow-sm', 'text-slate-800', 'border-slate-200'); }
    if(av) av.classList.remove('hidden');
    if(t==='TODO') renderTodo(); if(t==='GOAL') renderGoalsSettings(); if(t==='TIME') renderTKB();
}

function renderTodo() {
    const wc = document.getElementById('daily-todo-grid'); wc.innerHTML="";
    state.todos.forEach((t,i)=>wc.innerHTML+=`<div class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl text-xs shadow-sm"><input type="checkbox" class="w-4 h-4" ${t.d?'checked':''} onchange="toggleTodo(${i})"><span class="flex-1 font-bold ${t.d?'line-through text-slate-400':'text-slate-700'}">${t.n}</span><button onclick="delTodo(${i})" class="text-rose-400 bg-rose-50 px-2 py-1 rounded font-bold">Xóa</button></div>`);
}
function addTodoTask() { const v=document.getElementById('new-task-inp').value.trim(); if(v) { state.todos.push({n:v, d:false}); document.getElementById('new-task-inp').value=""; saveState(); pushNotify('Ghi nhớ', 'Đã thêm nhiệm vụ mới!', 'ting'); } }
function toggleTodo(i) { state.todos[i].d=!state.todos[i].d; if(state.todos[i].d) state.coins+=2; saveState(); }
function delTodo(i) { state.todos.splice(i,1); saveState(); }

function renderGoalsSettings() {
    const giContainer = document.getElementById('goal-inputs-container'); giContainer.innerHTML = "";
    ALL_SUBJECTS.forEach(s => {
        const isActive = state.activeGoals.includes(s); const val = Math.max(5, Math.round((Number(state.weeklyGoals[s]) || 1) * 60));
        giContainer.innerHTML += `<div class="flex flex-col gap-1 p-2 rounded-xl border ${isActive ? 'bg-white border-emerald-300 shadow-sm' : 'bg-slate-50 border-slate-100'} transition-all"><div class="flex items-center gap-2"><input type="checkbox" id="goal-chk-${s}" class="w-4 h-4 shrink-0" ${isActive?'checked':''} onchange="toggleGoalSubj('${s}')"><span class="font-bold text-[10px] flex-1 text-slate-600 cursor-pointer" onclick="document.getElementById('goal-chk-${s}').click()">${SUBJ_LABELS[s]}</span></div><div class="flex items-center gap-1 ${isActive?'':'hidden'}" id="goal-time-wrap-${s}"><input id="goal-val-${s}" type="number" step="5" min="5" class="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none" value="${val}"><span class="text-[9px] text-slate-500 shrink-0">phút/ngày</span></div></div>`;
    }); renderStatsChart();
}
function toggleGoalSubj(s) { if(state.activeGoals.includes(s)) state.activeGoals = state.activeGoals.filter(x=>x!==s); else state.activeGoals.push(s); renderGoalsSettings(); }
function saveWeeklyGoals() { state.activeGoals.forEach(s => { const minutes = Math.max(5, parseFloat(document.getElementById(`goal-val-${s}`).value) || 60); state.weeklyGoals[s] = minutes / 60; }); saveState(); alert("Đã lưu mục tiêu theo phút mỗi ngày!"); renderStatsChart(); }

function claimWeeklyReward() {
    let totalGoalWeek = 0; let totalStudiedWeek = 0;
    if(state.activeGoals.length === 0) return alert("Cậu chưa tích chọn môn nào!");
    state.activeGoals.forEach(sub => { let goalWeek = (state.weeklyGoals[sub] || 1) * 7; let studied = state.studyHours[sub] || 0; totalGoalWeek += goalWeek; totalStudiedWeek += studied; });
    let overallRatio = totalGoalWeek > 0 ? Math.min(1, totalStudiedWeek / totalGoalWeek) : 0;
    let reward = Math.round(overallRatio * 30);
    state.coins += reward; state.studyHours = {}; saveState();
    alert(`📊 TỔNG KẾT TUẦN:\n- Đã học: ${totalStudiedWeek.toFixed(1)}h / Mục tiêu: ${totalGoalWeek.toFixed(1)}h.\n- Thưởng hoàn thành: +${reward} Xu!`);
    renderStatsChart();
}

function renderStatsChart() {
    const bc = document.getElementById('stats-bar-chart'); const pc = document.getElementById('pie-chart'); const pl = document.getElementById('pie-legend');
    if(!bc || !pc) return;  bc.innerHTML = ""; pl.innerHTML = "";
    const hours = state.studyHours || {}; const goals = state.weeklyGoals || {}; let maxH = 15; let totalH = 0;
    state.activeGoals.forEach(sub => {
        let h = hours[sub] || 0; totalH += h; let gW = (goals[sub] || 1) * 7; 
        let pct = Math.min(100, (h / maxH) * 100); let goalPct = Math.min(100, (gW / maxH) * 100);
        let color = SUBJ_COLORS[sub] || "#94a3b8";
        bc.innerHTML += `<div class="flex flex-col items-center gap-1 h-full justify-end relative w-10 shrink-0"><div class="absolute bottom-4 w-full border-t-2 border-dashed border-rose-300 z-10" style="bottom: ${goalPct}%;"></div><span class="text-[9px] font-bold text-slate-500 z-20">${h.toFixed(1)}h</span><div class="w-full rounded-t-sm transition-all z-20" style="height: ${pct}%; background-color: ${color};"></div><span class="text-[9px] font-bold text-slate-700">${SUBJ_LABELS[sub]}</span></div>`;
    });
    if (totalH > 0 && state.activeGoals.length > 0) {
        let conicStr = []; let currentDeg = 0;
        state.activeGoals.forEach(sub => { let h = hours[sub] || 0; if (h > 0) { let color = SUBJ_COLORS[sub] || "#94a3b8"; let deg = (h / totalH) * 360; conicStr.push(`${color} ${currentDeg}deg ${currentDeg + deg}deg`); currentDeg += deg; let pct = Math.round((h/totalH)*100); pl.innerHTML += `<div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full inline-block" style="background:${color}"></span> ${SUBJ_LABELS[sub]}: ${pct}%</div>`; }});
        pc.style.background = `conic-gradient(${conicStr.join(', ')})`;
    } else { pc.style.background = "#e2e8f0"; pl.innerHTML = "Chưa có dữ liệu."; }
}

let curD = new Date();
function changeMonth(d){curD.setMonth(curD.getMonth()+d); renderSched();}
function renderSched() {
    const mc = document.getElementById('calendar-grid'); mc.innerHTML=""; const y=curD.getFullYear(), m=curD.getMonth(); document.getElementById('month-label').innerText = `Tháng ${m+1} / ${y}`; const fd = new Date(y,m,1).getDay(), dInM = new Date(y,m+1,0).getDate();
    for(let i=0;i<fd;i++) mc.innerHTML+=`<div></div>`;
    for(let i=1;i<=dInM;i++) { const dStr = `${y}-${(m+1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`; const hasEx = state.exams.find(x=>x.d===dStr); mc.innerHTML+=`<div class="py-1 ${hasEx?'bg-rose-100 text-rose-700 rounded-full font-black':''}">${i}</div>`; }
    const el = document.getElementById('exam-list'); el.innerHTML="";
    state.exams.forEach((ex,i)=>{ const diff = Math.ceil((new Date(ex.d)-new Date())/(1000*60*60*24)); el.innerHTML+=`<div class="flex justify-between border-b pb-2 mb-2"><span class="font-bold text-rose-700">${ex.n}</span><span class="font-black bg-white px-2 py-0.5 rounded border">${diff>0?`Còn ${diff} ngày`:'Đã qua'} <button onclick="delExam(${i})" class="text-rose-400">Xóa</button></span></div>`; });
    renderTKB(); renderTodo();
}
function addExam() {
    const n = document.getElementById('exam-name').value.trim();
    const d = document.getElementById('exam-date').value;
    if (!n || !d) return alert("Nhập tên môn và ngày thi nhé!");
    if (d < localDateKey()) return alert("Ngày thi không thể ở quá khứ.");
    state.exams.push({ id: Date.now().toString(), n, d, createdAt: Date.now() });
    document.getElementById('exam-name').value = "";
    saveState(); renderSched();
    pushNotify("Đã lưu lịch thi", `StudyMate đã lưu lịch thi ${n}.`, "ting");
}
function delExam(i) { state.exams.splice(i,1); saveState(); renderSched(); }
function checkExamNotifications() { checkScheduledReminders(); }

function dayLabelFor(date = new Date()) {
    return ["Chủ Nhật","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"][date.getDay()];
}
function notifyOncePerKey(key, title, body) {
    normalizeUserState();
    if (state.notificationLog[key]) return;
    state.notificationLog[key] = Date.now();
    saveState();
    pushNotify(title, body, "ting");
    // OneSignal delivers to subscribed devices when sent from OneSignal/backend.
    // This client-side path is a foreground/local fallback only.
}
function checkScheduledReminders(now = new Date()) {
    if (!currentUser || !state) return;
    const today = localDateKey(now);
    const hh = now.getHours(), mm = now.getMinutes();
    // Exam reminders begin the day after schedule creation; 07:00 and 19:00, stop after exam day.
    (state.exams || []).forEach(ex => {
        if (!ex || !ex.d || ex.d < today) return;
        const createdDay = ex.createdAt ? localDateKey(new Date(ex.createdAt)) : today;
        if (today <= createdDay) return;
        const slot = (hh === 7 && mm === 0) ? "07" : ((hh === 19 && mm === 0) ? "19" : "");
        if (slot) {
            const key = `exam:${ex.id || ex.n+ex.d}:${today}:${slot}`;
            notifyOncePerKey(key, ex.d === today ? "Chúc cậu thi tốt! 🍀" : "Đến giờ ôn thi rồi! 📚",
                ex.d === today ? `Hôm nay thi ${ex.n}. Bình tĩnh và tự tin nhé!` : `Dành chút thời gian ôn ${ex.n} nha.`);
        }
    });
    // Extra-class reminder at midnight on each scheduled weekday.
    if (hh === 0 && mm === 0) {
        const day = dayLabelFor(now);
        const classes = (state.tkb || []).filter(x => x.day === day);
        if (classes.length) {
            const summary = classes.map(x => `${x.time} ${x.n}`).join(", ");
            notifyOncePerKey(`class:${today}`, "Lịch học thêm hôm nay 📚", `Hôm nay cậu có: ${summary}`);
        }
    }
}
let reminderWatcher = null;
function startReminderWatcher() {
    if (reminderWatcher) clearInterval(reminderWatcher);
    reminderWatcher = setInterval(() => {
        if (!document.hidden) checkScheduledReminders();
    }, 15000);
}

function renderTKB() {
    const grid = document.getElementById('tkb-grid-view'); grid.innerHTML=""; const days = ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","Chủ Nhật"];
    days.forEach(day => {
        let subs = state.tkb.filter(x=>x.day===day); let colHtml = `<div class="flex flex-col gap-1 border border-slate-100 rounded-xl bg-slate-50 min-h-[70px] p-1">`;
        subs.forEach(s => { colHtml += `<div class="text-[8px] bg-emerald-100 text-emerald-800 p-1.5 rounded-lg relative font-bold"><span class="text-emerald-900">${s.time}</span><br>${s.n}<button onclick="delTKB('${s.id}')" class="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7px]">x</button></div>`; });
        colHtml += `</div>`; grid.innerHTML += colHtml;
    });
}
function addTKB() {
    const d = document.getElementById('tkb-day').value;
    const time = document.getElementById('tkb-time').value.trim() || "--:--";
    const s = document.getElementById('tkb-subj').value.trim();
    if (!s) return alert("Nhập tên lớp học thêm nhé!");
    if (time !== "--:--" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return alert("Giờ cần theo dạng 18:00.");
    state.tkb.push({id:Date.now().toString(), day:d, time, n:s});
    document.getElementById('tkb-subj').value = "";
    saveState(); renderTKB();
    pushNotify('Đã lưu lịch học thêm', `${d}: ${s} lúc ${time}.`, 'ting');
}
function delTKB(id) { state.tkb = state.tkb.filter(x=>x.id!==id); saveState(); renderTKB(); }

let draftFC = [];
function addManualFC() { const front = document.getElementById('fc-front').value.trim(); const back = document.getElementById('fc-back').value.trim(); if(!front || !back) return alert("Điền đủ 2 mặt!"); draftFC.push({q: front, a: back}); document.getElementById('fc-front').value = ""; document.getElementById('fc-back').value = ""; renderDraftFC(); }
function renderDraftFC() { const c = document.getElementById('fc-draft-list'); c.innerHTML = ""; draftFC.forEach((f, i) => { c.innerHTML += `<div class="flex justify-between bg-white p-2 border"><div class="truncate flex-1"><b>${f.q}</b> | ${f.a}</div><button onclick="draftFC.splice(${i},1); renderDraftFC()" class="text-rose-500 font-bold ml-2">X</button></div>`; }); }
function saveManualFC() { if(draftFC.length === 0) return alert("Bộ tạm trống!"); state.savedLib.push({ id: Date.now(), type: 'flashcard', count: draftFC.length, data: [...draftFC] }); draftFC = []; renderDraftFC(); saveState(); playLib(state.savedLib.length - 1); pushNotify('Đã lưu', 'Lưu thẻ thủ công', 'ting'); }
function genLibFromText() {
    const rawText = document.getElementById('lib-text').value.trim(); if(!rawText) return;
    let lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    let extractedData = [];
    for(let i=0; i<lines.length; i++) { let parts = lines[i].split(/[-:]/); if (parts.length >= 2) extractedData.push({ q: parts[0].trim(), a: parts.slice(1).join(' ').trim() }); else extractedData.push({ q: `Ý chính ${i+1}`, a: lines[i] }); }
    state.savedLib.push({ id: Date.now(), type: 'flashcard', count: extractedData.length, data: extractedData }); saveState(); playLib(state.savedLib.length - 1); pushNotify('Xong', 'Đã tự động trích xuất', 'ting');
}
let curQuiz=[], curQIdx=0;
function renderLib() { const c = document.getElementById('saved-lib-list'); c.innerHTML=""; state.savedLib.forEach((s,i)=>{ c.innerHTML+=`<div class="flex justify-between bg-white p-3 border rounded-xl shadow-sm mb-2"><span class="font-bold text-slate-700">Bộ ${s.count} thẻ</span><div class="flex gap-2"><button onclick="playLib(${i})" class="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded font-bold">Ôn Tập</button><button onclick="delLib(${i})" class="text-rose-400 bg-rose-50 px-2 py-1.5 rounded font-bold">Xóa</button></div></div>`; }); }
function delLib(i) { state.savedLib.splice(i,1); saveState(); }
function playLib(i) { document.getElementById('lib-main').classList.add('hidden'); document.getElementById('lib-play').classList.remove('hidden'); curQuiz = state.savedLib[i].data; curQIdx=0; showLibQ(); }
function closeLibPlay() { document.getElementById('lib-play').classList.add('hidden'); document.getElementById('lib-main').classList.remove('hidden'); renderLib(); }
function showLibQ() {
    const q = curQuiz[curQIdx]; document.getElementById('lib-play-prog').innerText = `Thẻ ${curQIdx+1} / ${curQuiz.length}`;
    let html = `<div class="flip-card cursor-pointer w-full h-[220px]" onclick="this.classList.toggle('flipped')"><div class="flip-card-inner shadow-sm rounded-2xl"><div class="flip-card-front"><span class="text-[10px] text-slate-400 font-bold border px-2 py-1 rounded-md">MẶT TRƯỚC</span><h3 class="font-bold text-lg px-4">${q.q}</h3></div><div class="flip-card-back"><span class="text-[10px] text-emerald-600 font-bold border px-2 py-1 rounded-md">MẶT SAU</span><p class="text-base font-bold text-emerald-900 px-6">${q.a}</p></div></div></div>`;
    html += `<div class="flex gap-2 mt-6"><button onclick="curQIdx=Math.max(0,curQIdx-1);showLibQ()" class="flex-1 py-4 bg-white border rounded-2xl font-bold">◀ Câu trước</button><button onclick="if(curQIdx===${curQuiz.length-1}){closeLibPlay();} else {curQIdx++; showLibQ();}" class="flex-1 py-4 bg-[#B4CBB3] font-bold rounded-2xl">${curQIdx===curQuiz.length-1?'Hoàn thành':'Câu sau ▶'}</button></div>`;
    document.getElementById('lib-play-content').innerHTML = html;
}

function switchShop(t) {
    ['FOOD','ACC','PETS'].forEach(x=>{ const btn = document.getElementById('btn-shop-'+x.toLowerCase()); if(btn) { btn.classList.remove('bg-white', 'shadow-sm', 'text-slate-800', 'border-slate-200'); btn.classList.add('text-slate-500', 'border-transparent'); } });
    const activeBtn = document.getElementById('btn-shop-'+t.toLowerCase()); if(activeBtn) { activeBtn.classList.remove('text-slate-500', 'border-transparent'); activeBtn.classList.add('bg-white', 'shadow-sm', 'text-slate-800', 'border-slate-200'); }
    const grid = document.getElementById('shop-grid'); grid.innerHTML="";
    if(t==='FOOD') { FOODS.forEach(f=>{ grid.innerHTML+=`<div class="p-3 bg-white border border-slate-100 rounded-2xl text-center"><div class="w-14 h-14 mx-auto mb-2">${f.svg}</div><div class="font-bold text-[11px]">${f.name}</div><button onclick="buyFood('${f.id}',${f.price})" class="mt-2 w-full py-2 bg-rose-50 text-rose-700 rounded-xl font-bold text-[10px]">${f.price} Xu - Mua</button></div>`; }); }
    else if(t==='ACC') { ACCS.forEach(i=>{ const isO = state.myItems.includes(i.id); const isEq = Object.values(state.eq).includes(i.id); grid.innerHTML+=`<div class="p-3 bg-white border border-slate-100 rounded-2xl text-center"><div class="w-14 h-14 mx-auto mb-2">${i.svg}</div><div class="font-bold text-[11px]">${i.name}</div><button onclick="${isO?`eqItem('${i.id}','${i.slot}')`:`buyItem('${i.id}',${i.price})`}" class="mt-2 w-full py-2 ${isEq?'bg-emerald-100 text-emerald-800':'bg-slate-50'} border rounded-xl font-bold text-[10px]">${isEq?'Đang dùng':(isO?'Lấy ra dùng':`${i.price} Xu - Mua`)}</button></div>`; }); } 
    else { PETS.forEach(p=>{ const isO = state.myPets.includes(p.id); const isEq = state.curPet===p.id; grid.innerHTML+=`<div class="p-3 bg-white border border-slate-100 rounded-2xl text-center"><div class="w-14 h-14 mx-auto mb-2">${p.svg}</div><div class="font-bold text-[11px]">${p.n}</div><button onclick="${isO?`eqPet('${p.id}')`:`buyPet('${p.id}',${p.p})`}" class="mt-2 w-full py-2 ${isEq?'bg-amber-100 text-amber-800':'bg-slate-50'} border rounded-xl font-bold text-[10px]">${isEq?'Đang nuôi':(isO?'Đổi sang':`${p.p} Xu - Mua`)}</button></div>`; }); }
}
function buyFood(id, p) { if(state.coins < p) return alert("Thiếu Xu!"); state.coins -= p; state.inventory[id] = (state.inventory[id] || 0) + 1; saveState(); pushNotify('Mua thành công', 'Đồ ăn cất vào Túi!', 'ting'); switchShop('FOOD'); }
function buyItem(id, p) { if(state.coins<p)return alert("Thiếu Xu!"); state.coins-=p; state.myItems.push(id); saveState(); pushNotify('Đã mua', 'Đã lưu phụ kiện', 'ting'); switchShop('ACC'); }
function eqItem(id, s) { state.eq[s]=state.eq[s]===id?"":id; saveState(); switchShop('ACC'); }
function buyPet(id, p) { if(state.coins<p)return alert("Thiếu Xu!"); state.coins-=p; state.myPets.push(id); state.curPet=id; saveState(); pushNotify('Đã mua', 'Đã lưu màu Pet', 'ting'); switchShop('PETS'); }
function eqPet(id) { state.curPet=id; saveState(); switchShop('PETS'); }
function buildShop() { switchShop('FOOD'); updateShopCoin(); renderLib(); }
window.addEventListener("pagehide", () => {
    if (currentUser && db && state) {
        db.collection('users').doc(currentUser.uid).set(state).catch(() => {});
    }
});
