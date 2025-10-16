<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SDR Recordings</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #121212;
      color: #f0f0f0;
      margin: 0;
      padding: 20px;
    }
    h1 {
      color: #00ff88;
      text-align: center;
      margin-bottom: 30px;
    }
    .track {
      background: #1e1e1e;
      border-radius: 8px;
      padding: 15px;
      margin: 10px auto;
      max-width: 600px;
      box-shadow: 0 0 10px rgba(0,255,136,0.2);
    }
    .track p {
      margin: 0 0 10px;
      font-weight: bold;
      color: #0ff;
    }
    audio {
      width: 100%;
      outline: none;
    }
  </style>
</head>
<body>
  <h1>📻 SDR MP3 Recordings</h1>
  <?php
    $files = glob("*.mp3");
    if (!$files) {
        echo "<p style='text-align:center;color:#888;'>No recordings found yet.</p>";
    } else {
        foreach ($files as $file) {
            $name = htmlspecialchars(basename($file));
            echo "<div class='track'>";
            echo "<p>$name</p>";
            echo "<audio controls src='$name'></audio>";
            echo "</div>";
        }
    }
  ?>
</body>
</html>
