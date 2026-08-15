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

// Skirt 3-State Toggle Tracking
let currentSkirtSrc = null;
let skirtState = 0; // 0 = unselected, 1 = over top, 2 = under top

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

// Helper function to toggle items on/off
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

function changeTop(number){
    togglePiece("top", "images/top" + number + ".png");
}

function changeJacket(number){
    togglePiece("jacket", "images/jacket" + number + ".png");
}

function changeBottom(number){
    togglePiece("bottom", "images/bottom" + number + ".png");
}

function changeShoes(number){
    togglePiece("shoes", "images/shoe" + number + ".png");
}

function changeBag(number){
    togglePiece("bag", "images/bag" + number + ".png");
}

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

    switch(type){
        case "white":
            bg.style.background = "white";
            break;
        case "black":
            bg.style.background = "black";
            break;
        case "pink":
            bg.style.background = "#ffd6e7";
            break;
        case "blue":
            bg.style.background = "#cde7ff";
            break;
        case "green":
            bg.style.background = "#d9f7d6";
            break;
        case "pinkHearts":
            bg.style.background = "#ffd6e7";
            bg.style.backgroundImage = "url('heart.svg')";
            bg.style.backgroundSize = "50px 50px";
            break;
        case "blueDots":
            bg.style.background = "#cde7ff";
            bg.style.backgroundImage = "radial-gradient(white 3px, transparent 3px)";
            bg.style.backgroundSize = "25px 25px";
            break;
        case "greenLines":
            bg.style.background = "#d9f7d6";
            bg.style.backgroundImage = "linear-gradient(45deg, transparent 45%, white 45%, white 55%, transparent 55%)";
            bg.style.backgroundSize = "25px 25px";
            break;
        case "blackStars":
            bg.style.background = "#131313";
            bg.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Ctext x='20' y='45' font-size='25' fill='white'%3E★%3C/text%3E%3Ctext x='120' y='90' font-size='15' fill='white'%3E★%3C/text%3E%3Ctext x='70' y='150' font-size='35' fill='white'%3E★%3C/text%3E%3C/svg%3E\")";
            bg.style.backgroundSize = "180px 180px";
            break;
        default:
            if (type.startsWith("background")) {
                bg.style.backgroundImage = `url('images/${type}.png')`;
                bg.style.backgroundSize = "cover";
                bg.style.backgroundPosition = "center 75%"; 
                bg.style.backgroundRepeat = "no-repeat";
            }
            break;
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

function drawContain(ctx, img, w, h){
    let ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    let width = img.naturalWidth * ratio;
    let height = img.naturalHeight * ratio;
    let x = (w - width) / 2;
    let y = (h - height) / 2;

    ctx.drawImage(img, x, y, width, height);
}

function downloadOutfit(){
    let scene = document.querySelector(".scene").cloneNode(true);
    let base = document.getElementById("base");

    let btn = scene.querySelector("#cameraBtn");
    if(btn) btn.remove();
    scene.style.border = "none";
    scene.style.borderRadius = "0";

    let targetWidth = base.naturalWidth || 600;
    let targetHeight = base.naturalHeight || 600;

    scene.style.width = targetWidth + "px";
    scene.style.height = targetHeight + "px";
    scene.style.position = "absolute";
    scene.style.left = "-9999px";

    document.body.appendChild(scene);

    html2canvas(scene, { useCORS: true }).then(canvas => {
        generatedDataUrl = canvas.toDataURL("image/png");
        scene.remove();
        document.getElementById("saveModal").style.display = "flex";
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
    outfitNumber++;
    closeSaveModal();
}

async function setAsProfileOutfit() {
    let user = firebase.auth()?.currentUser;
    if (!user) return alert("⚠️ يرجى تسجيل الدخول أولاً!");

    let scene = document.querySelector(".scene"), base = document.getElementById("base");
    if (!scene || !base) return alert("⚠️ لم يتم العثور على المشهد!");

    // 1. إظهار نافذة التحميل
    let box = document.createElement("div");
    box.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:#0d0d0d; border:2px solid #ff4fd8; padding:20px; z-index:9999; text-align:center; color:#fff; font-family:monospace;";
    box.innerHTML = `
        <div id="txt" style="margin-bottom:10px;">Loading...</div>
        <div style="width:180px; height:15px; border:1px solid #fff; padding:2px; margin:0 auto;">
            <div id="bar" style="width:10%; height:100%; background:#fff; transition:width 0.3s;"></div>
        </div>
    `;
    document.body.appendChild(box);

    try {
        // 2. التقاط الصورة
        document.getElementById("bar").style.width = "50%";
        let tempScene = scene.cloneNode(true);
        tempScene.querySelector("#cameraBtn")?.remove();
        tempScene.style.cssText = `position:absolute; left:-9999px; width:${base.naturalWidth || 600}px; height:${base.naturalHeight || 600}px;`;
        document.body.appendChild(tempScene);

        const canvas = await html2canvas(tempScene, { useCORS: true });
        
        // 3. الحفظ في قاعدة البيانات
        document.getElementById("bar").style.width = "85%";
        await firebase.database().ref('users/' + user.uid).update({ profileImg: canvas.toDataURL("image/png") });
        tempScene.remove();

        // 4. الإكتمال ورسالة النجاح
        document.getElementById("bar").style.width = "100%";
        document.getElementById("txt").innerText = "تم تعيين الصورة بنجاح";
        document.getElementById("txt").style.color = "#ff4fd8";

        setTimeout(() => {
            box.remove();
            if (typeof closeSaveModal === 'function') closeSaveModal();
        }, 1200);

    } catch (err) {
        box.remove();
        alert("❌ حدث خطأ أثناء الحفظ!");
    }
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
