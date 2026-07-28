<?php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

$users = User::all();
$password = Hash::make('password');

echo "Here are the users:\n\n";

foreach ($users as $user) {
    $user->password = $password;
    $user->save();
    
    $role = 'User';
    if (method_exists($user, 'getRoleNames') && count($user->getRoleNames()) > 0) {
        $role = $user->getRoleNames()[0];
    }
    
    echo "Email: " . $user->email . " | Role: " . $role . "\n";
}

echo "\nAll passwords have been successfully reset to: password\n";
