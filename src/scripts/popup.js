/* Element binding */
const btnCache = document.querySelector("#btn_cache");
const spanError = document.querySelector("#error");
const btnStorage = document.querySelector("#btn_storage");
const btnCookies = document.querySelector("#btn_cookies");
const btnEverything = document.querySelector("#btn_everything");

/* Element event definition */
btnCache.addEventListener("click", cleanCache);
btnStorage.addEventListener("click", cleanStorage);
btnCookies.addEventListener("click", cleanCookies);
btnEverything.addEventListener("click", cleanEverything);

/* Utility */
function animateShake(element) {
    element.classList.remove("loading");
    element.classList.remove("active");

    element.classList.add("shake");
    setTimeout(() => {
        element.classList.remove("shake")
    }, 400);
}

async function showError(message) {
    // If there is already an error on the screen, hide it
    if (spanError.classList.contains("active")) {
        spanError.classList.remove("active");
        
        setTimeout(() => {
            showError(message)
        }, 200);

        return;
    }
    
    console.error(message);

    spanError.innerHTML = message.replace("\n", "<br/>");
    spanError.classList.add("active");
}

function animateButtonActivation(element) {
    return new Promise((resolve, reject) => {
        element.classList.remove("loading");
        element.classList.add("active");
            
        setTimeout(resolve, 100);
    });    
}

function animateButtonLoading(element) {
    element.classList.add("loading");
}

function isActivated(element) {
    return element.classList.contains("active");
}

function isAllActivated() {
    let buttons = [ btnCache, btnStorage, btnCookies ];
    return buttons.reduce((a, b) => a && isActivated(b), true);
}

async function updateCleanEverythingButton() {
    if (isAllActivated()) {
        await animateButtonActivation(btnEverything);

        setTimeout(async () => {
            try { 
                let tab = await getActiveTab();
                chrome.tabs.reload(tab.id);
                window.close();
            } catch (e) {
                console.error(e);
            }
        }, 500);
    }
}

function getActiveTab() {
    return new Promise((resolve, reject) => {
        let query = { 
            currentWindow: true, 
            active: true 
        };

        chrome.tabs.query(query, tabs => {
            if (tabs && tabs.length > 0) {
                resolve(tabs.find(x => x));
            } else {
                reject("Couldn't get the active tab!");
            }
        }) ;
    });
}

function sendMessageToBackground(command) {
    return new Promise((resolve, reject) => {
        let message = { type: command };
        chrome.runtime.sendMessage(message, result => {
            if (result.error) {
                reject(result.error);
            } else {
                resolve(result.result);
            }
        });
    });
}

/* Event handler definition */
async function cleanCache() {
    try {
        if (isActivated(btnCache) || btnCache._running) return;
        btnCache._running = true;
        
        animateButtonLoading(btnCache);
        
        await sendMessageToBackground("clearCache");
        
        await animateButtonActivation(btnCache);
        
        await updateCleanEverythingButton();        
    } catch (e) {        
        showError(e);
        animateShake(btnCache);
    } finally {
        btnCache._running = false;   
    }
}

async function cleanStorage() {
    try {
        if (isActivated(btnStorage) || btnStorage._running) return;
        btnStorage._running = true;

        animateButtonLoading(btnStorage);

        await sendMessageToBackground("clearStorage");

        await animateButtonActivation(btnStorage);

        await updateCleanEverythingButton();
    } catch (e) {
        showError(e);
        animateShake(btnStorage);
    } finally {
        btnStorage._running = false;   
    }
}

async function cleanCookies() {
    try {
        if (isActivated(btnCookies) || btnCookies._running) return;
        btnCookies._running = true;

        animateButtonLoading(btnCookies);
        
        await sendMessageToBackground("clearCookies");

        await animateButtonActivation(btnCookies);

        await updateCleanEverythingButton();
    } catch (e) {
        showError(e);
        animateShake(btnCookies);
    } finally {
        btnCookies._running = false;   
    }
}

async function cleanEverything() {
    animateButtonLoading(btnEverything);
    await cleanCache();
    await cleanStorage();
    await cleanCookies();    
}