<?php
$host = '127.0.0.1';
$port = '5432';
$user = 'postgres';
$pass = 'admin';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Check if database exists
    $stmt = $pdo->query("SELECT 1 FROM pg_database WHERE datname = 'system2'");
    if (!$stmt->fetch()) {
        $pdo->exec("CREATE DATABASE system2");
        echo "Database created successfully\n";
    } else {
        echo "Database already exists\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
