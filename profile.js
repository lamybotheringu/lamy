document.addEventListener('DOMContentLoaded', () => {

    const getLoadingUI = () => `
        <div class="retro-loading-box">
            <div class="retro-loading-inline">
                <div class="retro-loading-hearts-inline">
                    <span>♥</span><span>♥</span><span>♥</span>
                </div>
                <span>Loading</span>
            </div>
        </div>
    `;

    const urlParams = new URLSearchParams(window.location.search);
    let targetUid = urlParams.get('uid');

    const nameEl = document.getElementById('profileName');
    const joinDateEl = document.getElementById('profileJoinDate');
    const genderDisplay = document.getElementById('genderDisplay');
    const genderSelect = document.getElementById('genderSelect');
    const dressupProfileBox = document.getElementById('dressupprofile');
    
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const editNameInput = document.getElementById('editNameInput');

    const scoresContainer = document.getElementById('scoresContainer');
    const postsContainer = document.getElementById('postsContainer');
    const ownerSection = document.getElementById('ownerPostSection');
    const postBtn = document.getElementById('addPostBtn');
    const postInput = document.getElementById('postInput');

    let currentUserData = {};
    let currentAuthUser = null;

    const showElement = (el) => {
        if (!el) return;
        el.classList.remove('hidden');
        el.style.display = 'block';
    };

    const hideElement = (el) => {
        if (!el) return;
        el.classList.add('hidden');
        el.style.display = 'none';
    };

    firebase.auth().onAuthStateChanged((currentUser) => {
        currentAuthUser = currentUser;

        if (!targetUid && currentUser) {
            targetUid = currentUser.uid;
            window.history.replaceState(null, '', '?uid=' + targetUid);
        }

        if (!targetUid) {
            if (nameEl) nameEl.innerText = "👤 ملف غير معروف";
            if (joinDateEl) joinDateEl.innerHTML = "📅 <strong>تاريخ الانضمام:</strong> يرجى فتح البروفايل برابط يتضمن UID";
            return;
        }

        loadProfileData(targetUid);
        loadUserPosts(targetUid);

        if (currentUser && currentUser.uid === targetUid) {
            showElement(ownerSection);
            showElement(editProfileBtn);

            if (editProfileBtn) {
                editProfileBtn.onclick = () => {
                    if (editNameInput) {
                        editNameInput.value = currentUserData.name || (currentAuthUser ? currentAuthUser.displayName : '') || '';
                        editNameInput.disabled = true;
                        editNameInput.style.backgroundColor = '#222';
                        editNameInput.style.color = '#888';
                        editNameInput.style.cursor = 'not-allowed';

                        let warningDiv = document.getElementById('nameRedWarning');
                        if (!warningDiv) {
                            warningDiv = document.createElement('div');
                            warningDiv.id = 'nameRedWarning';
                            warningDiv.style.color = '#ff4d4d';
                            warningDiv.style.fontSize = '12px';
                            warningDiv.style.marginBottom = '6px';
                            warningDiv.style.fontWeight = 'bold';
                            warningDiv.style.textAlign = 'right';
                            editNameInput.parentNode.insertBefore(warningDiv, editNameInput);
                        }
                    }

                    if (genderSelect) genderSelect.value = currentUserData.gender || 'غير معين';
                    
                    if (editProfileModal) {
                        editProfileModal.classList.remove('hidden');
                        editProfileModal.style.display = 'flex';
                    }
                };
            }

            if (closeEditModalBtn) {
                closeEditModalBtn.onclick = () => hideElement(editProfileModal);
            }

            if (saveProfileBtn) {
                saveProfileBtn.onclick = async () => {
                    const newGender = genderSelect.value;

                    saveProfileBtn.disabled = true;
                    saveProfileBtn.innerText = 'جاري الحفظ...';

                    try {
                        const updates = {};
                        updates['users/' + targetUid + '/gender'] = newGender;

                        await firebase.database().ref().update(updates);

                        updateGenderDisplay(newGender);
                        currentUserData.gender = newGender;

                        alert("تم تحديث البيانات بنجاح!");
                        hideElement(editProfileModal);

                    } catch (err) {
                        alert("خطأ أثناء الحفظ: " + err.message);
                    } finally {
                        saveProfileBtn.disabled = false;
                        saveProfileBtn.innerText = 'حفظ';
                    }
                };
            }

            if (postBtn) {
                postBtn.onclick = async () => {
                    const text = postInput.value;
                    if (!text.trim()) return;

                    postBtn.disabled = true;
                    postBtn.innerText = 'جاري النشر...';

                    try {
                        const postDate = new Date().toLocaleDateString('ar-EG', {
                            hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', year: 'numeric'
                        });

                        const authorName = currentUserData.name || (currentAuthUser ? currentAuthUser.displayName : '') || 'مستخدم';

                        await firebase.database().ref('user_posts/' + targetUid).push({
                            text: text,
                            date: postDate,
                            authorName: authorName
                        });

                        postInput.value = '';
                    } catch (err) {
                        alert("حدث خطأ أثناء النشر: " + err.message);
                    } finally {
                        postBtn.disabled = false;
                        postBtn.innerText = 'نشر المشاركة';
                    }
                };
            }
        } else {
            hideElement(ownerSection);
            hideElement(editProfileBtn);
            hideElement(editProfileModal);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.post-menu-container') && !e.target.closest('.inline-edit-box') && !e.target.closest('.inline-likes-box')) {
            document.querySelectorAll('.post-dropdown-menu').forEach(m => m.style.display = 'none');
        }
    });

    function updateGenderDisplay(gender) {
        if (!genderDisplay) return;

        const isModern = document.body.classList.contains("modern");
        let genderHTML = `⚧ <strong>الجنس:</strong> `;

        if (isModern) {
            if (gender === 'أنثى 🌸') {
                genderHTML += `<span class="gender-tag female-neon">${gender}</span>`;
            } else if (gender === 'ذكر ⚽') {
                genderHTML += `<span class="gender-tag male-neon">${gender}</span>`;
            } else {
                genderHTML += `<span class="gender-tag unassigned-neon">${gender}</span>`;
            }
        } else {
            genderHTML += `<strong class="gender-tag">${gender}</strong>`;
        }

        genderDisplay.innerHTML = genderHTML;
    }

    async function fetchRankFromLeaderboard(path, uid, displayName, higherIsBetter = true) {
        try {
            const snap = await firebase.database().ref(path).once('value');
            if (!snap.exists()) return 0;
            
            let list = [];
            snap.forEach(child => {
                const key = child.key;
                const val = child.val();
                let score = 0;
                let name = '';
                
                if (typeof val === 'object' && val !== null) {
                    score = Number(val.score || val.points || val.wins || val.time || val.moves || 0);
                    name = val.name || '';
                } else {
                    score = Number(val || 0);
                }
                list.push({ key, name, score });
            });

            if (higherIsBetter) {
                list.sort((a, b) => b.score - a.score);
            } else {
                list.sort((a, b) => a.score - b.score);
            }

            let rank = 0;
            for (let i = 0; i < list.length; i++) {
                const itemKey = String(list[i].key || '');
                const itemName = String(list[i].name || '');
                const targetNameStr = String(displayName || '');

                if (itemKey === uid || (targetNameStr && itemName === targetNameStr) || (targetNameStr && decodeURIComponent(itemKey) === targetNameStr)) {
                    rank = i + 1;
                    break;
                }
            }
            return rank;
        } catch (e) {
            return 0;
        }
    }

    async function loadProfileData(uid) {
        if (genderDisplay) genderDisplay.innerHTML = '';
        if (joinDateEl) joinDateEl.innerHTML = '';

        if (dressupProfileBox) dressupProfileBox.innerHTML = getLoadingUI();
        if (scoresContainer) scoresContainer.innerHTML = getLoadingUI();

        firebase.database().ref('users/' + uid).once('value', async (snapshot) => {
            currentUserData = snapshot.val() || {};
            
            let displayName = currentUserData.name || 'مستخدم';
            let joinDate = currentUserData.joinedAt;
            let treeWinsCount = currentUserData.treeWins || 0;
            let xoWinsCount = currentUserData.xoWins || 0;
            const gender = currentUserData.gender || 'غير معين';
            const profileImgUrl = currentUserData.profileImg || '';

            if ((!joinDate || joinDate === "2026-08-01") && currentAuthUser && currentAuthUser.uid === uid) {
                const creationTime = currentAuthUser.metadata.creationTime;
                joinDate = creationTime ? new Date(creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                
                await firebase.database().ref('users/' + uid).update({ joinedAt: joinDate });
            } else if (!joinDate || joinDate === "2026-08-01") {
                joinDate = 'قريباً (يتحدث عند أول زيارة)';
            }

            if (nameEl) nameEl.innerText = "👤 " + displayName;
            if (joinDateEl) joinDateEl.innerHTML = "📅 <strong>تاريخ الانضمام:</strong> " + joinDate;
            
            updateGenderDisplay(gender);
            if (genderSelect) genderSelect.value = gender;

            if (dressupProfileBox) {
                if (profileImgUrl) {
                    dressupProfileBox.innerHTML = `<img src="${profileImgUrl}" alt="Lamy Outfit" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 6px;">`;
                } else {
                    dressupProfileBox.innerHTML = `<span style="font-family: 'VT323', monospace; font-size: 14px; color: #ff4fd8;">♡ DressUp Profile ♡</span>`;
                }
            }

            const [treeRank, clickerRank, xoRank, bunnyRank, easyRank, medRank, hardRank] = await Promise.all([
                fetchRankFromLeaderboard('leaderboards/tree', uid, displayName, true),
                fetchRankFromLeaderboard('leaderboards/clicker', uid, displayName, true),
                fetchRankFromLeaderboard('leaderboards/xo', uid, displayName, true),
                fetchRankFromLeaderboard('leaderboards/bunny', uid, displayName, true),
                fetchRankFromLeaderboard('leaderboards/memory/easy', uid, displayName, true),
                fetchRankFromLeaderboard('leaderboards/memory/medium', uid, displayName, true),
                fetchRankFromLeaderboard('leaderboards/memory/hard', uid, displayName, true)
            ]);

            renderRanks({ 
                tree: treeRank, 
                clicker: clickerRank, 
                xo: xoRank, 
                bunny: bunnyRank, 
                easy: easyRank, 
                med: medRank, 
                hard: hardRank,
                treeWins: treeWinsCount,
                xoWins: xoWinsCount
            });
        });
    }

    function renderRanks(ranks) {
        let scoresHTML = '';
        
        scoresHTML += `<div class="score-item"><span class="score-game-name">❌  إنتصارات الـ XO</span><span class="score-val">${ranks.xoWins || 0}</span></div>`;
        scoresHTML += `<div class="score-item"><span class="score-game-name">🥊 إنتصارات الـ KO</span><span class="score-val">${ranks.treeWins || 0}</span></div>`;

        if (ranks.tree > 0) scoresHTML += `<div class="score-item"><span class="score-game-name">🌳 لعبة الشجرة</span><span class="score-val">المركز #${ranks.tree}</span></div>`;
        if (ranks.clicker > 0) scoresHTML += `<div class="score-item"><span class="score-game-name">👆 لعبة النقرات</span><span class="score-val">المركز #${ranks.clicker}</span></div>`;
        if (ranks.xo > 0) scoresHTML += `<div class="score-item"><span class="score-game-name">❌ لعبة XO</span><span class="score-val">المركز #${ranks.xo}</span></div>`;
        if (ranks.easy > 0) scoresHTML += `<div class="score-item"><span class="score-game-name">🧠 لعبة الذاكرة (Easy)</span><span class="score-val">المركز #${ranks.easy}</span></div>`;
        if (ranks.med > 0) scoresHTML += `<div class="score-item"><span class="score-game-name">🧠 لعبة الذاكرة (Medium)</span><span class="score-val">المركز #${ranks.med}</span></div>`;
        if (ranks.hard > 0) scoresHTML += `<div class="score-item"><span class="score-game-name">🧠 لعبة الذاكرة (Hard)</span><span class="score-val">المركز #${ranks.hard}</span></div>`;
        if (ranks.bunny > 0) scoresHTML += `<div class="score-item"><span class="score-game-name">🐇 لعبة الأرنب</span><span class="score-val">المركز #${ranks.bunny}</span></div>`;

        if (!scoresHTML) scoresHTML = `<p class="empty-text">لا توجد مراكز مسجلة في الألعاب بعد.</p>`;
        if (scoresContainer) scoresContainer.innerHTML = scoresHTML;
    }

    function loadUserPosts(uid) {
        if (postsContainer) postsContainer.innerHTML = getLoadingUI();

        firebase.database().ref('user_posts/' + uid).on('value', (snapshot) => {
            if (!postsContainer) return;
            const data = snapshot.val();
            if (!data) {
                postsContainer.innerHTML = '<p class="empty-text">لا توجد منشورات لهذا العضو بعد.</p>';
                return;
            }

            const postsEntries = Object.entries(data).reverse();
            let htmlBuffer = '';

            postsEntries.forEach(([postId, post]) => {
                const likesObj = post.likes || {};
                const likesCount = Object.keys(likesObj).length;
                const isLikedByMe = currentAuthUser && likesObj[currentAuthUser.uid];
                const isOwner = currentAuthUser && currentAuthUser.uid === uid;
                
                const commentsObj = post.comments || {};
                const commentsCount = Object.keys(commentsObj).length;

                htmlBuffer += `
                    <div class="post-item" data-post-id="${postId}" style="position: relative; padding-top: 15px;">
                        ${isOwner ? `
                            <div class="post-menu-container" style="position: absolute; top: 5px; left: 10px;">
                                <button type="button" onclick="window.togglePostMenu('${postId}')" style="background: none; border: none; color: #ff4fd8; font-size: 20px; cursor: pointer; padding: 0 5px;">⋮</button>
                                <div id="menu-${postId}" class="post-dropdown-menu" style="position: absolute; top: 25px; left: 0; background: #222; border: 1px solid #ff4fd8; border-radius: 6px; z-index: 100; display: none; flex-direction: column; min-width: 90px; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">
                                    <button type="button" onclick="window.openInlineEdit('${uid}', '${postId}')" style="background: none; border: none; color: #fff; padding: 6px 10px; text-align: right; cursor: pointer; font-size: 12px; border-bottom: 1px solid #444;">✏️ تعديل</button>
                                    <button type="button" onclick="window.deletePost('${uid}', '${postId}')" style="background: none; border: none; color: #ff4d4d; padding: 6px 10px; text-align: right; cursor: pointer; font-size: 12px;">🗑️ حذف</button>
                                </div>
                            </div>
                        ` : ''}

                        <div id="content-container-${postId}">
                            <pre style="white-space: pre-wrap; font-family: monospace; text-align: center; background: transparent; border: none; color: inherit; margin: 0 auto; padding: 0; font-size: 13px; line-height: 1.15; display: inline-block; width: 100%;">${escapeHTML(post.text)}</pre>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <button type="button" onclick="window.toggleLike('${uid}', '${postId}')" style="background: none; border: none; cursor: pointer; font-size: 16px; color: ${isLikedByMe ? '#ff4d4d' : '#fff'}; display: flex; align-items: center; gap: 4px;">
                                    ${isLikedByMe ? '❤︎' : '♡'} <span style="font-size: 12px; color: #ccc;" onclick="event.stopPropagation(); window.toggleLikesList('${uid}', '${postId}')">${likesCount}</span>
                                </button>
                                <button type="button" onclick="window.toggleComments('${postId}')" style="background: none; border: none; cursor: pointer; font-size: 14px; color: #fff; display: flex; align-items: center; gap: 4px;">
                                    💬 <span style="font-size: 12px; color: #ccc;">${commentsCount}</span>
                                </button>
                            </div>
                            <span class="post-date" style="font-size: 11px; color: #aaa;">🕒 ${post.date}</span>
                        </div>

                        <div id="likes-box-${postId}" class="inline-likes-box" style="display: none; margin-top: 8px; background: rgba(0,0,0,0.3); border: 1px solid #ff4fd8; border-radius: 6px; padding: 8px; font-size: 12px; color: #fff; text-align: right;">
                            <div style="font-weight: bold; margin-bottom: 4px; color: #ff4fd8; border-bottom: 1px solid #444; padding-bottom: 2px;">الأشخاص المعجبون:</div>
                            <div id="likes-list-content-${postId}"></div>
                        </div>

                        <div id="comments-box-${postId}" style="display: none; margin-top: 10px; background: rgba(0,0,0,0.2); border: 1px solid #ff4fd8; border-radius: 6px; padding: 8px; text-align: right;">
                            <div id="comments-list-${postId}" style="margin-bottom: 8px; max-height: 150px; overflow-y: auto; padding-right: 4px;">
                                ${renderCommentsHTML(commentsObj, uid, postId)}
                            </div>
                            <div style="display: flex; gap: 5px; margin-top: 8px;">
                                <input type="text" id="comment-input-${postId}" placeholder="اكتب تعليقاً..." style="flex: 1; background: #111; color: #fff; border: 1px solid #ff4fd8; border-radius: 4px; padding: 6px 8px; font-size: 12px; outline: none;">
                                <button onclick="window.addComment('${uid}', '${postId}')" style="background: #ff4fd8; color: #000; border: none; border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: bold;">إرسال</button>
                            </div>
                        </div>

                    </div>
                `;
            });
            postsContainer.innerHTML = htmlBuffer;
        });
    }
});

window.togglePostMenu = function(postId) {
    const menu = document.getElementById(`menu-${postId}`);
    if (!menu) return;
    const isVisible = menu.style.display === 'flex';
    document.querySelectorAll('.post-dropdown-menu').forEach(m => m.style.display = 'none');
    menu.style.display = isVisible ? 'none' : 'flex';
};

window.openInlineEdit = function(uid, postId) {
    document.querySelectorAll('.post-dropdown-menu').forEach(m => m.style.display = 'none');
    const container = document.getElementById(`content-container-${postId}`);
    if (!container) return;

    const currentPre = container.querySelector('pre');
    const currentText = currentPre ? currentPre.innerText : '';

    container.innerHTML = `
        <div class="inline-edit-box" style="display: flex; flex-direction: column; gap: 6px; margin-top: 5px;">
            <textarea id="edit-textarea-${postId}" style="width: 100%; height: 90px; background: #111; color: #fff; border: 1px solid #ff4fd8; border-radius: 6px; padding: 6px; font-family: monospace; font-size: 12px; resize: vertical;">${currentText}</textarea>
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
                <button type="button" onclick="window.saveInlineEdit('${uid}', '${postId}')" style="background: #ff4fd8; color: #000; border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; font-weight: bold;">حفظ</button>
                <button type="button" onclick="window.cancelInlineEdit('${uid}', '${postId}')" style="background: #444; color: #fff; border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer;">إلغاء</button>
            </div>
        </div>
    `;
};

window.saveInlineEdit = async function(uid, postId) {
    const textarea = document.getElementById(`edit-textarea-${postId}`);
    if (!textarea) return;
    const newText = textarea.value;

    if (!newText.trim()) {
        alert("لا يمكن أن يكون المنشور فارغاً!");
        return;
    }

    try {
        await firebase.database().ref(`user_posts/${uid}/${postId}`).update({ text: newText });
    } catch (err) {
        alert("حدث خطأ أثناء التعديل: " + err.message);
    }
};

window.cancelInlineEdit = function(uid, postId) {
    firebase.database().ref(`user_posts/${uid}/${postId}/text`).once('value', snap => {
        const container = document.getElementById(`content-container-${postId}`);
        if (container) {
            container.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; text-align: center; background: transparent; border: none; color: inherit; margin: 0 auto; padding: 0; font-size: 13px; line-height: 1.15; display: inline-block; width: 100%;">${escapeHTML(snap.val() || '')}</pre>`;
        }
    });
};

window.deletePost = async function(uid, postId) {
    if (confirm("هل أنت متأكد من حذف هذا المنشور؟")) {
        try {
            await firebase.database().ref(`user_posts/${uid}/${postId}`).remove();
        } catch (err) {
            alert("حدث خطأ أثناء الحذف: " + err.message);
        }
    }
};

window.toggleLike = async function(uid, postId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("يرجى تسجيل الدخول للإعجاب بالمنشورات!");
        return;
    }

    const likeRef = firebase.database().ref(`user_posts/${uid}/${postId}/likes/${user.uid}`);
    const snap = await likeRef.once('value');

    if (snap.exists()) {
        await likeRef.remove();
    } else {
        let userName = user.displayName || "مستخدم";
        try {
            const userSnap = await firebase.database().ref(`users/${user.uid}/name`).once('value');
            if (userSnap.exists()) userName = userSnap.val();
        } catch (e) {}

        await likeRef.set({ name: userName, timestamp: Date.now() });
    }
};

window.toggleLikesList = async function(uid, postId) {
    const box = document.getElementById(`likes-box-${postId}`);
    const contentBox = document.getElementById(`likes-list-content-${postId}`);
    if (!box || !contentBox) return;

    if (box.style.display === 'block') {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';

    contentBox.innerHTML = `
        <div class="retro-loading-box" style="padding: 10px 0;">
            <div class="retro-loading-inline" style="font-size: 15px;">
                <div class="retro-loading-hearts-inline">
                    <span>♥</span><span>♥</span><span>♥</span>
                </div>
                <span>Loading</span>
            </div>
        </div>
    `;

    const snap = await firebase.database().ref(`user_posts/${uid}/${postId}/likes`).once('value');
    const likesData = snap.val();

    if (!likesData) {
        contentBox.innerHTML = 'لا توجد إعجابات حتى الآن.';
        return;
    }

    const names = Object.values(likesData).map(l => `• ${escapeHTML(l.name || "مجهول")}`).join('<br>');
    contentBox.innerHTML = names;
};

window.toggleComments = function(postId) {
    const box = document.getElementById(`comments-box-${postId}`);
    if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }
};

window.addComment = async function(uid, postId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("يرجى تسجيل الدخول للتعليق!");
        return;
    }

    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    let userName = user.displayName || "مستخدم";
    try {
        const userSnap = await firebase.database().ref(`users/${user.uid}/name`).once('value');
        if (userSnap.exists()) userName = userSnap.val();
    } catch (e) {}

    const commentData = {
        authorId: user.uid,
        authorName: userName,
        text: text,
        timestamp: Date.now()
    };

    try {
        await firebase.database().ref(`user_posts/${uid}/${postId}/comments`).push(commentData);
        input.value = ''; 
    } catch (err) {
        alert("حدث خطأ أثناء إضافة التعليق: " + err.message);
    }
};

window.deleteComment = async function(uid, postId, commentId) {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
        try {
            await firebase.database().ref(`user_posts/${uid}/${postId}/comments/${commentId}`).remove();
        } catch (err) {
            alert("حدث خطأ أثناء الحذف: " + err.message);
        }
    }
};

function renderCommentsHTML(commentsObj, profileUid, postId) {
    if (!commentsObj || Object.keys(commentsObj).length === 0) {
        return '<div style="font-size:11px; color:#aaa; text-align: center;">لا توجد تعليقات، كُن أول من يعلق!</div>';
    }
    
    let html = '';
    const currentUser = firebase.auth().currentUser;
    
    Object.entries(commentsObj).forEach(([commentId, comment]) => {
        const isProfileOwner = currentUser && currentUser.uid === profileUid;
        const isCommentAuthor = currentUser && currentUser.uid === comment.authorId;
        const canDelete = isProfileOwner || isCommentAuthor;

        html += `
            <div style="font-size: 12px; margin-bottom: 6px; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 4px; text-align: right; border-right: 2px solid #ff4fd8;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 4px;">
                    <strong style="color: #ff4fd8;">${escapeHTML(comment.authorName || 'مستخدم')}</strong>
                    ${canDelete ? `<button onclick="window.deleteComment('${profileUid}', '${postId}', '${commentId}')" style="background: none; border: none; color: #ff4d4d; font-size: 12px; cursor: pointer;" title="حذف التعليق">🗑️</button>` : ''}
                </div>
                <div style="color: #ddd;">${escapeHTML(comment.text)}</div>
            </div>
        `;
    });
    return html;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}