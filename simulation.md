# Attendance SMS Capacity and Failure Simulation Plan

## Purpose

This plan measures how many attendance SMS messages the Huawei modem and SIM can process, how the Laravel queue behaves during peak student traffic, and what happens when part of the system loses connectivity.

Do not determine the modem's capacity by sending hundreds of real messages immediately. Test the application and queue with a simulated gateway first, then calibrate the real modem gradually with test students and phone numbers owned by the test team. The true limit depends on the modem firmware, cellular signal, SIM plan, mobile operator throttling, and message length; it cannot be safely inferred from the application code alone.

## What the Current Implementation Does

- Attendance is committed before the SMS job is queued.
- The database queue uses the dedicated `sms` queue.
- All modem jobs share one `WithoutOverlapping` lock, so only one SMS is processed at a time even if several workers are running. This is appropriate for protecting one modem.
- A delivery is tried up to three times, with configured backoffs of 10, 30, and 60 seconds.
- Router connection and request timeouts are 3 and 10 seconds.
- Every message currently performs a complete Huawei session and login flow followed by the send request. This adds four HTTP requests per SMS and will affect throughput.
- `sms_deliveries.status = accepted` means the router returned `<response>OK</response>`. It does **not** prove that the parent's handset received the SMS.
- Scan cooldown and request idempotency prevent duplicate attendance events before an SMS job is created.
- The scan endpoint is limited to 300 requests per minute.

## Safety Preconditions

1. Use a test database or a verified backup. Do not run load tests against real attendance records.
2. Create dedicated test students. Set every parent number to a phone controlled by the test team.
3. Record the modem model, firmware, SIM operator, plan, signal strength, and test location with the results.
4. Ask the mobile operator about automated SMS, fair-use limits, and anti-spam rules before real high-volume testing.
5. Keep the SMS message short and ASCII-only during the baseline test so every logical message is likely to use one SMS segment.
6. Run only one SMS worker during modem calibration:

```powershell
php artisan queue:work --queue=sms --tries=3 --timeout=80 --verbose
```

The worker timeout should remain below the database queue's 90-second `retry_after` value.

## Recommended Test Layers

### Layer 1: Automated application tests without a real modem

Keep the existing test coverage for:

- one eligible scan creating one attendance log, one delivery row, and one queued job;
- duplicate scans creating no second log or SMS;
- check-in, check-out, late, and early-dismissal toggles;
- invalid or missing parent phone numbers;
- router acceptance, rejection, timeout, and retry state transitions;
- an already accepted delivery never being sent again.

Add a simulated SMS gateway before large-volume testing. It should support configurable latency, failure percentage, and an ambiguous timeout mode. Suggested environment settings are:

```dotenv
SMS_PROVIDER=simulated
SMS_SIMULATOR_LATENCY_MS=1000
SMS_SIMULATOR_FAILURE_PERCENT=0
SMS_SIMULATOR_AMBIGUOUS_TIMEOUT_PERCENT=0
```

The simulator should use the real queue and `sms_deliveries` table but never contact a mobile network. Use it for batches of 100, 500, and 1,000 eligible scans. This tests queue durability and application throughput without spending SIM credit or triggering carrier controls.

### Layer 2: Real modem smoke test

Use the Admin System Preferences modem-test function first.

1. Send one test SMS to each controlled handset.
2. Confirm the modem returns `OK`, the row becomes `accepted`, and the handset receives the message.
3. Repeat with five messages spaced 10 seconds apart.
4. Record both router acceptance latency and actual handset delivery latency.

Stop here if any message is duplicated, arrives out of order, remains missing, or the router begins returning rate or session errors.

### Layer 3: Real modem ramp test

Use test attendance events and increase load gradually:

| Stage | Messages | Submission pattern | Continue only when |
|---|---:|---|---|
| A | 5 | One every 10 seconds | All are accepted and received |
| B | 10 | One every 5 seconds | No duplicate or failed rows |
| C | 20 | One every 2 seconds | Queue drains and modem remains responsive |
| D | 50 | Match the expected gate-arrival burst | Operator rules allow it and earlier stages pass |

Pause between stages and inspect the modem inbox/outbox, SIM balance, signal, queue depth, failed jobs, and handset receipts. Do not use a single uncontrolled parent number for bulk testing.

### Layer 4: School peak-flow simulation

Calculate the required arrival rate before declaring the system ready:

```text
required SMS/minute = students in peak window / peak window in minutes
effective segments/minute = required SMS/minute × average SMS segments per message
```

Example: 600 eligible students entering in 10 minutes requires 60 logical messages per minute. If the modem accepts only 12 messages per minute, the backlog grows by about 48 messages each minute during that peak.

The measured sustainable drain rate should be at least 1.5 times the expected peak rate. If that is impossible with one modem, use controlled pacing and accept a documented delay, or add an approved multi-modem/provider design.

## Failure and Recovery Matrix

Run every scenario with a small controlled batch first.

| Failure | How to simulate | Expected current behavior | Required verification |
|---|---|---|---|
| Queue worker stopped | Stop `queue:work`, then scan test students | Attendance and `sms_deliveries` are saved; jobs remain queued | Restart worker and confirm every queued delivery is processed once |
| Public internet/WAN lost, local LAN and cellular SMS available | Disconnect WAN without powering off the modem or local network | Local scanning and SMS may continue because the router API is local and SMS does not require ordinary internet access | Confirm API, database, router, and handsets independently |
| Laravel-to-modem LAN lost | Disconnect modem Ethernet/Wi-Fi or use an unreachable test URL | Attendance remains saved; SMS retries and eventually fails | Confirm three attempts, `last_error`, `failed_at`, and a `failed_jobs` row |
| Cellular signal/SIM unavailable | Remove signal in a controlled test or use a test SIM without service | Router may reject or accept while actual handset delivery fails, depending on firmware | Compare router response with modem outbox and handset receipt |
| Browser/scanner-to-Laravel network lost | Disconnect the scanner PC from the application network while scanning | **Current unsafe behavior:** cached students can show “Processing” while the failed POST is ignored; no attendance or SMS is stored | Confirm the missing DB row and treat this as a release blocker for offline operation |
| Database unavailable | Stop only the test database | Scan cannot be committed and no durable SMS job exists | UI must show failure; after recovery, rescan with a new request ID |
| Application/PC power loss | Stop the test server during a queued batch | Committed database jobs should remain; an in-flight send may be ambiguous | Restart database and worker, then check for missing or duplicate SMS |
| Timeout after modem accepted the SMS | Use a fault proxy/simulator that forwards the send but drops the response | Job retries because the application does not know the modem accepted it | Detect duplicate handset messages; this is not prevented by scan deduplication |

After fixing the cause of failed jobs, inspect and retry them deliberately:

```powershell
php artisan queue:failed
php artisan queue:retry all
```

Do not retry until the modem is reachable, or the retry burst can immediately fail again.

## Measurements to Capture

For every run, record:

- submitted scans;
- successful and duplicate scan API responses;
- attendance-log count;
- eligible versus ineligible notifications;
- queued, sending, accepted, and failed delivery counts;
- current and maximum `jobs` table depth;
- `failed_jobs` count;
- accepted messages per minute;
- queue latency from `sms_deliveries.created_at` to `accepted_at`;
- handset delivery latency and missing/duplicate messages;
- HTTP 429 responses from the 300-requests-per-minute scan limit;
- modem errors, signal level, and SIM/operator warnings;
- average number of SMS segments per logical message.

Useful database checks:

```sql
SELECT status, COUNT(*) AS total
FROM sms_deliveries
GROUP BY status;

SELECT COUNT(*) AS queued_jobs
FROM jobs
WHERE queue = 'sms';

SELECT id, user_id, attendance_log_id, event_type, status, attempts,
       TIMESTAMPDIFF(SECOND, created_at, accepted_at) AS acceptance_seconds,
       last_error
FROM sms_deliveries
ORDER BY id DESC
LIMIT 100;

SELECT al.id, al.user_id, al.type, al.scanned_at
FROM attendance_logs al
LEFT JOIN sms_deliveries sd ON sd.attendance_log_id = al.id
WHERE sd.id IS NULL
ORDER BY al.id DESC;
```

The last query includes valid cases where SMS is disabled, a notification toggle is off, the user is not a student, or the parent number is invalid. Classify those cases instead of assuming every missing delivery is a defect.

## Pass Criteria

Set the final capacity target from the school's actual peak-arrival data. A release candidate should satisfy all of these:

- 100% of acknowledged scans have a matching attendance log.
- Every eligible attendance event creates exactly one `sms_deliveries` row.
- Duplicate scans inside the configured cooldown create no additional attendance log or SMS.
- Stable-network smoke and ramp tests have no failed or duplicate handset messages.
- The measured SMS drain rate is at least 1.5 times the expected peak rate, or the expected maximum parent-notification delay is explicitly accepted.
- A stopped worker can restart and drain its backlog without data loss.
- Modem/network failures are visible to the operator and recoverable without direct database editing.
- No test exceeds the SIM operator's automation, rate, or fair-use rules.

## Risks Not Yet Fully Covered

### Critical

1. **Scanner requests are not stored offline.** The scanner uses a cached student directory, shows a processing result immediately, and ignores a failed attendance POST. Add a browser-side durable outbox, reuse the same idempotency key during replay, and show “Recorded” only after the server acknowledges the scan.
2. **A router acceptance response is not a delivery receipt.** The UI and database must label this state as `accepted`, not `delivered`. If supported by the modem, poll sent-message status or delivery reports.
3. **Ambiguous timeouts can duplicate real SMS.** If the modem sends successfully but its response is lost, the job retries. Scan deduplication cannot solve this transport-level ambiguity.
4. **Public scanner endpoints expose too much trust and data.** `/api/scan`, `/api/scan/lookup`, and especially `/api/scan/cache-all` are currently public; the cache includes student identifiers and parent phone numbers. Require kiosk authentication and return only fields the browser needs.
5. **The modem password appears to be non-placeholder configuration in `.env.example`.** Before merge or deployment, rotate the router password, replace the example with a placeholder, and confirm no credential remains in Git history.

### High

6. **One modem and SIM are a single point of failure.** Define an operator alert, spare device/SIM procedure, and maximum acceptable backlog age.
7. **There is no explicit send-rate limiter or circuit breaker.** A recovered worker can release a large backlog directly at the modem. Add configurable pacing, pause after repeated router errors, and alert an operator.
8. **Invalid parent numbers are silently skipped.** Add a visible audit reason such as `skipped_invalid_recipient` so administrators can correct the student record.
9. **One full router login is performed per SMS.** Measure this first; safely reusing a session/token may improve capacity but must respect Huawei token rotation and concurrency rules.
10. **Long or Unicode messages use multiple SMS segments.** Names containing non-GSM characters can reduce characters per segment and increase cost, send time, and throttling risk. Test the longest real template and Unicode student names.

### Operational

11. Run the queue worker under a process supervisor or Windows service so it restarts after a crash or reboot.
12. Monitor queue age, not only queue length. A small old backlog can be more serious than a large fresh one.
13. Synchronize application, database, modem, and test-handset clocks before comparing timestamps.
14. Keep attendance retention, parent phone privacy, access control, and SMS consent requirements in the deployment checklist.

## Recommended Implementation Order Before Full Load Testing

1. Add kiosk authentication and remove parent phone numbers from the public cache payload.
2. Add durable scanner offline retry with visible pending/confirmed/failed states.
3. Add a simulated SMS gateway and a repeatable attendance-load command.
4. Add queue metrics, backlog-age alerts, and an Admin delivery-status screen.
5. Add configurable modem pacing and a circuit breaker.
6. Test ambiguous timeout handling and decide how duplicate-message risk will be managed.
7. Run the real modem ramp test and document the measured safe rate for the exact modem, SIM, operator, signal, and message template.
