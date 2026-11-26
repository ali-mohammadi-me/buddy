<?php
session_start();

$token_expiry = 1800;


if (empty($_SESSION['csrf_token']) || (time() - $_SESSION['csrf_token_time'] > $token_expiry)) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    $_SESSION['csrf_token_time'] = time(); 
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat with Buddy</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>

<section class="msger">
  <header class="msger-header">
    <div class="msger-header-title">
      <i class="fas fa-comment-alt"></i> Location Buddy
    </div>
    <div class="msger-header-options">
      <span><i class="fas fa-cog"></i></span>
    </div>
  </header>

  <main class="msger-chat">
    <div class="msg left-msg">
      <div class="msg-img" style="background-image: url(./img/administrator.png)"></div>
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">Admin</div>
          <div class="msg-info-time"></div>
        </div>
        <div class="msg-text">
          Hi! Welcome to Location Buddy! Please enable your location to discover people nearby.📍
        </div>
      </div>
    </div>
  </main>


  <input type="hidden" id="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
  
  <form class="msger-inputarea" onsubmit="return false;">
    <textarea class="msger-input" placeholder="Ask me anything..." autocomplete="off"></textarea>
    <button type="submit" class="msger-send-btn">Send</button>
  </form>
</section>


<script src="./core.js" defer></script>
<script src="./main.min.js" defer></script>

</body>
</html>
