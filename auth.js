window.updateAuthUI = function() {
    const userName = localStorage.getItem("lamyUserName");
    const authHeader = document.getElementById("auth-header");

    if (userName && authHeader) {
        // نضع الاسم وتحته زر الخروج
        authHeader.innerHTML = `
            <div style="text-align: center;">
                <span style="color:white; font-weight:bold;">مرحباً ${userName}</span>
                <br>
                <button onclick="logoutUser()" style="
                    margin-top: 8px;
                    padding: 4px 12px;
                    font-size: 13px;
                    background-color: #2e0026;
                    color: white;
                    border: none;
                    border-radius: 13px;
                    cursor: pointer;
                ">تسجيل خروج </button>
            </div>
        `;
    }

    // تحديث حقل الشات أيضاً
    const chatNameField = document.getElementById("name");
    if (userName && chatNameField) {
        chatNameField.value = userName;
        chatNameField.readOnly = true;
    }
};

window.showAuthOverlay = function(type) {
    const existing = document.getElementById("loginOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "loginOverlay";
    overlay.style.cssText = "position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.9) !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important;";
    
    overlay.innerHTML = `
        <div style="background:#222; padding:30px; border-radius:20px; border: 2px solid #ff4fd8; text-align:center; color:white; width: 300px; position: relative;">
            <button id="closeAuth" style="background:none; border:none; color:white; position:absolute; top:10px; right:10px; cursor:pointer; font-size: 20px;">✕</button>
            <h1 style="color:#ff4fd8; margin-top: 0;">${type === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h1>
            <input type="text" id="userInputName" placeholder="اسم المستخدم" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">
            ${type === 'signup' ? '<input type="email" id="userInputEmail" placeholder="البريد الإلكتروني" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">' : ''}
            <input type="password" id="userInputPassword" placeholder="كلمة المرور" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">
            <div id="authErrorDisplay" style="color: red; font-size: 14px; margin: 10px 0; height: 20px; font-weight: bold;"></div>
            <button id="submitAuthBtn" style="background:#ff4fd8; border:none; padding:10px 30px; border-radius:20px; cursor:pointer; color: white; font-weight:bold; margin-top:10px;">${type === 'login' ? 'دخول' : 'تسجيل'}</button>
        </div>
    `;
    
    document.body.appendChild(overlay);

    document.getElementById('closeAuth').onclick = () => overlay.remove();

    document.getElementById('submitAuthBtn').onclick = async () => {
        const name = document.getElementById('userInputName').value.trim();
        const password = document.getElementById('userInputPassword').value;
        const email = type === 'signup' ? document.getElementById('userInputEmail').value.trim() : null;
        const errorDisplay = document.getElementById('authErrorDisplay');

        if (!name || password.length < 5) {
            errorDisplay.innerText = "بيانات غير صالحة!";
            return;
        }

        try {
            await auth.signInAnonymously();
            localStorage.setItem("lamyUserName", name);
            if(type === 'signup') localStorage.setItem("lamyUserEmail", email);
            
            console.log("تم تسجيل الدخول بنجاح!");
            overlay.remove();
            window.updateAuthUI(); // تحديث الواجهة والشات تلقائياً
        } catch (error) {
            errorDisplay.innerText = "حدث خطأ في الاتصال!";
        }
    };
};

window.canSaveScore = function() {
    if (localStorage.getItem("lamyUserName")) return true;
    alert("سجل دخولك ليتم حفظ تقدمك.");
    window.showAuthOverlay('signup');
    return false;
};

// تشغيل واحد فقط عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.updateAuthUI();
});

window.showAuthOverlay = function(type) {
    let overlay = document.getElementById("loginOverlay");
    
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "loginOverlay";
        overlay.style.cssText = "position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.9) !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important;";
        document.body.appendChild(overlay);
    }

    const renderContent = (currentType) => {
        overlay.innerHTML = `
            <div style="background:#222; padding:30px; border-radius:20px; border: 2px solid #ff4fd8; text-align:center; color:white; width: 300px; position: relative;">
                <button id="closeAuth" style="background:none; border:none; color:white; position:absolute; top:10px; right:10px; cursor:pointer; font-size: 20px;">✕</button>
                <h1 style="color:#ff4fd8; margin-top: 0;">${currentType === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h1>
                
                <input type="text" id="userInputName" placeholder="اسم المستخدم" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">
                ${currentType === 'signup' ? '<input type="email" id="userInputEmail" placeholder="البريد الإلكتروني" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">' : ''}
                <input type="password" id="userInputPassword" placeholder="كلمة المرور" style="display:block; width: 80%; margin:10px auto; padding:10px; border-radius: 5px; border:none;">
                
                <div id="authErrorDisplay" style="color: red; font-size: 14px; margin: 10px 0; height: 20px; font-weight: bold;"></div>
                
                <button id="submitAuthBtn" style="background:#ff4fd8; border:none; padding:10px 30px; border-radius:20px; cursor:pointer; color: white; font-weight:bold; margin-top:10px;">${currentType === 'login' ? 'دخول' : 'تسجيل'}</button>
                
                <p style="margin-top:15px; font-size:12px;">
                    ${currentType === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                    <span id="toggleMode" style="color:#ff4fd8; cursor:pointer; text-decoration:underline;">
                        ${currentType === 'login' ? 'سجل الآن' : 'سجل الدخول'}
                    </span>
                </p>
            </div>
        `;

        document.getElementById('closeAuth').onclick = () => overlay.remove();
        document.getElementById('toggleMode').onclick = () => renderContent(currentType === 'login' ? 'signup' : 'login');
        
        // هنا المنطق الصحيح لتسجيل الدخول
        document.getElementById('submitAuthBtn').onclick = async () => {
            const name = document.getElementById('userInputName').value.trim();
            const password = document.getElementById('userInputPassword').value;
            const email = currentType === 'signup' ? document.getElementById('userInputEmail').value.trim() : null;
            const errorDisplay = document.getElementById('authErrorDisplay');

            if (!name || password.length < 5) {
                errorDisplay.innerText = "بيانات غير صالحة!";
                return;
            }

            try {
                // افترضنا هنا وجود كائن auth (firebase مثلاً)
                await auth.signInAnonymously(); 
                localStorage.setItem("lamyUserName", name);
                if(currentType === 'signup') localStorage.setItem("lamyUserEmail", email);
                
                overlay.remove();
                window.updateAuthUI(); 
            } catch (error) {
                errorDisplay.innerText = "لا يمكنك التسجيل في وقت الصيانة!";
            }
        };
    };

    renderContent(type);
};
