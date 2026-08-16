// --- Asset Counts ---
const outfitCount = 5;
const topCount = 7;
const jacketCount = 2;
const skirtCount = 3;
const bottomCount = 7;
const shoeCount = 5;
const bagCount = 3;

let backgrounds = [
    "white",
    "pink",
    "blue",
    "green",
    "pinkHearts",
    "blueDots",
    "greenLines",
    "blackStars",
    "background1",
    "background2",
    "background3",
    "background4",
    "background5",
    "background6"
];

let outfitNumber = 1;
let generatedDataUrl = "";

let currentSkirtSrc = null;
let skirtState = 0; 

function startGame(){
    document.getElementById("start").style.display = "none";
    document.getElementById("game").classList.remove("hidden");
}

function hidePieces(){
    ["outfit", "top", "jacket", "skirt", "bag", "bottom", "shoes"].forEach(id => {
        let el = document.getElementById(id);
        if(el) {
            el.removeAttribute("src");
            el.style.display = "none";
            el.className = "";
        }
    });
    currentSkirtSrc = null;
    skirtState = 0;
}

function togglePiece(layerId, imagePath) {
    let outfit = document.getElementById("outfit");
    if (outfit) {
        outfit.removeAttribute("src");
        outfit.style.display = "none";
    }

    let item = document.getElementById(layerId);
    if (!item) return;

    if (item.src.includes(imagePath) && item.style.display !== "none") {
        item.removeAttribute("src");
        item.style.display = "none";
    } else {
        item.src = imagePath;
        item.style.display = "block";
    }
}

function changeOutfit(number){
    let outfit = document.getElementById("outfit");
    let imagePath = "images/outfit" + number + ".png";

    if (outfit && outfit.src.includes(imagePath) && outfit.style.display !== "none") {
        outfit.removeAttribute("src");
        outfit.style.display = "none";
    } else {
        hidePieces();
        if (outfit) {
            outfit.src = imagePath;
            outfit.style.display = "block";
        }
    }
}

function changeTop(number){ togglePiece("top", "images/top" + number + ".png"); }
function changeJacket(number){ togglePiece("jacket", "images/jacket" + number + ".png"); }
function changeBottom(number){ togglePiece("bottom", "images/bottom" + number + ".png"); }
function changeShoes(number){ togglePiece("shoes", "images/shoe" + number + ".png"); }
function changeBag(number){ togglePiece("bag", "images/bag" + number + ".png"); }

function selectSkirt(skirtSrc){
    let outfit = document.getElementById("outfit");
    if(outfit) {
        outfit.removeAttribute("src");
        outfit.style.display = "none";
    }

    const skirtImg = document.getElementById("skirt");

    if (currentSkirtSrc !== skirtSrc) {
        currentSkirtSrc = skirtSrc;
        skirtState = 1;
    } else {
        skirtState = (skirtState + 1) % 3;
    }

    if (skirtState === 1) {
        skirtImg.src = skirtSrc;
        skirtImg.style.display = "block";
        skirtImg.className = "skirt-over";
    } else if (skirtState === 2) {
        skirtImg.src = skirtSrc;
        skirtImg.style.display = "block";
        skirtImg.className = "skirt-under";
    } else {
        skirtImg.removeAttribute("src");
        skirtImg.style.display = "none";
        skirtImg.className = "";
        currentSkirtSrc = null;
    }
}

function resetOutfit(){
    hidePieces();
    setBackground("white");
}

function useRoom(){
    setBackground("background1");
}

function setBackground(type){
    let bg = document.getElementById("colorBackground");
    let room = document.getElementById("room");
    if (room) room.style.display = "none";

    bg.style.background = "";
    bg.style.backgroundImage = "none";

    if (type === "white") bg.style.backgroundColor = "white";
    else if (type === "black") bg.style.backgroundColor = "black";
    else if (type === "pink") bg.style.backgroundColor = "#ffd6e7";
    else if (type === "blue") bg.style.backgroundColor = "#cde7ff";
    else if (type === "green") bg.style.backgroundColor = "#d9f7d6";
    else if (type === "blueDots") {
        let c = document.createElement("canvas");
        c.width = 25; c.height = 25;
        let ctx = c.getContext("2d");
        ctx.fillStyle = "#cde7ff"; ctx.fillRect(0,0,25,25);
        ctx.fillStyle = "white"; 
        ctx.beginPath(); ctx.arc(12.5, 12.5, 3, 0, Math.PI*2); ctx.fill();
        
        bg.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
        bg.style.backgroundSize = "25px 25px";
        bg.style.backgroundRepeat = "repeat";
    } 
    else if (type === "greenLines") {
        let c = document.createElement("canvas");
        c.width = 25; c.height = 25;
        let ctx = c.getContext("2d");
        ctx.fillStyle = "#d9f7d6"; ctx.fillRect(0,0,25,25);
        let grad = ctx.createLinearGradient(0, 25, 25, 0);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.45, "rgba(255,255,255,0)");
        grad.addColorStop(0.45, "white");
        grad.addColorStop(0.55, "white");
        grad.addColorStop(0.55, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,25,25);
        
        bg.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
        bg.style.backgroundSize = "25px 25px";
        bg.style.backgroundRepeat = "repeat";
    } 
    else if (type === "pinkHearts") {
        // 1. عرض الـ SVG الأصلي الخاص بك فوراً على الشاشة
        bg.style.backgroundColor = "#ffd6e7";
        bg.style.backgroundImage = "url('heart.svg')";
        bg.style.backgroundSize = "50px 50px";
        bg.style.backgroundRepeat = "repeat";

        // 2. تحويله إلى PNG في الخلفية لمنع توقف الكاميرا عن العمل
        let img = new Image();
        img.onload = () => {
            let c = document.createElement("canvas");
            c.width = 50; c.height = 50;
            let ctx = c.getContext("2d");
            ctx.fillStyle = "#ffd6e7"; ctx.fillRect(0,0,50,50);
            ctx.drawImage(img, 0, 0, 50, 50);
            bg.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
        };
        img.src = "heart.svg";
    }
    else if (type === "blackStars") {
        // رسم النجوم باستخدام نفس المسارات (paths) الأصلية الخاصة بك بالضبط
        let c = document.createElement("canvas");
        c.width = 180; c.height = 180;
        let ctx = c.getContext("2d");
        ctx.fillStyle = "#131313"; ctx.fillRect(0,0,180,180);
        ctx.fillStyle = "white";
        ctx.fill(new Path2D("M30 20l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"));
        ctx.fill(new Path2D("M130 90l2 5 5 .5-3.5 3.5.5 5-4-2-4 2 .5-5-3.5-3.5 5-.5z"));
        ctx.fill(new Path2D("M70 140l3.5 7.5 7.5 1-5.5 5.5 1.5 7.5-6.5-3.5-6.5 3.5 1.5-7.5-5.5-5.5 7.5-1z"));
        
        bg.style.backgroundColor = "#131313";
        bg.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
        bg.style.backgroundSize = "180px 180px";
        bg.style.backgroundRepeat = "repeat";
    }
    else if (type.startsWith("background")) {
        bg.style.backgroundImage = `url('images/${type}.png')`;
        bg.style.backgroundSize = "cover";
        bg.style.backgroundPosition = "center 75%"; 
        bg.style.backgroundRepeat = "no-repeat";
    }
}

function randomLook(){
    hidePieces();

    let isFullOutfit = Math.random() < 0.20;

    if (isFullOutfit && outfitCount > 0) {
        let randomOutfitNum = Math.floor(Math.random() * outfitCount) + 1;
        let outfit = document.getElementById("outfit");
        if (outfit) {
            outfit.src = "images/outfit" + randomOutfitNum + ".png";
            outfit.style.display = "block";
        }
    } else {
        if (topCount > 0) {
            let randTop = Math.floor(Math.random() * topCount) + 1;
            let top = document.getElementById("top");
            if (top) {
                top.src = "images/top" + randTop + ".png";
                top.style.display = "block";
            }
        }

        if (jacketCount > 0 && Math.random() > 0.5) {
            let randJacket = Math.floor(Math.random() * jacketCount) + 1;
            let jacket = document.getElementById("jacket");
            if (jacket) {
                jacket.src = "images/jacket" + randJacket + ".png";
                jacket.style.display = "block";
            }
        }

        let chooseSkirt = skirtCount > 0 && (bottomCount === 0 || Math.random() > 0.5);
        if (chooseSkirt) {
            let randSkirt = Math.floor(Math.random() * skirtCount) + 1;
            let skirtSrc = "images/skirt" + randSkirt + ".png";
            let skirtImg = document.getElementById("skirt");
            if (skirtImg) {
                currentSkirtSrc = skirtSrc;
                skirtState = Math.random() > 0.5 ? 1 : 2;
                skirtImg.src = skirtSrc;
                skirtImg.style.display = "block";
                skirtImg.className = skirtState === 1 ? "skirt-over" : "skirt-under";
            }
        } else if (bottomCount > 0) {
            let randBottom = Math.floor(Math.random() * bottomCount) + 1;
            let bottom = document.getElementById("bottom");
            if (bottom) {
                bottom.src = "images/bottom" + randBottom + ".png";
                bottom.style.display = "block";
            }
        }

        if (shoeCount > 0 && Math.random() < 0.8) {
            let randShoe = Math.floor(Math.random() * shoeCount) + 1;
            let shoes = document.getElementById("shoes");
            if (shoes) {
                shoes.src = "images/shoe" + randShoe + ".png";
                shoes.style.display = "block";
            }
        }

        if (bagCount > 0 && Math.random() > 0.5) {
            let randBag = Math.floor(Math.random() * bagCount) + 1;
            let bag = document.getElementById("bag");
            if (bag) {
                bag.src = "images/bag" + randBag + ".png";
                bag.style.display = "block";
            }
        }
    }

    let randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground(randomBackground);

    let btn = document.getElementById("randomBtn");
    if(btn){
        btn.classList.remove("clicked");
        void btn.offsetWidth;
        btn.classList.add("clicked");
    }
}

function captureOutfitScene(callback) {
    let scene = document.querySelector(".scene");
    if (!scene) return;

    let clone = scene.cloneNode(true);
    let btn = clone.querySelector("#cameraBtn");
    if(btn) btn.remove();

    let base = document.getElementById("base");
    let targetWidth = base ? base.naturalWidth || 600 : 600;
    let targetHeight = base ? base.naturalHeight || 600 : 600;

    clone.style.cssText = `position: absolute; top: -9999px; left: -9999px; width: ${targetWidth}px; height: ${targetHeight}px; border: none; border-radius: 0; opacity: 1; z-index: -999;`;
    document.body.appendChild(clone);

    html2canvas(clone, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false
    }).then(canvas => {
        clone.remove();
        callback(canvas);
    }).catch(err => {
        clone.remove();
        console.error(err);
        alert("⚠️ حدث خطأ أثناء التقاط الصورة، يرجى المحاولة مرة أخرى.");
    });
}

function downloadOutfit(){
    let overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:999999; display:flex; justify-content:center; align-items:center; color:#fff; font-family:monospace;";
    overlay.innerText = "Generating...";
    document.body.appendChild(overlay);

    captureOutfitScene(canvas => {
        overlay.remove();
        canvas.toBlob(blob => {
            if (!blob) return;
            generatedDataUrl = URL.createObjectURL(blob);
            document.getElementById("saveModal").style.display = "flex";
        }, "image/png");
    });
}

function closeSaveModal() {
    document.getElementById("saveModal").style.display = "none";
}

function downloadOutfitFile() {
    if (!generatedDataUrl) return;
    let link = document.createElement("a");
    link.download = "LamyOutfit" + outfitNumber + ".png";
    link.href = generatedDataUrl;
    link.click();
    
    if (generatedDataUrl.startsWith("blob:")) {
        setTimeout(() => URL.revokeObjectURL(generatedDataUrl), 1000);
    }
    
    outfitNumber++;
    closeSaveModal();
}

async function setAsProfileOutfit() {
    let user = firebase.auth()?.currentUser;
    if (!user) return alert("⚠️ يرجى تسجيل الدخول أولاً!");

    let box = document.createElement("div");
    box.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:999999; display:flex; justify-content:center; align-items:center;";
    // لون الشريط أبيض #ffffff بالكامل 
    box.innerHTML = `
        <div style="background:#0d0d0d; border:2px solid #ff4fd8; padding:20px; text-align:center; color:#fff; font-family:monospace;">
            <div id="txt" style="margin-bottom:10px;">Loading...</div>
            <div style="width:180px; height:15px; border:1px solid #fff; padding:2px; margin:0 auto;">
                <div id="bar" style="width:70%; height:100%; background:#ffffff; transition:width 0.3s;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(box);

    captureOutfitScene(async canvas => {
        try {
            let dataUrl = canvas.toDataURL("image/png");
            await firebase.database().ref('users/' + user.uid).update({ profileImg: dataUrl });

            document.getElementById("bar").style.width = "100%";
            document.getElementById("txt").innerText = "تم تعيين الصورة بنجاح!";

            setTimeout(() => {
                box.remove();
                closeSaveModal();
            }, 1000);
        } catch (err) {
            box.remove();
            console.error(err);
            alert("⚠️ حدث خطأ أثناء الحفظ في قاعدة البيانات!");
        }
    });
}

window.addEventListener("DOMContentLoaded", () => {
    function createItems(boxID, count, type, changeFunction){
        let box = document.getElementById(boxID);
        if(!box) return;

        for(let i = 1; i <= count; i++){
            let img = document.createElement("img");
            img.className = "choice";
            let imagePath = "images/" + type + i + ".png";
            img.src = imagePath;

            if (type === "skirt") {
                img.onclick = () => selectSkirt(imagePath);
            } else {
                img.onclick = () => changeFunction(i);
            }

            box.appendChild(img);
        }
    }

    createItems("outfits", outfitCount, "outfit", changeOutfit);
    createItems("tops", topCount, "top", changeTop);
    createItems("jackets", jacketCount, "jacket", changeJacket);
    createItems("skirts", skirtCount, "skirt", null);
    createItems("bottoms", bottomCount, "bottom", changeBottom);
    createItems("shoesPanel", shoeCount, "shoe", changeShoes);
    createItems("bags", bagCount, "bag", changeBag);
});
