const urlInput = document.getElementById("urlInput");
const platformSelect = document.getElementById("platformSelect");
const fgColor = document.getElementById("fgColor");
const bgColor = document.getElementById("bgColor");
const qrCard = document.getElementById("qrCard");
const historyDiv = document.getElementById("history");
const logoUpload = document.getElementById("logoUpload");

let customLogoImg = null; 


const newPlatformOptions = [
    
    { value: "https://drive.google.com/", text: "Google Drive" }
];

newPlatformOptions.forEach(optionData => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    
    if (optionData.value === "https://github.com/") {
        const otherOption = platformSelect.querySelector('option[value="other-option"]');
        if (otherOption) {
            platformSelect.insertBefore(option, otherOption);
        } else {
            platformSelect.appendChild(option);
        }
    } else if (optionData.value === "https://drive.google.com/") {
        const linkedInOption = platformSelect.querySelector('option[value="https://www.linkedin.com/in/"]');
        if (linkedInOption) {
            platformSelect.insertBefore(option, linkedInOption.nextSibling);
        } else {
            platformSelect.appendChild(option);
        }
    }
});

 
platformSelect.addEventListener("change", () => {
    const selectedPlatform = platformSelect.value;
    urlInput.value = ""; 
    urlInput.disabled = false;  

    if (selectedPlatform === "other-option") {
        urlInput.placeholder = "Enter your full URL (e.g., https://example.com)";
    } else if (selectedPlatform) {
        urlInput.placeholder = `Enter your ${platformSelect.options[platformSelect.selectedIndex].text} URL...`;
    } else {
        urlInput.disabled = true;  
        urlInput.placeholder = "Enter your portfolio URL...";
    }
    qrCard.innerHTML = "<p style='color: gray;'>Enter your URL to generate QR code.</p>"; // Prompt user
    urlInput.focus(); 
});
 
urlInput.addEventListener("input", generateQRCode);
fgColor.addEventListener("input", generateQRCode);
bgColor.addEventListener("input", generateQRCode);
 
logoUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            customLogoImg = new Image();
            customLogoImg.src = e.target.result;
            customLogoImg.onload = () => {
                generateQRCode();  
            };
        };
        reader.readAsDataURL(file);
    } else {
        customLogoImg = null;  
        generateQRCode();  
    }
});

/**
 * Simulates a server-side URL verification.
 * In a real application, this would be a fetch request to your backend.
 * @param {string} url The URL to verify.
 * @returns {Promise<boolean>} True if the URL is verified, false otherwise.
 */
async function verifyUrlOnServer(url) {
    qrCard.innerHTML = "<p style='color: gray;'>Verifying URL with server...</p>";
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1-second delay
    return true;  
}


/**
 * Generates the QR code based on current input values.
 */
async function generateQRCode() { // Made async to await server verification
    const url = urlInput.value.trim();
    const selectedPlatform = platformSelect.value;

    // Clear previous QR code and show message if URL is empty or platform not selected
    if (!selectedPlatform) {
        qrCard.innerHTML = "<p style='color: gray;'>Please select a platform first.</p>";
        return;
    }

    if (!url) {
        qrCard.innerHTML = "<p style='color: gray;'>Please enter your URL to generate QR code.</p>";
        return;
    }

    // Basic client-side URL validation (before server check)
    try {
        new URL(url); // Check if it's a valid URL format
    } catch (e) {
        qrCard.innerHTML = "<p style='color: red;'>Please enter a valid URL (e.g., https://example.com).</p>";
        return;
    }

    // Validate URL against the selected platform, unless "Other Option" is selected
    if (selectedPlatform !== "other-option" && !url.startsWith(selectedPlatform)) {
        qrCard.innerHTML = `<p style='color: red;'>URL must start with ${selectedPlatform}</p>`;
        return;
    }

    // Perform server-side verification
    const isVerified = await verifyUrlOnServer(url);

    if (!isVerified) {
        // This block will now effectively never be reached if verifyUrlOnServer always returns true
        qrCard.innerHTML = "<p style='color: red;'>URL could not be verified by the server. Please check the URL.</p>";
        return;
    }

    qrCard.innerHTML = ""; // Clear previous content
    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, url, {
        color: {
            dark: fgColor.value,
            light: bgColor.value
        },
        errorCorrectionLevel: 'H', // High error correction for logo
        width: 256 // Fixed width for QR code
    }, (err) => {
        if (err) {
            console.error(err);
            qrCard.innerHTML = "<p style='color: red;'>Error generating QR code.</p>";
            return;
        }
        const ctx = canvas.getContext("2d");

        /**
         * Embeds the logo onto the QR code canvas.
         * @param {HTMLImageElement} imgToEmbed - The image element to embed.
         */
        const embedLogo = (imgToEmbed) => {
            const logoSize = 64; // Fixed size for the logo
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            // Draw the logo, resizing it to the fixed size
            ctx.drawImage(imgToEmbed, x, y, logoSize, logoSize);
            showQR(canvas, url);
        };

        if (customLogoImg) {
            // Ensure the image is loaded before attempting to draw
            if (customLogoImg.complete) {
                embedLogo(customLogoImg);
            } else {
                customLogoImg.onload = () => embedLogo(customLogoImg);
            }
        } else {
            // If no custom logo, just show the QR
            showQR(canvas, url);
        }
    });
}

/**
 * Displays the generated QR code on the page and saves the URL to history.
 * @param {HTMLCanvasElement} canvas - The canvas element containing the QR code.
 * @param {string} url - The URL encoded in the QR code.
 */
function showQR(canvas, url) {
    qrCard.innerHTML = ""; // Clear previous content
    qrCard.appendChild(canvas); // Append only the canvas
    saveToHistory(url);
}

/**
 * Saves the given URL to local storage history.
 * @param {string} url - The URL to save.
 */
function saveToHistory(url) {
    let history = JSON.parse(localStorage.getItem("qrHistory") || "[]");
    // Add new URL to the beginning, remove duplicates, and limit to 5 entries
    history = [url, ...history.filter(item => item !== url)].slice(0, 5);
    localStorage.setItem("qrHistory", JSON.stringify(history));
    displayHistory();
}

/**
 * Displays the recent URLs from history in the history div.
 */
function displayHistory() {
    historyDiv.innerHTML = "<h3>Recent URLs</h3>";
    const history = JSON.parse(localStorage.getItem("qrHistory") || "[]");
    history.forEach(url => {
        const div = document.createElement("div");
        const urlSpan = document.createElement("span");
        urlSpan.textContent = url;
        // When a history item is clicked, populate the input and regenerate QR
        urlSpan.onclick = () => {
            // Find the correct platform for the clicked URL
            const platformOptions = Array.from(platformSelect.options).map(option => option.value);
            let matchedPlatform = "";
            for (const optionValue of platformOptions) {
                if (url.startsWith(optionValue) && optionValue !== "") {
                    matchedPlatform = optionValue;
                    break;
                }
            }

            if (matchedPlatform) {
                platformSelect.value = matchedPlatform;
            } else {
                // If no specific platform matches, assume it's an "Other" URL
                platformSelect.value = "other-option";
            }
            urlInput.value = url;
            urlInput.disabled = false; // Ensure input is enabled when history item is clicked
            generateQRCode();
        };
        div.appendChild(urlSpan);

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "X";
        removeBtn.classList.add("remove-btn");
        removeBtn.onclick = (event) => {
            event.stopPropagation(); // Prevent div's click from firing
            removeFromHistory(url);
        };
        div.appendChild(removeBtn);
        historyDiv.appendChild(div);
    });
}

/**
 * Removes a URL from the history.
 * @param {string} urlToRemove - The URL to remove.
 */
function removeFromHistory(urlToRemove) {
    let history = JSON.parse(localStorage.getItem("qrHistory") || "[]");
    history = history.filter(item => item !== urlToRemove);
    localStorage.setItem("qrHistory", JSON.stringify(history));
    displayHistory();
}

/**
 * Downloads the generated QR code as a PNG image.
 */
function downloadQR() {
    const qrCanvas = qrCard.querySelector('canvas'); // Get only the canvas element
    if (qrCanvas) {
        const link = document.createElement("a");
        link.download = "qr_code.png"; // Changed filename for clarity
        link.href = qrCanvas.toDataURL("image/png");
        link.click();
    } else {
        console.warn("No QR code to download.");
    }
}
 
function toggleTheme() {
    document.body.classList.toggle("dark-mode");
}
 
displayHistory(); 