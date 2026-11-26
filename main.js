function get(selector, root = document) {
    return root.querySelector(selector);
}

// متغیرهای اصلی
const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

// متغیر برای کنترل اسپم
let isBotThinking = false; 


const BOT_IMG = "./img/bot.png";
const PERSON_IMG = "./img/user.png";
const BOT_NAME = "Buddy";
const PERSON_NAME = "User";


function saveMessageToLocal(name, img, side, text, time) {
    let history = JSON.parse(localStorage.getItem("buddy_chat_history")) || [];
    history.push({ name, img, side, text, time });
    localStorage.setItem("buddy_chat_history", JSON.stringify(history));
}


function loadChatHistory() {
    const history = JSON.parse(localStorage.getItem("buddy_chat_history")) || [];
    history.forEach(msg => {
        appendMessage(msg.name, msg.img, msg.side, msg.text, msg.time);
    });
}

function formatDate(date) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}


function appendMessage(name, img, side, text, time = null) {
    const msgTime = time || formatDate(new Date());

    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${side}-msg`;

    // ۲. تعریف ساختار داخلی (بدون قرار دادن متغیر text در اینجا)
    msgDiv.innerHTML = `
        <div class="msg-img" style="background-image: url(${img})"></div>
        <div class="msg-bubble">
            <div class="msg-info">
                <div class="msg-info-name">${name}</div>
                <div class="msg-info-time">${msgTime}</div>
            </div>
            <div class="msg-text"></div> 
        </div>
    `;

    // ۳. پیدا کردن بخش متن و قرار دادن محتوا به صورت امن
    // این خط است که جلوی XSS را می‌گیرد
    const textContainer = msgDiv.querySelector('.msg-text');
    textContainer.textContent = text; 

    // ۴. اضافه کردن کل پیام به چت
    msgerChat.appendChild(msgDiv);
    
    msgerChat.scrollTop = msgerChat.scrollHeight;
}




async function botResponse(userText) {
    // 1. خواندن توکن از فیلد مخفی HTML
    const tokenElement = document.getElementById("csrf_token");
    const csrfToken = tokenElement ? tokenElement.value : "";

    const thinkingTime = formatDate(new Date());
    appendMessage(BOT_NAME, BOT_IMG, "left", "Buddy is thinking...", thinkingTime);

    try {
        const response = await fetch('ai_proxy.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userText, 
                token: csrfToken 
            })
        });

        // --- مدیریت خطاهای خاص (مثل انقضای توکن) ---
        if (!response.ok) {
            if (response.status === 403) {
                const errorData = await response.json();
                // اگر متن خطا شامل کلمه expired بود
                if (errorData.error && errorData.error.toLowerCase().includes('expired')) {
                    msgerChat.lastElementChild.remove(); // حذف پیام "Buddy is thinking..."
                    
                    const time = formatDate(new Date());
                    appendMessage(BOT_NAME, BOT_IMG, "left", "Your security session has expired. I'm refreshing the page to secure your connection...", time);
                    
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                    
                    return; // خروج از تابع برای جلوگیری از اجرای کدهای بعدی
                }
            }
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;

        msgerChat.lastElementChild.remove(); 

        const time = formatDate(new Date());
        appendMessage(BOT_NAME, BOT_IMG, "left", aiText, time);
        saveMessageToLocal(BOT_NAME, BOT_IMG, "left", aiText, time);

    } catch (error) {
        console.error("AI Error:", error);
        if (msgerChat.lastElementChild && msgerChat.lastElementChild.innerText.includes("thinking")) {
            msgerChat.lastElementChild.remove();
        }
        const errorTime = formatDate(new Date());
        appendMessage(BOT_NAME, BOT_IMG, "left", "Sorry, my brain is lagging! Try again.", errorTime);
    } finally {
        setTimeout(() => {
            isBotThinking = false; 
            msgerInput.disabled = false;
        }, 2000);
    }
}


// مدیریت ارسال فرم
if (msgerForm) {
    msgerForm.addEventListener("submit", event => {
        event.preventDefault(); 
        
        // اگر ربات در حال فکر کردن است، اجازه ارسال نده
        if (isBotThinking) return;

        const msgText = msgerInput.value;
        if (!msgText) return;
        
        // فعال کردن حالت "در حال پردازش"
        isBotThinking = true;
        msgerInput.disabled = true; // غیرفعال کردن فیلد ورودی

        const time = formatDate(new Date());
        appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText, time);
        saveMessageToLocal(PERSON_NAME, PERSON_IMG, "right", msgText, time);
        
        msgerInput.value = "";
        
        botResponse(msgText);
    });
}


loadChatHistory();
