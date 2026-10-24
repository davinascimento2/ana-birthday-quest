// Polaroid Souvenir Photo Exporter for "A Sinfonia de Ana Gleice"
// Composites WebGL canvas + Storybook Polaroid border + Romantic dedication text

function captureSouvenirPhoto() {
    return new Promise((resolve) => {
        const gameCanvas = (window.gameApp && window.gameApp.renderer)
            ? window.gameApp.renderer.domElement
            : document.querySelector('canvas');

        if (!gameCanvas) {
            console.warn('[Capture] No WebGL canvas found to capture.');
            resolve(null);
            return;
        }

        // Shutter audio effect
        if (window.musicEngine) {
            window.musicEngine.playSparkle();
        }

        // Create high-res offscreen composite canvas
        const offscreen = document.createElement('canvas');
        const srcW = gameCanvas.width || 1280;
        const srcH = gameCanvas.height || 720;

        // Polaroid aspect proportions: 30px side/top borders, 100px bottom dedication footer
        const borderX = 36;
        const borderTop = 36;
        const borderBottom = 110;

        offscreen.width = srcW + borderX * 2;
        offscreen.height = srcH + borderTop + borderBottom;

        const ctx = offscreen.getContext('2d');
        if (!ctx) {
            console.warn('[Capture] Failed to obtain 2D canvas context.');
            resolve(null);
            return;
        }

        // 1. Polaroid White / Warm Cream Cardboard Background
        ctx.fillStyle = '#fffdfa';
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);

        // Subtle vintage paper vignette / border
        ctx.strokeStyle = '#f3e8d2';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, offscreen.width - 8, offscreen.height - 8);

        // 2. Draw WebGL 3D Scene into Polaroid window
        ctx.drawImage(gameCanvas, borderX, borderTop, srcW, srcH);

        // Thin inner shadow / frame around photo
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 2;
        ctx.strokeRect(borderX, borderTop, srcW, srcH);

        // 3. Romantic Dedication Typography in the bottom footer
        const footerCenterY = borderTop + srcH + (borderBottom / 2);

        // Title
        ctx.fillStyle = '#451a03'; // Deep coffee brown
        ctx.font = 'bold 26px "Fredoka", "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌸 A Sinfonia de Ana Gleice 🎂', offscreen.width / 2, footerCenterY - 18);

        // Subtitle / Dedication
        ctx.fillStyle = '#92400e'; // Warm amber-brown
        ctx.font = '500 17px "Quicksand", sans-serif';
        ctx.fillText('Com todo amor do mundo, do seu Davi (Toadbigode) • 22 de Outubro de 2026', offscreen.width / 2, footerCenterY + 14);

        // Decorative musical notes on corners
        ctx.fillStyle = '#f59e0b';
        ctx.font = '22px sans-serif';
        ctx.fillText('🎼', borderX + 24, footerCenterY);
        ctx.fillText('💖', offscreen.width - borderX - 24, footerCenterY);

        // 4. Export as PNG and trigger download
        try {
            const dataUrl = offscreen.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = 'ana_gleice_aniversario_lembranca.png';
            downloadLink.href = dataUrl;
            document.body.appendChild(downloadLink);
            if (typeof downloadLink.click === 'function') {
                downloadLink.click();
            }
            document.body.removeChild(downloadLink);

            // Increment capture counter in state if available
            if (window.__GAME_STATE__ && window.__GAME_STATE__.ui) {
                window.__GAME_STATE__.ui.photoCapturedCount = (window.__GAME_STATE__.ui.photoCapturedCount || 0) + 1;
            }

            // Show Toast Notification
            showCaptureToast('📸 Foto souvenir salva com sucesso!');
            resolve(dataUrl);
        } catch (err) {
            console.error('[Capture] Error generating download:', err);
            resolve(null);
        }
    });
}

function showCaptureToast(message) {
    let toast = document.getElementById('capture-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'capture-toast';
        toast.style.position = 'fixed';
        toast.style.top = '24px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.zIndex = '9999';
        toast.style.padding = '12px 24px';
        toast.style.background = 'rgba(255, 253, 250, 0.96)';
        toast.style.color = '#78350f';
        toast.style.border = '2px solid #f59e0b';
        toast.style.borderRadius = '20px';
        toast.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
        toast.style.fontFamily = '"Fredoka", "Quicksand", sans-serif';
        toast.style.fontWeight = 'bold';
        toast.style.fontSize = '14px';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '8px';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        toast.style.pointerEvents = 'none';
        document.body.appendChild(toast);
    }

    toast.innerText = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-10px)';
    }, 2800);
}

// Global exposure adhering to PROJECT.md interface contracts
window.captureSouvenirPhoto = captureSouvenirPhoto;
window.captureManager = {
    captureSnapshot: captureSouvenirPhoto
};
