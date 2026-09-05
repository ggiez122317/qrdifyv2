# httpSMS provider

This implementation is integrated into `main` from `httpsms_integration` in
`C:\dev\work\system2\qrdifyv2`. The separate `qrdifyv2-sms-lab` worktree stays on
`sms_load_testing` for Huawei modem and simulator experiments.

Set these credentials in the primary backend's ignored `.env`:

```dotenv
HTTPSMS_API_KEY=
HTTPSMS_FROM_NUMBER=
HTTPSMS_CONNECT_TIMEOUT=3
HTTPSMS_TIMEOUT=10
```

The sender is the phone number of the Android device connected to the httpSMS account,
in international `+country-code` format. Install and configure the httpSMS Android app
on that phone and keep it online with an active SIM capable of sending SMS.

Official API documentation: https://docs.httpsms.com/

Leave `SMS_PROVIDER` unset in the primary `.env` to use the default `httpsms` on
both `main` and `httpsms_integration`. Huawei support remains available through
an explicit `SMS_PROVIDER=huawei_router` override with the router credentials set.
The separate modem lab remains independent of this merge. An explicit environment
override takes precedence over the default in the checked-out code.
Never commit the real API key or phone numbers.

To switch, stop the backend and queue worker, switch branches in `qrdifyv2`, run
`php artisan config:clear` from `backend`, then restart those processes. Restart the
frontend too if it is running. Branch switching does not change `.env`, the database,
or previously stored delivery records.

Start XAMPP MySQL and then one worker:

```powershell
php artisan queue:work --queue=sms --tries=3 --timeout=80 --verbose
```

Use the Admin test-SMS action with one controlled recipient first. New attendance SMS
and Admin tests use the selected provider. Some existing UI labels still refer to the
modem; httpSMS uses the Android phone SIM instead of the Huawei router.

`sms_deliveries.status=accepted` means the API accepted the message. Handset delivery
is not verified by this integration. The audit receipt retains the httpSMS message ID
and provider status without copying the response's message body or phone numbers.

Jobs whose recorded provider differs from the active provider are rejected before
sending. Review old failed deliveries explicitly instead of retrying all old jobs
after a switch. The simulator load command belongs to the separate lab branch.

The existing queue retries still apply to gateway exceptions. If an API connection
times out after acceptance, a queue retry may duplicate the message. There are no
automatic HTTP retries inside the adapter and no delivery-receipt webhook in this change.
