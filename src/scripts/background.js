/* Utility */
function getActiveTab() {
    return new Promise((resolve, reject) => {
        let query = { 
            currentWindow: true, 
            active: true 
        };

        chrome.tabs.query(query, result => {
            // The pre-rendered tab has been nuked, happens in omnibox search
            if (chrome.runtime.lastError) reject("Invalid tab");

            if (result) {
                // Sometimes multiple results can be returned, so pick the first valid one
                if (Array.isArray(result)) result = result.find(x => x);

                // Check if the page is visible
                if (result.index < 0) {
                    // If not, wait for it to became visible
                    chrome.webNavigation.onCommitted.addListener(function listener(details) {
                        if (details.tabId === result.id) {
                            resolve(result);

                            // Remove the listener
                            chrome.webNavigation.onCommitted.removeListener(listener);
                        }
                    });
                } else resolve(result);
            } else {
                reject("Couldn't get the active tab!");
            }
        }) ;
    });
}

function removeBrowsingData(origin, properties) {
    return new Promise((resolve, reject) => {
        try {            
            let origins = { origins: [origin] };
            chrome.browsingData.remove(origins, properties, result => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError.message);
                else resolve(result);
            });
        } catch (e) {
            console.error(e);
            reject("Unable to remove browsing data! " + e);
        }
    });
}

/* Command handler definition */
function clearCache(tab, request, sender, sendResponse) {
    let options = { 
        "cacheStorage": true,
        "cache": true
    };

    removeBrowsingData(tab.url, options)
        .then(result => {
            sendResponse({ error: null, result });
        })
        .catch(error => {
            sendResponse({ error, result: null });
        });
    
}

function clearStorage(tab, request, sender, sendResponse) {
    let options = { 
        "fileSystems": true,
        // "formData": true,
        "localStorage": true,
    };

    removeBrowsingData(tab.url, options)
        .then(result => {
            sendResponse({ error: null, result });
        })
        .catch(error => {
            sendResponse({ error, result: null });
        });
}

function clearCookies(tab, request, sender, sendResponse) {
    let options = { 
        "cookies": true
    };

    removeBrowsingData(tab.url, options)
        .then(result => {
            sendResponse({ error: null, result });
        })
        .catch(error => {
            sendResponse({ error, result: null });
        });
}

/* Event listeners */
async function onMessage(request, sender, sendResponse) {
    console.log("[CacheCleaner] [Background] Received a message!", request);
    
    // Grabs the sender tab
    let tab = sender && sender.tab ? sender.tab : await getActiveTab();
    
    // Define all commands 
    let commands = {
        "clearCache": clearCache,
        "clearStorage": clearStorage,
        "clearCookies": clearCookies
    };    

    // Executes the command by it's type
    commands[request.type] (tab, request, sender, sendResponse);
}

/* Event handler definition */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    onMessage(request, sender, sendResponse);
    return true;
});

console.log("[CacheCleaner] [Background] Initialized!");