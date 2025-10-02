// Logo Upload and Integration
class LogoUploader {
    constructor() {
        this.setupElements();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupElements() {
        this.logoInput = document.getElementById('logo-input');
        this.logoPreview = document.getElementById('logo-preview-img');
        this.uploadBtn = document.getElementById('upload-logo-btn');
        this.dropZone = document.getElementById('logo-drop-zone');
        this.placeholder = document.getElementById('upload-placeholder');
        this.errorMessage = document.getElementById('logo-error');
        this.sizeSlider = document.getElementById('logo-size');
        this.sizeValue = document.getElementById('size-value');
    }

    setupEventListeners() {
        // Upload button click
        this.uploadBtn.addEventListener('click', () => this.logoInput.click());

        // File input change
        this.logoInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));

        // Size slider change
        this.sizeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            this.sizeValue.textContent = `${value}%`;
            this.updateLogoPreview();
        });
    }

    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('drag-over');
            });
        });

        this.dropZone.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            this.handleFileSelect(file);
        });
    }

    handleFileSelect(file) {
        // Reset error message
        this.hideError();

        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        // Read and preview file
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage(e.target.result);
        };
        reader.onerror = () => {
            this.showError('Error reading file');
        };
        reader.readAsDataURL(file);
    }

    validateFile(file) {
        // Check if file exists
        if (!file) {
            this.showError('Please select a file');
            return false;
        }

        // Check file type
        if (!file.type.match('image.*')) {
            this.showError('Please select an image file');
            return false;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File size should be less than 5MB');
            return false;
        }

        return true;
    }

    previewImage(dataUrl) {
        // Create new image to check dimensions
        const img = new Image();
        img.onload = () => {
            // Check dimensions
            if (img.width < 50 || img.height < 50) {
                this.showError('Image dimensions should be at least 50x50 pixels');
                return;
            }

            // Show preview
            this.logoPreview.src = dataUrl;
            this.logoPreview.style.display = 'block';
            this.placeholder.style.display = 'none';

            // Store logo data
            window.logoData = dataUrl;

            // Trigger QR code update if exists
            this.updateQRCode();
        };
        img.onerror = () => {
            this.showError('Error loading image');
        };
        img.src = dataUrl;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 3000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    updateQRCode() {
        // If QR code exists, update it with the logo
        if (window.qrInstance) {
            // Get current QR text
            const text = document.getElementById('qr-text').value;
            if (text) {
                // Clear and regenerate QR code
                document.getElementById('qr-code').innerHTML = '';
                window.qrInstance = new QRCode(document.getElementById('qr-code'), {
                    text: text,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }
    }
}

// Initialize logo uploader when document is ready
document.addEventListener('DOMContentLoaded', () => {
    new LogoUploader();
});