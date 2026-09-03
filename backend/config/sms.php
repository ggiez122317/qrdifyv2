<?php

return [
    'provider' => env('SMS_PROVIDER', 'huawei_router'),
    'queue' => env('SMS_QUEUE', 'sms'),
    'school_name' => env('SMS_SCHOOL_NAME', env('APP_NAME', 'School')),

    'providers' => [
        'huawei_router' => [
            'url' => env('HUAWEI_ROUTER_URL', 'http://192.168.8.1'),
            'username' => env('HUAWEI_ROUTER_USERNAME', 'admin'),
            'password' => env('HUAWEI_ROUTER_PASSWORD'),
            'connect_timeout' => (int) env('HUAWEI_ROUTER_CONNECT_TIMEOUT', 3),
            'timeout' => (int) env('HUAWEI_ROUTER_TIMEOUT', 10),
        ],
    ],
];
