// --- DOM Elements ---
const modeRadios = document.querySelectorAll('input[name="mode"]');
const singleLinkSection = document.querySelector('.single-link-section');
const multiLinkSection = document.querySelector('.multi-link-section');
const singleLinkInput = document.getElementById('singleLinkInput');
const adLinks = Array.from(document.querySelectorAll('.ad-link'));
const adGrid = document.getElementById('adGrid');
const refreshBtn = document.getElementById('refreshBtn');
const refreshCounter = document.getElementById('refreshCounter');
const activeScreens = document.getElementById('activeScreens');
const saveLinksBtn = document.getElementById('saveLinksBtn');
const popupGuide = document.getElementById('popupGuide');
const gotItBtn = document.getElementById('gotItBtn');
const infoBtn = document.getElementById('infoBtn');
const tipsModal = document.getElementById('tipsModal');
const closeTipsBtn = document.getElementById('closeTipsBtn');
const refreshIntervalInput = document.getElementById('refreshInterval');
const ipRotateToggle = document.getElementById('ipRotateToggle');
const countrySelect = document.getElementById('countrySelect');
const exportStatsBtn = document.getElementById('exportStatsBtn');
const proxyStatusBtn = document.getElementById('proxyStatusBtn');
const prequalModal = document.getElementById('prequalModal');
const prequalAcceptBtn = document.getElementById('prequalAcceptBtn');
const prequalSkipBtn = document.getElementById('prequalSkipBtn');
const main = document.querySelector('main');
const userGuideBtn = document.getElementById('userGuideBtn');
const userGuideModal = document.getElementById('userGuideModal');
const closeUserGuideBtn = document.getElementById('closeUserGuideBtn');
const refreshModeRadios = document.getElementsByName('refreshMode');
const applyBtn = document.getElementById('applyBtn'); // Added applyBtn
const applyStatus = document.getElementById('applyStatus'); // Added applyStatus
const endTaskBtn = document.getElementById('endTaskBtn'); // Added endTaskBtn

let refreshCount = 0;
let mode = 'single';
let autoRefreshTimer = null;
let autoRefreshTimeout = null;
let stats = Array(10).fill().map(() => ({ loads: 0, lastUrl: '' })); // Only 10 screens

// --- Temporary state for all controls ---
let tempState = {
    mode: 'single',
    singleLink: '',
    multiLinks: Array(10).fill(''),
    refreshMode: 'auto',
    refreshInterval: 15,
    ipRotate: false,
    country: '',
};

// --- Mode Switch ---
modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        mode = document.querySelector('input[name="mode"]:checked').value;
        if (mode === 'single') {
            singleLinkSection.style.display = '';
            multiLinkSection.style.display = 'none';
        } else {
            singleLinkSection.style.display = 'none';
            multiLinkSection.style.display = '';
        }
        // updateGrid(); // REMOVE: Only update tempState, not grid
    });
});

// --- Load saved links ---
function loadLinks() {
    const saved = JSON.parse(localStorage.getItem('adsbooster-links') || '[]');
    adLinks.forEach((input, i) => {
        input.value = saved[i] || '';
    });
    const single = localStorage.getItem('adsbooster-single-link') || '';
    singleLinkInput.value = single;
}
function saveLinks() {
    const links = adLinks.map(input => input.value.trim());
    localStorage.setItem('adsbooster-links', JSON.stringify(links));
    localStorage.setItem('adsbooster-single-link', singleLinkInput.value.trim());
}

// --- Grid rendering ---
// Helper to test if a link is accessible from the selected country/proxy
async function testLinkWithProxy(url, country) {
    try {
        const response = await fetch(`/proxy-status/test-link?url=${encodeURIComponent(url)}&country=${country}`);
        const data = await response.json();
        return data.success === true;
    } catch (err) {
        return false;
    }
}

// Update updateGrid to test each link before rendering iframe
async function updateGrid() {
    adGrid.innerHTML = '';
    let active = 0;
    // Always render exactly 10 screens, in a single grid
    for (let i = 0; i < 10; i++) {
        let url = '';
        if (mode === 'single') {
            url = singleLinkInput.value.trim();
        } else {
            url = adLinks[i] ? adLinks[i].value.trim() : '';
        }
        const container = document.createElement('div');
        container.className = 'ad-frame-container';
        if (url) {
            const country = getSelectedCountry();
            const ok = await testLinkWithProxy(url, country);
            if (ok) {
                active++;
                renderIframe(container, url, i);
            } else {
                const ph = document.createElement('div');
                ph.className = 'placeholder error';
                ph.innerText = 'Link not accessible from selected country/proxy';
                container.appendChild(ph);
            }
        } else {
            const ph = document.createElement('div');
            ph.className = 'placeholder';
            ph.innerText = 'No link';
            container.appendChild(ph);
        }
        adGrid.appendChild(container);
    }
    activeScreens.innerText = `Active Screens: ${active}/10`;
}

function renderIframe(container, url, idx) {
    // Progress spinner
    const spinner = document.createElement('div');
    spinner.className = 'progress-indicator';
    container.appendChild(spinner);
    // Fallback: always remove spinner after 10s
    const removeSpinner = () => {
        if (spinner && spinner.parentNode) spinner.parentNode.removeChild(spinner);
    };
    setTimeout(removeSpinner, 10000);
    // Use backend fetch
    const iframe = document.createElement('iframe');
    iframe.className = 'ad-frame';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('loading', idx < 4 ? 'eager' : 'lazy');
    // Backend fetch URL
    const country = getSelectedCountry();
    const rotate = ipRotateToggle.checked ? '1' : '0';
    const backendUrl = `/proxy-status/fetch?url=${encodeURIComponent(url)}&country=${country}&rotate=${rotate}`;
    iframe.src = backendUrl;
    iframe.onload = () => {
        hidePlaceholder(container);
        removeSpinner();
        stats[idx].loads++;
        stats[idx].lastUrl = url;
    };
    iframe.onerror = () => {
        showPlaceholder(container);
        removeSpinner();
    };
    container.appendChild(iframe);
    // Add Adsterra 160x300 banner below the iframe
    const adDiv = document.createElement('div');
    adDiv.style = 'text-align:center;margin:0.5rem 0;';
    adDiv.innerHTML = `
    <script type="text/javascript">
    atOptions = {
        'key' : '7098f1b0fbf5bf92f6ad421fa1acbcdd',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
    };
    </script>
    <script type="text/javascript" src="//resteddiabetepocket.com/7098f1b0fbf5bf92f6ad421fa1acbcdd/invoke.js"></script>
    `;
    container.appendChild(adDiv);
}

// --- Helper: Check if at least one valid link exists ---
function hasAnyLink() {
    if (mode === 'single') {
        return !!singleLinkInput.value.trim();
    } else {
        return adLinks.some(input => !!input.value.trim());
    }
}

// --- Auto-refresh logic (updated) ---
function startAutoRefresh() {
    stopAutoRefresh();
    if (!hasAnyLink()) return; // No link, don't start auto-refresh
    const interval = Math.max(10, Math.min(60, Number(refreshIntervalInput.value))) * 1000;
    autoRefreshTimer = setInterval(() => {
        refreshAllIframes();
    }, interval);
    // 10 minute (600 sec) ke baad auto-refresh band ho jaye
    autoRefreshTimeout = setTimeout(() => {
        stopAutoRefresh();
        document.getElementById('applyStatus').innerText = 'Auto refresh stopped after 10 minutes';
        setTimeout(() => { document.getElementById('applyStatus').innerText = ''; }, 4000);
    }, 600000); // 600,000 ms = 10 min
}
function stopAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
    if (autoRefreshTimeout) clearTimeout(autoRefreshTimeout);
    autoRefreshTimeout = null;
}
refreshIntervalInput.addEventListener('change', () => {
    if (hasAnyLink()) startAutoRefresh();
    else stopAutoRefresh();
    // Do not call updateGrid here
});
ipRotateToggle.addEventListener('change', () => {
    tempState.ipRotate = ipRotateToggle.checked;
    document.getElementById('applyStatus').innerText = 'Changes not applied';
    // Do not call updateGrid here
});

function refreshAllIframes() {
    if (!hasAnyLink()) return; // No link, don't refresh
    refreshCount++;
    refreshCounter.innerText = `Refreshed: ${refreshCount}`;
    updateGrid();
}
refreshBtn.onclick = () => {
    if (hasAnyLink()) refreshAllIframes();
};

// --- Export Stats ---
exportStatsBtn.onclick = () => {
    const rows = [['Screen', 'Loads', 'Last URL']];
    stats.forEach((s, i) => rows.push([i + 1, s.loads, s.lastUrl]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'adsbooster_stats.csv';
    a.click();
};

// --- Proxy Status ---
proxyStatusBtn.onclick = async () => {
    try {
        const response = await fetch('/proxy-status');
        const data = await response.json();

        let statusHtml = '<h4>🌐 Proxy Provider Status</h4>';
        data.providers.forEach(provider => {
            const status = provider.active ? '🟢' : '🔴';
            const percentage = provider.percentage;
            const color = percentage > 80 ? 'red' : percentage > 50 ? 'orange' : 'green';

            statusHtml += `
                <div class="provider-status">
                    <span>${status} ${provider.name} (${provider.type})</span>
                    <span style="color: ${color}">${provider.used}/${provider.limit} (${percentage}%)</span>
                </div>
            `;
        });

        statusHtml += `<p><strong>Total:</strong> ${data.activeProviders}/${data.totalProviders} providers active</p>`;

        // Show last used proxy info
        if (data.lastUsedProxy) {
            statusHtml += `<div style='margin-top:1rem;padding:0.7rem 1rem;background:#f5faff;border-radius:8px;'>`;
            statusHtml += `<b>Current Proxy:</b><br>`;
            if (data.lastUsedProxy.ip) {
                statusHtml += `IP: <b>${data.lastUsedProxy.ip}</b><br>`;
            } else {
                statusHtml += `IP: <b>N/A</b><br>`;
            }
            if (data.lastUsedProxy.port) {
                statusHtml += `Port: <b>${data.lastUsedProxy.port}</b><br>`;
            } else {
                statusHtml += `Port: <b>N/A</b><br>`;
            }
            statusHtml += `Provider: <b>${data.lastUsedProxy.provider}</b><br>`;
            statusHtml += `Country: <b>${data.lastUsedProxy.country}</b><br>`;
            statusHtml += `Type: <b>${data.lastUsedProxy.type}</b>`;
            statusHtml += `</div>`;
        }

        showError(statusHtml, 'Proxy Status', false);
    } catch (err) {
        showError('Failed to load proxy status: ' + err.message);
    }
};

// --- On input change, update tempState only ---
modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        tempState.mode = document.querySelector('input[name="mode"]:checked').value;
        if (tempState.mode === 'single') {
            singleLinkSection.style.display = '';
            multiLinkSection.style.display = 'none';
        } else {
            singleLinkSection.style.display = 'none';
            multiLinkSection.style.display = '';
        }
        document.getElementById('applyStatus').innerText = 'Changes not applied';
    });
});
singleLinkInput.addEventListener('input', () => {
    tempState.singleLink = singleLinkInput.value.trim();
    document.getElementById('applyStatus').innerText = 'Changes not applied';
});
adLinks.forEach((input, i) => {
    input.addEventListener('input', () => {
        tempState.multiLinks[i] = input.value.trim();
        document.getElementById('applyStatus').innerText = 'Changes not applied';
    });
});
refreshModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        tempState.refreshMode = document.querySelector('input[name="refreshMode"]:checked').value;
        document.getElementById('applyStatus').innerText = 'Changes not applied';
    });
});
refreshIntervalInput.addEventListener('input', () => {
    tempState.refreshInterval = Number(refreshIntervalInput.value);
    document.getElementById('applyStatus').innerText = 'Changes not applied';
});
ipRotateToggle.addEventListener('change', () => {
    tempState.ipRotate = ipRotateToggle.checked;
    document.getElementById('applyStatus').innerText = 'Changes not applied';
});
countrySelect.addEventListener('change', () => {
    tempState.country = countrySelect.value;
    document.getElementById('applyStatus').innerText = 'Changes not applied';
});

// --- Apply/Submit logic ---
document.getElementById('applyBtn').onclick = async () => {
    // Apply all tempState to UI and logic
    // 1. Mode
    mode = tempState.mode;
    document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
    if (mode === 'single') {
        singleLinkSection.style.display = '';
        multiLinkSection.style.display = 'none';
        singleLinkInput.value = tempState.singleLink;
    } else {
        singleLinkSection.style.display = 'none';
        multiLinkSection.style.display = '';
        adLinks.forEach((input, i) => input.value = tempState.multiLinks[i] || '');
    }
    // 2. Refresh mode
    document.querySelector(`input[name="refreshMode"][value="${tempState.refreshMode}"]`).checked = true;
    updateRefreshMode();
    // 3. Refresh interval
    refreshIntervalInput.value = tempState.refreshInterval;
    // 4. IP rotate
    ipRotateToggle.checked = tempState.ipRotate;
    // 5. Country
    countrySelect.value = tempState.country;
    // 6. Save links
    saveLinks();
    // 7. Update grid and refresh logic
    await updateGrid(); // ONLY here! (now async)
    if (tempState.refreshMode === 'auto') startAutoRefresh();
    else stopAutoRefresh();
    document.getElementById('applyStatus').innerText = 'Changes applied!';
    setTimeout(() => { document.getElementById('applyStatus').innerText = ''; }, 2000);
    // After apply, check proxy status and show/hide link input
    await checkProxyStatusAndShowLinks();
};

// --- Pre-Qualification Logic ---
function checkPrequal() {
    const accepted = localStorage.getItem('adsbooster-prequal-accepted');
    const skipped = localStorage.getItem('adsbooster-prequal-skipped');
    if (accepted === '1') {
        prequalModal.classList.remove('show');
        main.style.display = '';
        adGrid.style.display = '';
        document.querySelector('.controls').style.display = '';
    } else if (skipped === '1') {
        prequalModal.classList.remove('show');
        main.style.display = 'none';
        showPrequalBypassMsg();
    } else {
        prequalModal.classList.add('show');
        main.style.display = 'none';
    }
}
function showPrequalBypassMsg() {
    let msg = document.getElementById('prequalBypassMsg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'prequalBypassMsg';
        msg.style.cssText = 'margin:3rem auto;text-align:center;color:#1976d2;font-size:1.2rem;max-width:400px;';
        msg.innerHTML = '<b>Ads are disabled for your session.</b><br>You chose not to participate in earning rewards.';
        document.body.appendChild(msg);
    }
}
prequalAcceptBtn.onclick = () => {
    localStorage.setItem('adsbooster-prequal-accepted', '1');
    localStorage.removeItem('adsbooster-prequal-skipped');
    prequalModal.classList.remove('show');
    main.style.display = '';
    adGrid.style.display = '';
    document.querySelector('.controls').style.display = '';
};
prequalSkipBtn.onclick = () => {
    localStorage.setItem('adsbooster-prequal-skipped', '1');
    localStorage.removeItem('adsbooster-prequal-accepted');
    prequalModal.classList.remove('show');
    main.style.display = 'none';
    showPrequalBypassMsg();
};

// --- Location & Device Targeting ---
const highCpmCountries = ['US', 'UK', 'CA', 'AU', 'FR', 'HR'];
function isHighCpmCountry(code) {
    return highCpmCountries.includes(code);
}
function checkDeviceEligibility() {
    // Device memory (in GB) and CPU cores
    const mem = navigator.deviceMemory || 2;
    const cpu = navigator.hardwareConcurrency || 2;
    // Temporarily allow all devices for testing
    return true;
    
    if (mem < 2 || cpu < 2) {
        showDeviceBlockMsg('Low-end device detected. Ads are disabled for best CPM.');
        return false;
    }
    return true;
}
function showDeviceBlockMsg(msg) {
    let el = document.getElementById('deviceBlockMsg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'deviceBlockMsg';
        el.style.cssText = 'margin:3rem auto;text-align:center;color:#e53935;font-size:1.2rem;max-width:400px;';
        document.body.appendChild(el);
    }
    el.innerHTML = `<b>${msg}</b>`;
    main.style.display = 'none';
}
function checkCountryEligibility() {
    const code = countrySelect.value;
    // Temporarily allow all countries for testing
    return true;
    
    if (code && !isHighCpmCountry(code)) {
        showDeviceBlockMsg('Only high-CPM countries (US, UK, CA, AU) are allowed for ads.');
        return false;
    }
    return true;
}
// Restrict countrySelect options
function restrictCountryOptions() {
    const allowed = ['', 'US', 'UK', 'FR', 'HR'];
    Array.from(countrySelect.options).forEach(opt => {
        if (!allowed.includes(opt.value)) opt.style.display = 'none';
        else opt.style.display = '';
    });
}
restrictCountryOptions();
countrySelect.addEventListener('change', () => {
    localStorage.setItem('adsbooster-country', countrySelect.value);
    if (!checkCountryEligibility()) return;
    // updateGrid(); // REMOVE: Only update tempState, not grid
});

// On load, check device and country
window.onload = () => {
    checkPrequal();
    restrictCountryOptions();
    if (!checkDeviceEligibility()) return;
    loadLinks();
    // Country restore
    const savedCountry = localStorage.getItem('adsbooster-country');
    if (savedCountry) countrySelect.value = savedCountry;
    if (!checkCountryEligibility()) return;
    // Do not call updateGrid here
    // Auto-refresh is now managed by input changes
};
gotItBtn.onclick = () => {
    popupGuide.classList.remove('show');
    localStorage.setItem('adsbooster-guide', '1');
};

// --- Earning Tips Modal ---
infoBtn.onclick = () => tipsModal.classList.add('show');
closeTipsBtn.onclick = () => tipsModal.classList.remove('show');

const analyticsPanel = document.createElement('div');
analyticsPanel.className = 'analytics-panel';
analyticsPanel.innerHTML = `
  <h3>Ad Analytics</h3>
  <div id="analyticsStats">Loading...</div>
  <div id="sessionDuration">Session: 0s</div>
`;
document.body.appendChild(analyticsPanel);
// Hide analytics panel after 4 seconds
setTimeout(() => {
    analyticsPanel.style.display = 'none';
}, 4000);
let sessionId = localStorage.getItem('adsbooster-session') || (Date.now() + '-' + Math.random().toString(36).slice(2));
localStorage.setItem('adsbooster-session', sessionId);
let sessionStart = Date.now();

function updateAnalytics() {
    fetch(`/analytics?session=${sessionId}`)
        .then(r => r.json())
        .then(data => {
            document.getElementById('analyticsStats').innerText = `Total Ads Viewed: ${data.views || 0}\nLast URL: ${data.lastUrl || ''}`;
        });
    fetch(`/ipinfo?session=${sessionId}`)
        .then(r => r.json())
        .then(data => {
            if (data.ip) document.getElementById('analyticsStats').innerText += `\nCurrent IP: ${data.ip}`;
        });
}
setInterval(updateAnalytics, 5000);
setInterval(() => {
    const dur = Math.floor((Date.now() - sessionStart) / 1000);
    document.getElementById('sessionDuration').innerText = `Session: ${dur}s`;
}, 1000);
updateAnalytics();

// Error popup
function showError(msg, title = 'Error', isError = true) {
    let popup = document.getElementById('errorPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'errorPopup';
        popup.className = 'modal show';
        popup.innerHTML = `
            <div class='modal-content custom-modal-content'>
                <div style='display:flex;justify-content:space-between;align-items:center;'>
                    <h2 id='errorTitle' style='margin:0;font-size:1.3rem;'>${title}</h2>
                    <button id='closeErrorBtn' style='background:none;border:none;font-size:1.5rem;cursor:pointer;color:#1976d2;' title='Close'>&times;</button>
                </div>
                <div id='errorMsg' style='margin-top:1rem;max-height:50vh;overflow:auto;text-align:left;'></div>
            </div>`;
        document.body.appendChild(popup);
        document.getElementById('closeErrorBtn').onclick = () => popup.classList.remove('show');
    }
    document.getElementById('errorTitle').innerText = title;
    document.getElementById('errorMsg').innerHTML = msg;
    popup.classList.add('show');
}

function updateRefreshMode() {
    const mode = document.querySelector('input[name="refreshMode"]:checked').value;
    if (mode === 'auto') {
        refreshIntervalInput.disabled = false;
        startAutoRefresh();
    } else {
        refreshIntervalInput.disabled = true;
        stopAutoRefresh();
    }
}
refreshModeRadios.forEach(radio => {
    radio.addEventListener('change', updateRefreshMode);
});

function updateApplyBtnState() {
    // Allow 'Any' (blank value) as a valid selection
    applyBtn.disabled = false;
    applyStatus.innerText = '';
}
countrySelect.addEventListener('change', updateApplyBtnState);
window.addEventListener('DOMContentLoaded', updateApplyBtnState);

// On page load, set refresh mode
window.addEventListener('DOMContentLoaded', () => {
    updateRefreshMode();
    
    // Debugging helper - show ads status
    setTimeout(() => {
        const debugInfo = {
            prequalAccepted: localStorage.getItem('adsbooster-prequal-accepted'),
            deviceMemory: navigator.deviceMemory || 'unknown',
            cpuCores: navigator.hardwareConcurrency || 'unknown',
            selectedCountry: countrySelect.value,
            adBlockerDetected: typeof window.getComputedStyle === 'undefined'
        };
        console.log('🔍 Ads Debug Info:', debugInfo);
        
        // Show status in UI temporarily
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:#1976d2;color:white;padding:10px;border-radius:5px;z-index:9999;font-size:12px;max-width:300px;';
        statusDiv.innerHTML = `
            <strong>Ads Status:</strong><br>
            Pre-qual: ${debugInfo.prequalAccepted === '1' ? '✅' : '❌'}<br>
            Device OK: ✅ (temporarily allowed)<br>
            Country OK: ✅ (temporarily allowed)<br>
            Memory: ${debugInfo.deviceMemory}GB<br>
            CPU: ${debugInfo.cpuCores} cores
        `;
        document.body.appendChild(statusDiv);
        
        // Auto remove after 10 seconds
        setTimeout(() => statusDiv.remove(), 10000);
    }, 2000);
});

document.getElementById('endTaskBtn').onclick = () => {
    stopAutoRefresh();
    document.getElementById('applyStatus').innerText = 'Auto refresh stopped (End Task)';
    setTimeout(() => { document.getElementById('applyStatus').innerText = ''; }, 4000);
};

// Hide link input sections by default
singleLinkSection.style.display = 'none';
multiLinkSection.style.display = 'none';

// Add function to check proxy status after Apply
async function checkProxyStatusAndShowLinks() {
    try {
        const response = await fetch('/proxy-status');
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response from /proxy-status:', text);
            singleLinkSection.style.display = 'none';
            multiLinkSection.style.display = 'none';
            document.getElementById('applyStatus').innerText = 'Error: Unexpected response from server.';
            return;
        }
        const data = await response.json();
        // Find the selected country in the proxy list
        const selectedCountry = getSelectedCountry();
        const activeProvider = data.providers && data.providers.find(p => p.country === selectedCountry && p.active);
        if (activeProvider) {
            // Proxy for selected country is active, show link input
            if (mode === 'single') {
                singleLinkSection.style.display = '';
                multiLinkSection.style.display = 'none';
            } else {
                singleLinkSection.style.display = 'none';
                multiLinkSection.style.display = '';
            }
            document.getElementById('applyStatus').innerText = 'Proxy is active. You can now enter links.';
        } else {
            singleLinkSection.style.display = 'none';
            multiLinkSection.style.display = 'none';
            document.getElementById('applyStatus').innerText = 'No active proxy for selected country. Please select another country or try again.';
        }
    } catch (err) {
        singleLinkSection.style.display = 'none';
        multiLinkSection.style.display = 'none';
        document.getElementById('applyStatus').innerText = 'Error checking proxy status: ' + err.message;
    }
}

// Helper to get the selected country code from the dropdown
function getSelectedCountry() {
    return countrySelect.value;
}

function showOrHideHeroSection() {
    const heroSection = document.getElementById('hero-section');
    // Show hero only on home page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        if (heroSection) heroSection.style.display = '';
    } else {
        if (heroSection) heroSection.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('main');
    const adGrid = document.getElementById('adGrid');

    // --- Dynamic Content Loading (SPA-like) ---
    async function loadTool(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                mainContent.innerHTML = '<p>Error loading tool. Please try again.</p>';
                return;
            }
            const html = await response.text();
            // Use a temporary div to parse the new content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const newMain = tempDiv.querySelector('main');

            if (newMain) {
                mainContent.innerHTML = '';
                mainContent.appendChild(newMain);
                window.history.pushState({ path: url }, '', url);
                showOrHideHeroSection();
                // --- Dynamically load tool JS if needed ---
                const toolScript = getToolScriptForUrl(url);
                if (toolScript) {
                    loadScript(toolScript);
                }
            } else {
                mainContent.innerHTML = '<p>Could not find main content in the loaded tool.</p>';
            }
        } catch (error) {
            console.error('Failed to load tool:', error);
            mainContent.innerHTML = '<p>Failed to load the tool. Check the console for details.</p>';
        }
    }

    // Helper: Map tool URLs to their JS files
    function getToolScriptForUrl(url) {
        if (url.includes('youtube-thumbnail-downloader')) return 'youtube-thumbnail-downloader.js';
        // Add more tool JS mappings here as needed
        return null;
    }
    // Helper: Dynamically load a JS file
    function loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.body.appendChild(script);
    }

    // --- Intercept Clicks on Tool Links ---
    document.body.addEventListener('click', e => {
        const toolLink = e.target.closest('.tool-link-card, .tool-card');
        if (toolLink && toolLink.href) {
            e.preventDefault(); // Prevent full page reload
            const url = new URL(toolLink.href);
            loadTool(url.pathname);
        }
    });

    // --- Handle Browser Back/Forward Buttons ---
    window.addEventListener('popstate', e => {
        if (e.state && e.state.path) {
            loadTool(e.state.path);
        } else {
            // If no state, it's the initial page, so reload
            location.reload();
        }
    });

    // Initial page setup is handled by the existing onload/DOMContentLoaded listeners
    showOrHideHeroSection();
    // Scroll to All Tools section if #all-tools in URL
    if (window.location.hash === '#all-tools') {
        setTimeout(() => {
            const allToolsSection = document.querySelector('.saas-multitool-dashboard');
            if (allToolsSection) allToolsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }
}); 