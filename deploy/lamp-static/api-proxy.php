<?php
/**
 * Same-origin API proxy for static LAMP frontends.
 *
 * When the site is on https://www.example.com and Strapi on https://cms.example.com,
 * browsers enforce CORS. You can either:
 *   1) Allow the site origin in Strapi CORS (preferred — see cms/.env FRONTEND_URL), or
 *   2) Proxy /api through this PHP script on the *frontend* host (no browser CORS).
 *
 * Setup:
 *   1. Copy this file into DocumentRoot/_lamp/api-proxy.php (build:static does this).
 *   2. Set STRAPI_ORIGIN below (or Apache SetEnv STRAPI_ORIGIN).
 *   3. Uncomment the RewriteRule in out/.htaccess (or frontend.htaccess).
 *
 * Example request:
 *   GET https://www.example.com/api/pages?locale=en
 *   → proxied to https://cms.example.com/api/pages?locale=en
 */

declare(strict_types=1);

$strapiOrigin = getenv('STRAPI_ORIGIN') ?: 'https://cms.santamar.example';
$strapiOrigin = rtrim($strapiOrigin, '/');

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';
$path = ltrim($path, '/');
// Prevent path traversal / absolute URLs
if ($path === '' || str_contains($path, '..') || preg_match('#^https?://#i', $path)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid path']);
    exit;
}

$query = $_SERVER['QUERY_STRING'] ?? '';
// Drop our internal path= param from the forwarded query
parse_str($query, $params);
unset($params['path']);
$forwardQuery = http_build_query($params);
$target = $strapiOrigin . '/api/' . $path . ($forwardQuery !== '' ? '?' . $forwardQuery : '');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$headers = [];
foreach (['Content-Type', 'Authorization', 'Accept'] as $name) {
    $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    if ($name === 'Content-Type' && isset($_SERVER['CONTENT_TYPE'])) {
        $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
        continue;
    }
    if (!empty($_SERVER[$key])) {
        $headers[] = $name . ': ' . $_SERVER[$key];
    }
}

$body = null;
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $body = file_get_contents('php://input');
}

if (function_exists('curl_init')) {
    $ch = curl_init($target);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_HEADER => true,
    ]);
    if ($body !== null && $body !== false) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($ch);
    if ($raw === false) {
        http_response_code(502);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Upstream request failed', 'detail' => curl_error($ch)]);
        curl_close($ch);
        exit;
    }
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $rawHeaders = substr($raw, 0, $headerSize);
    $rawBody = substr($raw, $headerSize);
    http_response_code($status);

    foreach (explode("\r\n", $rawHeaders) as $line) {
        if (stripos($line, 'Content-Type:') === 0 || stripos($line, 'Content-Length:') === 0) {
            header($line, true);
        }
    }
    echo $rawBody;
    exit;
}

// Fallback without curl
$opts = [
    'http' => [
        'method' => $method,
        'header' => implode("\r\n", $headers),
        'ignore_errors' => true,
        'timeout' => 30,
    ],
];
if ($body !== null && $body !== false) {
    $opts['http']['content'] = $body;
}
$ctx = stream_context_create($opts);
$result = @file_get_contents($target, false, $ctx);
$statusLine = $http_response_header[0] ?? 'HTTP/1.1 502 Bad Gateway';
if (preg_match('/\s(\d{3})\s/', $statusLine, $m)) {
    http_response_code((int) $m[1]);
}
foreach ($http_response_header ?? [] as $line) {
    if (stripos($line, 'Content-Type:') === 0) {
        header($line, true);
    }
}
echo $result === false ? '{"error":"Upstream request failed"}' : $result;
