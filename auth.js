// 1. تحديث واجهة المستخدم لعرض اسم المستخدم الحقيقي
window.updateAuthUI = function() {
    const authHeader = document.getElementById("auth-header");
    const chatNameField = document.getElementById("name");
    const user = auth.currentUser; 

    if (user && authHeader) {
        // نستخدم user.displayName الذي تم حفظه أثناء التسجيل
        const displayName = user.displayName || 'مستخدم'; 
        authHeader.innerHTML = `
            <div style="text-align: center;">
                <span style="color:white; font-weight:bold;">مرحباً ${displayName}</span>
                <br>
                <button onclick="logoutUser()" style="margin-top: 8px; padding: 4px 12px; font-size: 13px; background-color: #2e0026; color: white; border: none; border-radius: 13px; cursor: pointer;">تسجيل خروج</button>
            </div>
        `;
    }

    if (user && chatNameField) {
        chatNameField.value = user.displayName || '';
        chatNameField.readOnly = true;
    }
};

// مراقبة تغيرات حالة المصادقة
auth.onAuthStateChanged((user) => {
    window.updateAuthUI();
});

// 2. دالة عرض نافذة تسجيل الدخول/الإنشاء
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
                <button id="submitAuthBtn" style="background:#ff4fd8; border:none; padding:10px 30px; border-radius:20px; cursor:pointer; color: white; font-weight:bold; margin-top:10px;">${currentType === 'login' ? 'دخول' : 'تسجيل'}</button>
                <p style="margin-top:15px; font-size:12px;">
                    ${currentType === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                    <span id="toggleMode" style="color:#ff4fd8; cursor:pointer; text-decoration:underline;">${currentType === 'login' ? 'سجل الآن' : 'سجل الدخول'}</span>
                </p>
            </div>
        `;

        document.getElementById('closeAuth').onclick = () => overlay.remove();
        document.getElementById('toggleMode').onclick = () => renderContent(currentType === 'login' ? 'signup' : 'login');
        
        document.getElementById('submitAuthBtn').onclick = async () => {
            const email = document.getElementById('userInputEmail').value.trim();
            const password = document.getElementById('userInputPassword').value;
            const nameInput = document.getElementById('userInputName');
            const errorDisplay = document.getElementById('authErrorDisplay');

            try {
                if (currentType === 'signup') {
                    // إنشاء حساب جديد
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    // حفظ الاسم في ملف تعريف المستخدم (Profile)
                    await userCredential.user.updateProfile({ displayName: nameInput.value.trim() });
                } else {
                    // تسجيل الدخول
                    await auth.signInWithEmailAndPassword(email, password);
                }
                overlay.remove();
            } catch (error) {
                errorDisplay.innerText = error.message;
            }
        };
    };

    renderContent(type);
};

window.logoutUser = () => {
    auth.signOut().then(() => {
        location.reload(); 
    });
};

window.canSaveScore = function() {
    if (auth.currentUser) return true;
    window.showAuthOverlay('signup');
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    window.updateAuthUI();
});
window.getCurrentUserName = function() {
    return (auth.currentUser && auth.currentUser.displayName) ? auth.currentUser.displayName : null;
};
