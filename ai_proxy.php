<?php


session_set_cookie_params([
    'lifetime' => 0,             // کوکی تا بسته شدن مرورگر معتبر است
    'path' => '/',               // در تمام مسیرهای سایت فعال باشد
    'domain' => '',              // برای دامنه فعلی
    'secure' => true,            // فقط روی HTTPS ارسال شود (چون از Cloudflare Tunnel استفاده می‌کنید، این باید true باشد)
    'httponly' => true,          // جلوگیری از دسترسی جاوااسکریپت به PHPSESSID
    'samesite' => 'None'       // جلوگیری از ارسال کوکی در درخواست‌های Cross-Site (ضد CSRF)
]);


session_start();
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    $_SESSION['csrf_token_time'] = time(); 
}

$allowed_domains = [
    $_SERVER['HTTP_HOST'], 
    'ali-mohammadi-me.github.io' 
];


$referer = $_SERVER['HTTP_REFERER'] ?? '';
$is_allowed = false;

foreach ($allowed_domains as $domain) {
    if (strpos($referer, $domain) !== false) {
        $is_allowed = true;
        break;
    }
}

if (!$is_allowed) {
    http_response_code(403);
    echo json_encode(["error" => "Access denied from this domain."]);
    exit;
}



$log_file = "/var/www/buddy/private/ai_debug.log";
function write_log($msg) {
    global $log_file;
    $timestamp = date("Y-m-d H:i:s");
    file_put_contents($log_file, "[$timestamp] $msg\n", FILE_APPEND);
}

write_log("--- Request Started (Ollama Local) ---");

error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
header_remove("X-Powered-By");


$limit_requests = 6; 
$time_window = 60;
$limit_folder = "/var/www/buddy/private/rate_limits/";

if (!file_exists($limit_folder)) {
    mkdir($limit_folder, 0755, true);
}

$user_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'];
$ip_file = $limit_folder . md5($user_ip) . ".txt";
$now = time();

if (file_exists($ip_file)) {
    $data_limit = json_decode(file_get_contents($ip_file), true);
    $start_time = $data_limit['start_time'];
    $count = $data_limit['count'];

    if (($now - $start_time) < $time_window) {
        if ($count >= $limit_requests) {
            http_response_code(429);
            echo json_encode(["error" => "Too many requests. Please wait a minute."]);
            exit;
        }
        $count++;
    } else {
        $start_time = $now;
        $count = 1;
    }
} else {
    $start_time = $now;
    $count = 1;
}
file_put_contents($ip_file, json_encode(['start_time' => $start_time, 'count' => $count]));

write_log("Rate limit check passed.");


// آدرس API محلی Ollama برای چت
$url = "http://127.0.0.1:11434/api/chat";


$token_expiry = 1800;
$now = time();

if (empty($_SESSION['csrf_token']) || empty($_SESSION['csrf_token_time'])) {
    http_response_code(403);
    echo json_encode(["error" => "Security session expired. Please refresh the page."]);
    exit;
}

// چک کردن انقضا
if (($now - $_SESSION['csrf_token_time']) > $token_expiry) {
    http_response_code(403);
    echo json_encode(["error" => "Security token has expired. Please refresh the page."]);
    exit;
}


$userInput = json_decode(file_get_contents('php://input'), true);
$message = $userInput['message'] ?? '';
$userToken = $userInput['token'] ?? '';


if (empty($userToken) || $userToken !== $_SESSION['csrf_token']) {
    http_response_code(403);
    echo json_encode(["error" => "Invalid or missing security token."]);
    exit;
}

write_log("Security token verified.");


$postData = [
    "model" => "qwen2.5:1.5b", 
    "messages" => [
	["role" => "system", "content" => "You are a helpful assistant named Buddy. REGARDLESS of the language the user speaks, you MUST always respond ONLY in English. If the user speaks Persian, translate it internally and answer in clear, short English."],
        ["role" => "user", "content" => $message]
    ],
    "options" => [
        "temperature" => 0.6,
        "num_predict" => 500, // مشابه max_tokens
    ],
    "stream" => false
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 60); // زمان بیشتر برای پردازش CPU

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    write_log("CURL Error: $curlError");
    echo json_encode(["error" => "Local AI Error: " . $curlError]);
} elseif ($httpCode !== 200) {
    write_log("Ollama HTTP Error: $httpCode | Body: $result");
    echo json_encode(["error" => "Local AI returned HTTP $httpCode"]);
} else {
    // --- تبدیل فرمت پاسخ Ollama به فرمت Groq/OpenAI ---
    $responseJson = json_decode($result, true);
    $aiContent = $responseJson['message']['content'] ?? 'Sorry, I could not generate a response.';

    // ساختار پاسخ را دقیقاً مشابه Groq می‌کنیم تا main.js خطا ندهد
    $formattedResponse = [
        "choices" => [
            [
                "message" => [
                    "role" => "assistant",
                    "content" => $aiContent
                ]
            ]
        ]
    ];
    
    echo json_encode($formattedResponse);
}
?>


