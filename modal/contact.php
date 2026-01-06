<?php
// api/contact.php
header('Content-Type: application/json; charset=utf-8');

function bad($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  bad('Method not allowed', 405);
}

$name = trim((string)($_POST['name'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$subject = trim((string)($_POST['subject'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

if ($name === '') bad('Name required');
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) bad('Valid email required');
if ($message === '') bad('Message required');

$to = 'YOUR_INBOX@example.com'; // <-- change this
$subj = $subject !== '' ? $subject : 'New contact form message';
$body =
  "Name: {$name}\n" .
  "Email: {$email}\n\n" .
  "Message:\n{$message}\n";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
// Using Reply-To so you can reply directly:
$headers[] = 'Reply-To: ' . $email;

$ok = @mail($to, $subj, $body, implode("\r\n", $headers));

if (!$ok) {
  bad('Mail failed', 500);
}

echo json_encode(['ok' => true]);
