<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/students';
$_SERVER['SERVER_NAME'] = 'localhost';
$_SERVER['SERVER_PORT'] = '8001';
$_SERVER['HTTP_HOST'] = 'localhost:8001';
$_SERVER['HTTP_ACCEPT'] = 'application/json';

require __DIR__ . '/public/index.php';
