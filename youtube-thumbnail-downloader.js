function getVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length == 11) ? match[2] : null;
}

function setupYTDownloader() {
    const form = document.getElementById('ytForm');
    const resultDiv = document.getElementById('ytResult');
    if (!form) return;

    form.onsubmit = function (e) {
        e.preventDefault();
        const url = document.getElementById('ytUrl').value;
        const vid = getVideoId(url);
        if (!vid) {
            resultDiv.innerHTML = '<p style="color:red;">Invalid YouTube URL!</p>';
            return;
        }

        const qualities = [
            { name: 'HD (1280x720)', url: `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`, filename: `${vid}_hd.jpg` },
            { name: 'SD (640x480)', url: `https://img.youtube.com/vi/${vid}/sddefault.jpg`, filename: `${vid}_sd.jpg` },
            { name: 'Normal (480x360)', url: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`, filename: `${vid}_hq.jpg` },
            { name: 'Medium (320x180)', url: `https://img.youtube.com/vi/${vid}/mqdefault.jpg`, filename: `${vid}_mq.jpg` },
        ];

        let html = '<div class="thumbnail-grid">';
        qualities.forEach(q => {
            const displayUrl = `/api/proxy/image?url=${encodeURIComponent(q.url)}`;
            const downloadUrl = `${displayUrl}&download=true&filename=${q.filename}`;
            html += `
                <div class="thumbnail-card">
                    <img src="${displayUrl}" alt="${q.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="placeholder-text" style="display:none;">Not available</div>
                    <p>${q.name}</p>
                    <a href="${downloadUrl}" class="cta-btn" download>Download</a>
                </div>
            `;
        });
        html += '</div>';
        resultDiv.innerHTML = html;
    }
}

// For direct page load or SPA
if (document.getElementById('ytForm')) {
    setupYTDownloader();
} else {
    document.addEventListener('DOMContentLoaded', setupYTDownloader);
} 