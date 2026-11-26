let currentIp = "";


function getGPUInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return "WebGL not supported";
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return "GPU info blocked/not available";
        
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        
        return vendor + " | " + renderer;
    } catch (e) {
        return "Error detecting GPU: " + e.message;
    }
}



const startTime = new Date().toLocaleString(); 
const startTimeMs = Date.now(); // برای محاسبه تفاضل زمان


function sendSessionDuration() {
    const endTimeMs = Date.now();
    const endTime = new Date().toLocaleString();
    const durationSeconds = Math.floor((endTimeMs - startTimeMs) / 1000);

    
    const report = (
        "SESSION TIME REPORT\n" +
        "IP: " + (currentIp || "Unknown") + "\n" +
        "--------------------------\n" +
        "Start Time: " + startTime + "\n" +
        "End Time: " + endTime + "\n" +
        "Total Duration: " + durationSeconds + " seconds\n" +
        "--------------------------\n"
    );

    // به جای sendToServer معمولی، از fetch با keepalive استفاده می‌کنیم 
    // تا در لحظه بسته شدن صفحه، مرورگر درخواست را لغو نکند.
    fetch('/webhook.php', {
        method: 'POST',
        body: JSON.stringify(report),
        keepalive: true // بسیار حیاتی برای گزارش‌های خروج
    });
}

// اجرای تابع هنگام تغییر وضعیت صفحه یا بسته شدن
window.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        sendSessionDuration();
    }
});



async function getDetailedDeviceInfo() {
    let deviceDetails = {
        platformVersion: "Unknown",
        model: "Unknown"
    };

    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
        try {
            // اضافه کردن 'model' به لیست مقادیر حساس
            const hints = await navigator.userAgentData.getHighEntropyValues([
                'platformVersion', 
                'model'
            ]);
            deviceDetails.platformVersion = hints.platformVersion || "Unknown";
            deviceDetails.model = hints.model || "Unknown";
        } catch (e) {
            console.error("Error fetching high entropy values:", e);
        }
    }
    return deviceDetails;
}



async function startTracking() {
    try {
        // ۱. دریافت آی‌پی از ipify (جایگزین $.getJSON)
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
	currentIp = ipData.ip;

        // نمایش آی‌پی در المان #tc (جایگزین $("#tc").html)
        const tcElement = document.getElementById('tc');
        if (tcElement) {
            tcElement.innerHTML = currentIp;
        }
		
        // ۲. دریافت اطلاعات مکان از location.php (جایگزین $.getJSON)
        const locResponse = await fetch("location.php");
        const locData = await locResponse.json();
	const deviceDetails = await getDetailedDeviceInfo();

        let datetime = new Date();
        let connectionType = "Unknown/Not Supported";
        let effectiveType = "Unknown";

        if (navigator.connection) {
            connectionType = navigator.connection.type || "Unknown";
            effectiveType = navigator.connection.effectiveType || "Unknown";
        }

	const allLangs = navigator.languages ? navigator.languages.join(', ') : "Unknown";
        // فرض بر این است که تابع getGPUInfo در جای دیگری از کد شما تعریف شده است
        const gpu = typeof getGPUInfo === 'function' ? getGPUInfo() : "Unknown";
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "Enabled" : "Disabled";
        const dnt = navigator.doNotTrack === "1" ? "User requests no tracking" : "DNT not enabled";


        let targetinfo = (
            "--- Device Information ---\n" +
            "User Agent: " + navigator.userAgent + "\n" +
            "Platform: " + navigator.platform + "\n" +
	    "Device Model: " + deviceDetails.model + "\n" +
            "OS Version: " + deviceDetails.platformVersion + "\n" +
            "GPU: " + gpu + "\n" +
            "RAM: " + (navigator.deviceMemory || "Unknown") + " GB\n" +
            "CPU Cores: " + navigator.hardwareConcurrency + "\n" +
            "Screen: " + screen.width + "x" + screen.height + " (" + screen.colorDepth + "bit)\n" +
            "Orientation: " + (screen.orientation ? screen.orientation.type : "Unknown") + "\n" +
            "Touch Support: " + ((navigator.maxTouchPoints > 0) ? "Yes" : "No") + "\n" +
            "Dark Mode: " + isDarkMode + "\n" +
            "DNT: " + dnt + "\n" +
            "Local Time: " + datetime.toLocaleTimeString() + "\n" +
            "Browser Language: " + navigator.language + "\n" +
            "All Preferred Languages: " + allLangs + "\n" +
            "Cookies Enabled: " + navigator.cookieEnabled + "\n" +
            "RefUrl: " + document.referrer + "\n" +
            "--------------------------\n"
        );

        var networkReport = (
            "\n--- Network & Location ---\n" +
            "Connection Type: " + connectionType + " (" + effectiveType + ")\n" +
            "IP (ipify): " + currentIp + "\n" +
            "IP (ipapi): " + locData.ip + "\n" +
            "Version: " + locData.version + "\n" +
            "Network: " + locData.network + "\n" +
            "ASN: " + locData.asn + "\n" +
            "Organization: " + locData.org + "\n" +
            "Continent Code: " + locData.continent_code + "\n" +
            "Country: " + locData.country_name + " (" + locData.country_code + ")\n" +
            "ISO3: " + locData.country_code_iso3 + "\n" +
            "Capital: " + locData.country_capital + "\n" +
            "Region: " + locData.region + " (" + locData.region_code + ")\n" +
            "City: " + locData.city + "\n" +
            "Zip/Postal: " + locData.postal + "\n" +
            "Latitude: " + locData.latitude + "\n" +
            "Longitude: " + locData.longitude + "\n" +
            "Timezone: " + locData.timezone + "\n" +
            "UTC Offset: " + locData.utc_offset + "\n" +
            "Currency: " + locData.currency_name + " (" + locData.currency + ")\n" +
            "Languages: " + locData.languages + "\n" +
            "Calling Code: " + locData.country_calling_code + "\n" +
            "In EU: " + locData.in_eu + "\n" +
            "Population: " + locData.country_population + "\n" +
            "--------------------------\n"
        );

        let coreReport = "CORE REPORT (No GPS yet)\n" + targetinfo + networkReport;
        sendToServer(coreReport);


        // وضعیت باتری
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                let batteryReport = (
                    "BATTERY STATUS\n" +
                    "IP: " + currentIp + "\n" +
                    "Level: " + (battery.level * 100) + "%\n" +
                    "Charging: " + (battery.charging ? "Yes" : "No") + "\n" +
                    "--------------------------\n"
                );
                sendToServer(batteryReport);
            } catch (e) {
                sendToServer("BATTERY STATUS\nIP: " + currentIp + "\nStatus: Error fetching battery\n");
            }
        } else {
            sendToServer("BATTERY STATUS\nIP: " + currentIp + "\nStatus: Not supported by browser\n");
        }

        // دریافت مکان (GPS)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    let gpsReport = (
                        "GPS UPDATE\n" +
                        "IP: " + currentIp + "\n" +
                        "--------------------------\n" +
                        "Lat: " + position.coords.latitude + "\n" +
                        "Long: " + position.coords.longitude + "\n" +
                        "Map: https://www.google.com/maps/place/" + position.coords.latitude + "," + position.coords.longitude + "\n" +
                        "--------------------------\n"
                    );
                    sendToServer(gpsReport);
                },
                function(error) {
                    let gpsError = (
                        "GPS STATUS\n" +
                        "IP: " + currentIp + "\n" +
                        "Status: " + error.message + "\n"
                    );
                    sendToServer(gpsError);
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 60000,
		    maximumAge: 0 
                }
            );
        } else {
            sendToServer("GPS STATUS\nIP: " + currentIp + "\nStatus: Not supported\n");
        }

    } catch (error) {
        console.error("Tracking Error:", error);
    }
}


startTracking();



document.addEventListener('click', function() {
    
}, { once: true }); 



function sendToServer(fullData) {
    fetch("/webhook.php", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(fullData)
    }).catch(e => console.error("Send Error:", e));
}

