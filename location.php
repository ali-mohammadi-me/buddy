<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// دریافت IP کاربر
$user_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'];


function fetchLocationData($url) {
    $options = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36\r\n",
            "timeout" => 5 // زمان انتظار ۵ ثانیه برای جلوگیری از کند شدن سایت
        ]
    ];
    $context = stream_context_create($options);
    return @file_get_contents($url, false, $context);
}


// --- تلاش اول: ipapi.co ---
$url_primary = "https://ipapi.co/" . $user_ip . "/json/";
$response = fetchLocationData($url_primary);

// بررسی اینکه آیا پاسخ موفقیت‌آمیز بوده یا محدودیت اعمال شده است
// اگر پاسخ FALSE باشد یا کلمه "error" یا "limit" در پاسخ باشد، به سراغ پشتیبان می‌رود
if ($response === FALSE || strpos($response, '"error":true') !== false || strpos($response, 'limit') !== false) {
    
    // --- تلاش دوم (پشتیبان): ip-api.com ---
    $url_fallback = "http://ip-api.com/json/" . $user_ip . "?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query";
    $response = fetchLocationData($url_fallback);
}

if ($response === FALSE) {
    http_response_code(500);
    echo json_encode(["error" => "All API services are currently unavailable."]);
} else {
    echo $response;
}
?>
