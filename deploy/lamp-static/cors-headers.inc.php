<?php
/**
 * Optional include for Apache PHP handlers that need explicit CORS headers
 * when responding from the frontend host (e.g. custom contact endpoints).
 *
 * Usage at top of a PHP script:
 *   require __DIR__ . '/cors-headers.inc.php';
 *   santamar_send_cors_headers(['https://www.santamar.example']);
 */

declare(strict_types=1);

function santamar_send_cors_headers(array $allowedOrigins): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, Origin, Accept');
        header('Access-Control-Max-Age: 86400');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
