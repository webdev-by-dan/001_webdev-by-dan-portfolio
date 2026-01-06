<?php
// api/subscribe.php
header('Content-Type: application/json; charset=utf-8');

function bad($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  bad('Method not allowed', 405);
}

$email = trim((string)($_POST['email'] ?? ''));
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) bad('Valid email required');

$to = 'YOUR_INBOX@example.com'; // <-- change this
$subj = 'New subscriber';
$body = "New subscriber email: {$email}\n";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$ok = @mail($to, $subj, $body, implode("\r\n", $headers));

if (!$ok) bad('Mail failed', 500);

echo json_encode(['ok' => true]);
