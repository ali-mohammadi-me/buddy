<?php

  date_default_timezone_set('Asia/Tehran');
  $raw_data = file_get_contents('php://input');

  if (!empty($raw_data)) {
      // رمزگشایی داده‌های JSON
      $data = json_decode($raw_data, true);

      if (is_array($data)) {
          // اگر داده‌ها آرایه بودند (مثلاً { "ip": "...", "os": "..." })
	  $formatted_data = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      } elseif (is_string($data)) {
          // اگر داده‌ها یک رشته بودند (مانند گزارش‌های متنی شما)
          // در اینجا $data دیگر شامل " " و \n خام نیست و به صورت متن واقعی است
          $formatted_data = $data;
      } else {
          // اگر داده‌ها JSON نبودند، از متن خام استفاده کن
          $formatted_data = $raw_data;
      }

      $log = "\n==========================================\n";
      $log .= "NEW REPORT: " . date('Y-m-d H:i:s') . "\n";
      $log .= "==========================================\n";
      $log .= $formatted_data . "\n";
      $log .= "==========================================\n";

      file_put_contents('/var/www/buddy/private/data.txt', $log, FILE_APPEND | LOCK_EX);
      error_log($log);

      echo "Success";
  } else {
      echo "No data received";
  }
?>

