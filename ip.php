<?php

// اولویت اول: آی‌پی واقعی کاربر در محیط کلودفلر
if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
    $ipaddress = $_SERVER['HTTP_CF_CONNECTING_IP'];
} 
// اولویت دوم: برای محیط‌های دیگر
elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
    $ipaddress = trim($ips[0]);
} 
elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
    $ipaddress = $_SERVER['HTTP_CLIENT_IP'];
} 
else {
    $ipaddress = $_SERVER['REMOTE_ADDR'];
}

$browser = $_SERVER['HTTP_USER_AGENT'];

$log = "\n--- New Visitor ---\n";
$log .= "IP: " . $ipaddress . "\n";
$log .= "User-Agent: " . $browser . "\n";
$log .= "------------------\n";

$file = '/var/www/buddy/private/ip.txt';

// استفاده از LOCK_EX برای جلوگیری از تداخل در نوشتن همزمان
file_put_contents($file, $log, FILE_APPEND | LOCK_EX);
?>



