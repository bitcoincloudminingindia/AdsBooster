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
let stats = Array(10).fill().map(() => ({ loads: 0, lastUrl: '' }));

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
        updateGrid();
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
function updateGrid() {
    adGrid.innerHTML = '';
    let active = 0;
    if (mode === 'single') {
        const url = singleLinkInput.value.trim();
        for (let i = 0; i < 10; i++) {
            const container = document.createElement('div');
            container.className = 'ad-frame-container';
            if (url) {
                active++;
                renderIframe(container, url, i);
            } else {
                const ph = document.createElement('div');
                ph.className = 'placeholder';
                ph.innerText = 'No link';
                container.appendChild(ph);
            }
            adGrid.appendChild(container);
            // Banner ad inject karo
            const banner = document.createElement('div');
            banner.className = 'ad-banner-300x250';
            banner.innerHTML = `
                <script type="text/javascript">
                atOptions = {
                  'key' : 'd162a0effe7c25b6b909f12524d3104b',
                  'format' : 'iframe',
                  'height' : 250,
                  'width' : 300,
                  'params' : {}
                };
                </script>
                <script type="text/javascript" src="https://resteddiabetepocket.com/d162a0effe7c25b6b909f12524d3104b/invoke.js"></script>
            `;
            adGrid.appendChild(banner);
        }
    } else {
        adLinks.forEach((input, i) => {
            const url = input.value.trim();
            const container = document.createElement('div');
            container.className = 'ad-frame-container';
            if (url) {
                active++;
                renderIframe(container, url, i);
            } else {
                const ph = document.createElement('div');
                ph.className = 'placeholder';
                ph.innerText = 'No link';
                container.appendChild(ph);
            }
            adGrid.appendChild(container);
            // Banner ad inject karo
            const banner = document.createElement('div');
            banner.className = 'ad-banner-300x250';
            banner.innerHTML = `
                <script type="text/javascript">
                atOptions = {
                  'key' : 'd162a0effe7c25b6b909f12524d3104b',
                  'format' : 'iframe',
                  'height' : 250,
                  'width' : 300,
                  'params' : {}
                };
                </script>
                <script type="text/javascript" src="https://resteddiabetepocket.com/d162a0effe7c25b6b909f12524d3104b/invoke.js"></script>
            `;
            adGrid.appendChild(banner);
        });
    }
    activeScreens.innerText = `Active Screens: ${active}`;
}

function renderIframe(container, url, idx) {
    // Progress spinner
    const spinner = document.createElement('div');
    spinner.className = 'progress-indicator';
    container.appendChild(spinner);
    // Use backend fetch
    const iframe = document.createElement('iframe');
    iframe.className = 'ad-frame';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('loading', idx < 4 ? 'eager' : 'lazy');
    // Backend fetch URL
    const country = countrySelect.value;
    const rotate = ipRotateToggle.checked ? '1' : '0';
    const backendUrl = `/fetch?url=${encodeURIComponent(url)}&country=${country}&rotate=${rotate}`;
    iframe.src = backendUrl;
    iframe.onload = () => {
        hidePlaceholder(container);
        spinner.remove();
        stats[idx].loads++;
        stats[idx].lastUrl = url;
    };
    iframe.onerror = () => {
        showPlaceholder(container);
        spinner.remove();
    };
    container.appendChild(iframe);
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
});
ipRotateToggle.addEventListener('change', updateGrid);

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
document.getElementById('applyBtn').onclick = () => {
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
    updateGrid();
    if (tempState.refreshMode === 'auto') startAutoRefresh();
    else stopAutoRefresh();
    document.getElementById('applyStatus').innerText = 'Changes applied!';
    setTimeout(() => { document.getElementById('applyStatus').innerText = ''; }, 2000);
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
const highCpmCountries = ['US', 'UK', 'CA', 'AU'];
function isHighCpmCountry(code) {
    return highCpmCountries.includes(code);
}
function checkDeviceEligibility() {
    // Device memory (in GB) and CPU cores
    const mem = navigator.deviceMemory || 2;
    const cpu = navigator.hardwareConcurrency || 2;
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
    if (code && !isHighCpmCountry(code)) {
        showDeviceBlockMsg('Only high-CPM countries (US, UK, CA, AU) are allowed for ads.');
        return false;
    }
    return true;
}
// Restrict countrySelect options
function restrictCountryOptions() {
    const allowed = ['', 'US', 'UK', 'CA', 'AU'];
    Array.from(countrySelect.options).forEach(opt => {
        if (!allowed.includes(opt.value)) opt.style.display = 'none';
        else opt.style.display = '';
    });
}
restrictCountryOptions();
countrySelect.addEventListener('change', () => {
    localStorage.setItem('adsbooster-country', countrySelect.value);
    if (!checkCountryEligibility()) return;
    updateGrid();
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
    updateGrid();
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

// On page load, set refresh mode
window.addEventListener('DOMContentLoaded', () => {
    updateRefreshMode();
});

document.getElementById('endTaskBtn').onclick = () => {
    stopAutoRefresh();
    document.getElementById('applyStatus').innerText = 'Auto refresh stopped (End Task)';
    setTimeout(() => { document.getElementById('applyStatus').innerText = ''; }, 4000);
}; 