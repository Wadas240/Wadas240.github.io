// Initialize Local Storage for History
function initializeStorage() {
    if (!localStorage.getItem('qrHistory')) {
        localStorage.setItem('qrHistory', JSON.stringify([]));
    }
}

// Save item to history
function saveToHistory(type, content, timestamp = Date.now()) {
    const history = JSON.parse(localStorage.getItem('qrHistory'));
    history.unshift({ type, content, timestamp });
    localStorage.setItem('qrHistory', JSON.stringify(history));
    updateHistoryView();
}

// Update history view
function updateHistoryView(filter = 'all') {
    const historyList = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('qrHistory'));
    
    const filteredHistory = history.filter(item => {
        if (filter === 'all') return true;
        return item.type === filter;
    });

    historyList.innerHTML = filteredHistory.map(item => `
        <div class="history-item">
            <div class="history-content">
                <strong>${item.type === 'generated' ? 'Generated' : 'Scanned'}</strong>
                <p>${item.content}</p>
                <small>${new Date(item.timestamp).toLocaleString()}</small>
            </div>
            <div class="history-actions">
                <button onclick="copyToClipboard('${item.content}')" class="action-btn">
                    <i class="fas fa-copy"></i>
                </button>
                ${item.type === 'generated' ? `
                <button onclick="regenerateQR('${item.content}')" class="action-btn">
                    <i class="fas fa-redo"></i>
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Template generators
const templates = {
    wifi: () => {
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="template-form">
                <input type="text" placeholder="Network Name (SSID)" id="wifi-ssid">
                <input type="password" placeholder="Password" id="wifi-password">
                <select id="wifi-encryption">
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No Password</option>
                </select>
                <button onclick="generateWifiQR()">Generate WiFi QR Code</button>
            </div>
        `;
        return form;
    },
    contact: () => {
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="template-form">
                <input type="text" placeholder="Name" id="contact-name">
                <input type="tel" placeholder="Phone" id="contact-phone">
                <input type="email" placeholder="Email" id="contact-email">
                <button onclick="generateContactQR()">Generate Contact QR Code</button>
            </div>
        `;
        return form;
    },
    // Add other template generators here
};

// Cache DOM elements
let cachedElements = {};

// Function to get DOM element with caching
function getElement(id) {
    if (!cachedElements[id]) {
        cachedElements[id] = document.getElementById(id);
    }
    return cachedElements[id];
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // Load minimum required functionality first
    initializeStorage();
    
    // Lazy load features based on tab selection
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const tab = btn.dataset.tab;
            
            // Load required features based on tab
            switch(tab) {
                case 'scan':
                    await loadScanner();
                    break;
                case 'batch':
                    await loadBatchFeatures();
                    break;
                case 'advanced':
                    await loadAdvancedFeatures();
                    break;
            }
        });
    });

    // Initialize login button
    const loginBtn = getElement('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            await loadFirebase();
            loginWithGoogle();
        });
    }
    // File Upload Handling
    const fileInput = document.getElementById('qr-file-input');
    const uploadArea = document.getElementById('upload-area');
    const uploadBtn = uploadArea.querySelector('.upload-btn');

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleQRFile(file);
    });

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleQRFile(file);
    });

    function handleQRFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    document.getElementById('scan-result').innerHTML = 
                        `<div class="result-card">
                            <i class="fas fa-check-circle" style="color: #4CAF50; font-size: 2rem;"></i>
                            <p style="margin: 1rem 0;">QR Code successfully scanned!</p>
                            <p><strong>Content:</strong> ${code.data}</p>
                            <button class="action-btn" onclick="copyToClipboard('${code.data.replace(/'/g, "\\'")}')">
                                <i class="fas fa-copy"></i> Copy Content
                            </button>
                         </div>`;
                } else {
                    document.getElementById('scan-result').innerHTML = 
                        `<div class="result-card">
                            <i class="fas fa-exclamation-circle" style="color: #f44336; font-size: 2rem;"></i>
                            <p style="margin: 1rem 0;">No QR code found in the image.</p>
                         </div>`;
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Scan Options Switching
    const scanOptionBtns = document.querySelectorAll('.scan-option-btn');
    const cameraScanner = document.getElementById('camera-scanner');
    const fileScanner = document.getElementById('file-scanner');

    scanOptionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const option = btn.dataset.option;
            
            // Update active button
            scanOptionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show/hide appropriate scanner
            if (option === 'camera') {
                cameraScanner.style.display = 'block';
                fileScanner.style.display = 'none';
                if (window.scanner) window.scanner.start();
            } else {
                cameraScanner.style.display = 'none';
                fileScanner.style.display = 'block';
                if (window.scanner) window.scanner.stop();
            }
        });
    });

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show active content
            tabContents.forEach(content => {
                content.style.display = content.id === tabId ? 'block' : 'none';
            });

            // Stop scanner when switching to generate tab
            if (tabId === 'generate' && window.scanner) {
                window.scanner.stop();
            }

            // Start scanner when switching to scan tab
            if (tabId === 'scan') {
                initScanner();
            }
        });
    });

    // QR Code Generation
    const qrText = document.getElementById('qr-text');
    const generateBtn = document.getElementById('generate-btn');
    const qrCode = document.getElementById('qr-code');
    const downloadLink = document.getElementById('download-link');

    let qrInstance = null;

    // Function to show copy success message
    function showCopySuccess() {
        const message = document.createElement('div');
        message.className = 'copy-success';
        message.innerHTML = '<i class="fas fa-check"></i> Copied to clipboard!';
        document.body.appendChild(message);
        
        // Remove the message after animation
        setTimeout(() => {
            message.remove();
        }, 2500);
    }

    // Function to copy text to clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showCopySuccess();
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    generateBtn.addEventListener('click', () => {
        const text = qrText.value.trim();
        if (!text) return;

        // Clear previous QR code
        qrCode.innerHTML = '';
        
        // Generate new QR code
        qrInstance = new QRCode(qrCode, {
            text: text,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Show buttons after a small delay to ensure QR code is generated
        setTimeout(() => {
            const qrImage = qrCode.querySelector('img');
            if (qrImage) {
                downloadLink.href = qrImage.src;
                downloadLink.style.display = 'block';
                
                // Show and setup copy button
                const copyBtn = document.getElementById('copy-text-btn');
                copyBtn.style.display = 'inline-flex';
                copyBtn.onclick = () => copyToClipboard(text);
            }
        }, 100);
        
        // Save to history if auto-save is enabled
        if (document.getElementById('auto-save').checked) {
            saveToHistory('generated', text);
        }
    });

    // QR Code Scanner
    function initScanner() {
        const scanResult = document.getElementById('scan-result');
        
        if (window.scanner) {
            window.scanner.start();
            return;
        }

        window.scanner = new Html5Qrcode("scanner-video");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
        };

        window.scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                // On successful scan
                scanResult.innerHTML = `<p>Scanned QR Code: <strong>${decodedText}</strong></p>`;
            },
            (errorMessage) => {
                // Ignore errors
            }
        );
    }
});