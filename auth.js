// دالة لتنظيف النصوص وحماية الموقع من ثغرات XSS وحقن الـ HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 0. التهيئة والتحقق الآمن
if (typeof window.auth === 'undefined') {
    const firebaseConfig = {
        apiKey: "AIzaSyApidBgjtaa1JQCw9eg0kHo3HUQf1dXBrU",
        authDomain: "x-lamy.firebaseapp.com",
        databaseURL: "https://x-lamy-default-rtdb.firebaseio.com",
        projectId: "x-lamy",
        storageBucket: "x-lamy.firebasestorage.app",
        messagingSenderId: "252824489765",
        appId: "1:252824489765:web:21428a48ef7de5a0b094cc",
        measurementId: "G-0Y2S56MG06"
    };

    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    if (typeof firebase !== 'undefined') {
        window.auth = firebase.auth();
        window.database = firebase.database();
    }
}

// 1. تحديث الواجهة بناءً على الكاش المحلي أولاً (للسرعة القصوى) ثم المزامنة
window.updateAuthUI = function() {
    const authHeader = document.getElementById("auth-header");
    if (!authHeader) return;

    const firebaseAuth = window.auth || (typeof auth !== 'undefined' ? auth : null);
    const user = firebaseAuth ? firebaseAuth.currentUser : null; 

    // فحص الكاش المحلي بأمان
    const isCachedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const cachedName = escapeHtml(localStorage.getItem('userName') || 'مستخدم');
    const cachedUid = escapeHtml(localStorage.getItem('userUid') || '');

    if (user || isCachedLoggedIn) {
        // تنظيف وحماية البيانات المعروضة لمنع XSS
        const displayName = escapeHtml(user ? (user.displayName || 'مستخدم') : cachedName);
        const uid = escapeHtml(user ? user.uid : cachedUid);

        authHeader.innerHTML = `
            <div class="auth-container" style="text-align: center; font-size: 19px;">
                <span style="color:white; font-weight:bold;">مرحباً </span>
                <span style="color: #ff4fd8; font-weight: bold; cursor: pointer; text-decoration: underline;" onclick="openProfile('${uid}')">
                    ${displayName}
                </span>
                <br>
                <button class="auth-logout-btn" onclick="logoutUser()" style="margin-top: 8px; padding: 4px 12px; font-size: 13px; background-color: #2e0026; color: white; border: none; border-radius: 13px; cursor: pointer;">تسجيل خروج</button>
            </div>
        `;
    } else {
        // حالة: زائر
        authHeader.innerHTML = `
            <div style="text-align: center;">
                <button onclick="showAuthOverlay('login')" style="padding: 5px 15px; margin: 5px; background: #ff4fd8; color: white; border: none; border-radius: 10px; cursor: pointer;">دخول</button>
                <button onclick="showAuthOverlay('signup')" style="padding: 5px 15px; margin: 5px; background: #222; color: white; border: 1px solid #ff4fd8; border-radius: 10px; cursor: pointer;">إنشاء حساب</button>
            </div>
        `;
    }

    // إظهار الهيدر بعد تحديث المحتوى
    authHeader.style.display = 'block';

    // تنسيق الجوال
    if (!document.getElementById('media-style-auth')) {
        const mediaStyle = document.createElement('style');
        mediaStyle.id = 'media-style-auth';
        mediaStyle.innerHTML = `
            @media (max-width: 768px) {
                .auth-container { font-size: 14px !important; }
                .auth-logout-btn { padding: 2px 8px !important; font-size: 11px !important; margin-top: 4px !important; }
            }
        `;
        document.head.appendChild(mediaStyle);
    }
};

// تشغيل التحديث فوراً إذا كان مخزناً في الكاش
window.updateAuthUI();

// مراقبة الحالة وتحديث الكاش والفايربيس في الخلفية
const firebaseAuth = window.auth || (typeof auth !== 'undefined' ? auth : null);
if (firebaseAuth) {
    firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
            // حفظ البيانات بنظافة في الكاش المحلي
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', user.displayName || 'مستخدم');
            localStorage.setItem('userUid', user.uid);

            window.updateAuthUI();

            if (window.database) {
                const userRef = window.database.ref("users/" + user.uid);
                userRef.update({
                    uid: user.uid,
                    name: user.displayName || "مستخدم جديد",
                    email: user.email || "",
                    lastLogin: firebase.database.ServerValue.TIMESTAMP
                });
            }
        } else {
            // مسح الكاش تماماً عند تسجيل الخروج
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
            localStorage.removeItem('userUid');

            window.updateAuthUI();
        }
    });
}

// الدوال المساعدة
window.showAuthOverlay = function(type) {
    let overlay = document.getElementById("loginOverlay");
    if (overlay) overlay.remove();
    
    overlay = document.createElement("div");
    overlay.id = "loginOverlay";
    overlay.style.cssText = "position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.9) !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important;";
    document.body.appendChild(overlay);

    const renderContent = (currentType) => {
        overlay.innerHTML = `
            <div style="background:#222; padding:30px; border-radius:20px; border: 2px solid #ff4fd8; text-align:center; color:white; width: 300px; position: relative;">
                <button id="closeAuth" style="background:none; border:none; color:white; position:absolute; top:10px; right:10px; cursor:pointer; font-size: 20px;">✕</button>
                <h1 style="color:#ff4fd8; margin-top: 0;">${currentType === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h1>
                ${currentType === 'signup' ? '<input type="text" id="userInputName" placeholder="اسم المستخدم" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">' : ''}
                <input type="email" id="userInputEmail" placeholder="البريد الإلكتروني" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">
                <input type="password" id="userInputPassword" placeholder="كلمة المرور" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">
                <div id="authErrorDisplay" style="color: red; font-size: 14px; margin: 10px 0; height: 20px; font-weight: bold;"></div>
                <button id="submitAuthBtn" style="background:#ff4fd8; border:none; padding:10px 30px; border-radius:20px; cursor:pointer; color: white; font-weight:bold; margin0top:10px;">${currentType === 'login' ? 'دخول' : 'تسجيل'}</button>
                <p style="margin-top:15px; font-size:12px;">
                    ${currentType === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                    <span id="toggleMode" style="color:#ff4fd8; cursor:pointer; text-decoration:underline;">${currentType === 'login' ? 'سجل الآن' : 'سجل الدخول'}</span>
                </p>
            </div>
        `;

        document.getElementById('closeAuth').onclick = () => overlay.remove();
        document.getElementById('toggleMode').onclick = () => renderContent(currentType === 'login' ? 'signup' : 'login');
        
        document.getElementById('submitAuthBtn').onclick = async () => {
            const emailField = document.getElementById('userInputEmail');
            const passwordField = document.getElementById('userInputPassword');
            const nameInput = document.getElementById('userInputName');
            const errorDisplay = document.getElementById('authErrorDisplay');

            const email = emailField ? emailField.value.trim() : '';
            const password = passwordField ? passwordField.value : '';
            const nameVal = nameInput ? nameInput.value.trim() : '';

            // التحقق من المدخلات لتجنب الأخطاء
            if (!email || !password) {
                errorDisplay.innerText = "الرجاء إدخال البريد وكلمة المرور";
                return;
            }

            if (currentType === 'signup' && !nameVal) {
                errorDisplay.innerText = "الرجاء إدخال اسم المستخدم";
                return;
            }

            try {
                const activeAuth = window.auth || auth;
                if (currentType === 'signup') {
                    const userCredential = await activeAuth.createUserWithEmailAndPassword(email, password);
                    await userCredential.user.updateProfile({ displayName: nameVal });
                } else {
                    await activeAuth.signInWithEmailAndPassword(email, password);
                }
                overlay.remove();
            } catch (error) {
                errorDisplay.innerText = error.message;
            }
        };
    };

    renderContent(type);
};

window.openProfile = (targetUid) => {
    if (targetUid) {
        // التحقق من أن الـ UID عبارة عن نص آمن قبل التوجيه
        const safeUid = encodeURIComponent(targetUid);
        window.location.href = 'profile.html?uid=' + safeUid;
    }
};

window.logoutUser = () => {
    // مسح الكاش المحلي فوراً
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userUid');

    const activeAuth = window.auth || auth;
    activeAuth.signOut().then(() => location.reload()); 
};

window.canSaveScore = function() {
    const activeAuth = window.auth || auth;
    if ((activeAuth && activeAuth.currentUser) || localStorage.getItem('isLoggedIn') === 'true') return true;
    window.showAuthOverlay('signup');
    return false;
};

window.getCurrentUserName = function() {
    const activeAuth = window.auth || auth;
    return (activeAuth && activeAuth.currentUser && activeAuth.currentUser.displayName) 
        ? activeAuth.currentUser.displayName 
        : localStorage.getItem('userName');
};
