<?php

return [
    'provider' => env('SMS_PROVIDER', 'httpsms'),
    'queue' => env('SMS_QUEUE', 'sms'),
    'school_name' => env('SMS_SCHOOL_NAME', env('APP_NAME', 'School')),

    'providers' => [
        'httpsms' => [
            'api_key' => env('HTTPSMS_API_KEY'),
            'from_number' => env('HTTPSMS_FROM_NUMBER'),
            'connect_timeout' => (int) env('HTTPSMS_CONNECT_TIMEOUT', 3),
            'timeout' => (int) env('HTTPSMS_TIMEOUT', 10),
        ],
        'huawei_router' => [
            'url' => env('HUAWEI_ROUTER_URL', 'http://192.168.8.1'),
            'username' => env('HUAWEI_ROUTER_USERNAME', 'admin'),
            'password' => env('HUAWEI_ROUTER_PASSWORD'),
            'connect_timeout' => (int) env('HUAWEI_ROUTER_CONNECT_TIMEOUT', 3),
            'timeout' => (int) env('HUAWEI_ROUTER_TIMEOUT', 10),
        ],
    ],
];
