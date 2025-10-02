// Batch QR Code Generation
async function handleBatchGeneration() {
    const batchText = document.getElementById('batch-text').value;
    const items = batchText.split('\n').filter(item => item.trim());
    
    if (items.length === 0) {
        alert('Please enter at least one item');
        return;
    }
    
    const previewList = document.getElementById('batch-preview-list');
    previewList.innerHTML = '';
    
    // Generate QR codes
    const qrCodes = [];
    for (const item of items) {
        const qrContainer = document.createElement('div');
        qrContainer.className = 'qr-preview-item';
        
        const qr = new QRCode(qrContainer, {
            text: item,
            width: 128,
            height: 128,
            colorDark: getGradientColors()[0],
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        qrCodes.push({
            content: item,
            element: qrContainer
        });
        
        previewList.appendChild(qrContainer);
    }
    
    // Enable download button
    const downloadBtn = document.getElementById('download-batch');
    downloadBtn.onclick = () => downloadBatchZip(qrCodes);
}

// Download batch as ZIP
async function downloadBatchZip(qrCodes) {
    const zip = new JSZip();
    
    // Add each QR code to the ZIP
    for (let i = 0; i < qrCodes.length; i++) {
        const qrCode = qrCodes[i];
        const imgData = qrCode.element.querySelector('img').src;
        const base64Data = imgData.replace(/^data:image\/png;base64,/, "");
        
        zip.file(`qrcode-${i + 1}.png`, base64Data, {base64: true});
    }
    
    // Generate and download ZIP
    const content = await zip.generateAsync({type: "blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'qrcodes.zip';
    link.click();
}

// Advanced QR Code Styling
function getGradientColors() {
    const color1 = document.getElementById('gradient-color-1').value;
    const color2 = document.getElementById('gradient-color-2').value;
    const type = document.getElementById('gradient-type').value;
    
    return [color1, color2, type];
}

// Logo Integration
function handleLogoUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const logoPreview = document.getElementById('logo-preview-img');
        logoPreview.src = e.target.result;
        logoPreview.style.display = 'block';
        
        // Store logo data for QR generation
        window.logoData = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Update QR with Logo
function updateQRWithLogo(qrCanvas) {
    if (!window.logoData) return qrCanvas;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const logoSize = document.getElementById('logo-size').value;
    const logoPosition = document.getElementById('logo-position').value;
    
    // Set canvas size
    canvas.width = qrCanvas.width;
    canvas.height = qrCanvas.height;
    
    // Draw QR code
    ctx.drawImage(qrCanvas, 0, 0);
    
    // Draw logo
    const logo = new Image();
    logo.onload = () => {
        const size = (canvas.width * logoSize) / 100;
        let x, y;
        
        switch (logoPosition) {
            case 'center':
                x = (canvas.width - size) / 2;
                y = (canvas.height - size) / 2;
                break;
            case 'top-left':
                x = size / 2;
                y = size / 2;
                break;
            case 'top-right':
                x = canvas.width - size * 1.5;
                y = size / 2;
                break;
            case 'bottom-left':
                x = size / 2;
                y = canvas.height - size * 1.5;
                break;
            case 'bottom-right':
                x = canvas.width - size * 1.5;
                y = canvas.height - size * 1.5;
                break;
        }
        
        ctx.drawImage(logo, x, y, size, size);
    };
    logo.src = window.logoData;
    
    return canvas;
}

// Handle file imports
function handleFileImport(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        let content = e.target.result;
        let items = [];
        
        switch (type) {
            case 'csv':
                items = parseCSV(content);
                break;
            case 'excel':
                items = parseExcel(content);
                break;
            case 'text':
                items = content.split('\n').filter(item => item.trim());
                break;
        }
        
        document.getElementById('batch-text').value = items.join('\n');
        handleBatchGeneration();
    };
    
    if (type === 'excel') {
        reader.readAsBinaryString(file);
    } else {
        reader.readAsText(file);
    }
}

// CSV Parser
function parseCSV(content) {
    return content.split('\n')
        .map(row => row.split(',')[0]) // Take first column
        .filter(item => item.trim());
}

// Excel Parser (requires SheetJS library)
function parseExcel(content) {
    const workbook = XLSX.read(content, {type: 'binary'});
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet, {header: 1})
        .map(row => row[0]) // Take first column
        .filter(item => item && item.trim());
}