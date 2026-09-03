const crypto = require("crypto");
const http = require("http");

const ROUTER_URL = process.env.HUAWEI_ROUTER_URL || "http://192.168.8.1";
const USERNAME = process.env.HUAWEI_ROUTER_USERNAME || "admin";
const PASSWORD = process.env.HUAWEI_ROUTER_PASSWORD;
const TEST_PHONE = process.argv[2];

if (!PASSWORD) {
  throw new Error("HUAWEI_ROUTER_PASSWORD is not configured.");
}

if (!TEST_PHONE) {
  throw new Error("Pass a test recipient number as the first command argument.");
}


// ======================================================
// XML HELPER
// ======================================================

function xmlValue(xml, tag) {
  const match = xml.match(
    new RegExp(`<${tag}>(.*?)</${tag}>`, "i")
  );

  return match ? match[1] : null;
}


// ======================================================
// NONCE
// ======================================================

function generateNonce() {
  return crypto.randomBytes(32).toString("hex");
}


// ======================================================
// TOKEN HANDLING
// ======================================================

function getTokensFromHeaders(headers) {
  const raw =
    headers.get("__requestverificationtoken") ||
    headers.get("__RequestVerificationToken");

  if (!raw) {
    return [];
  }

  return raw
    .split("#")
    .map((token) => token.trim())
    .filter(Boolean);
}


// ======================================================
// SESSION HANDLING
// ======================================================

function getSessionFromHeaders(headers, fallback) {
  const cookie = headers.get("set-cookie");

  if (!cookie) {
    return fallback;
  }

  const match = cookie.match(/SessionID=([^;]+)/);

  return match ? match[1] : fallback;
}


// ======================================================
// GET INITIAL SESSION + TOKEN
// ======================================================

async function getSessionAndToken() {
  const response = await fetch(
    `${ROUTER_URL}/api/webserver/SesTokInfo`
  );

  const xml = await response.text();

  const session = xmlValue(xml, "SesInfo");
  const token = xmlValue(xml, "TokInfo");

  if (!session || !token) {
    throw new Error(
      `Unable to obtain SesInfo/TokInfo:\n${xml}`
    );
  }

  return {
    session,
    token,
  };
}


// ======================================================
// CHALLENGE LOGIN
// ======================================================

async function challengeLogin(session, token) {
  const firstNonce = generateNonce();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <username>${USERNAME}</username>
  <firstnonce>${firstNonce}</firstnonce>
  <mode>1</mode>
</request>`;

  const response = await fetch(
    `${ROUTER_URL}/api/user/challenge_login`,
    {
      method: "POST",

      headers: {
        Cookie: `SessionID=${session}`,
        "__RequestVerificationToken": token,
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
      },

      body,
    }
  );

  const text = await response.text();

  console.log("\nChallenge response:");
  console.log(text);

  if (!text.includes("<response>")) {
    throw new Error("challenge_login failed.");
  }

  const salt = xmlValue(text, "salt");
  const serverNonce =
    xmlValue(text, "servernonce");

  const iterations =
    Number(xmlValue(text, "iterations"));

  if (!salt || !serverNonce || !iterations) {
    throw new Error(
      "Missing challenge parameters."
    );
  }

  const returnedTokens =
    getTokensFromHeaders(response.headers);

  const newSession =
    getSessionFromHeaders(
      response.headers,
      session
    );

  return {
    firstNonce,
    salt,
    serverNonce,
    iterations,

    session: newSession,

    token:
      returnedTokens[0] || token,

    tokens:
      returnedTokens,
  };
}


// ======================================================
// CALCULATE CLIENT PROOF
// ======================================================

function calculateClientProof({
  password,
  salt,
  iterations,
  firstNonce,
  serverNonce,
}) {

  // 1. PBKDF2-HMAC-SHA256
  const saltedPassword =
    crypto.pbkdf2Sync(
      Buffer.from(password, "utf8"),
      Buffer.from(salt, "hex"),
      iterations,
      32,
      "sha256"
    );


  // 2. Huawei client key
  //
  // KEY  = "Client Key"
  // DATA = saltedPassword

  const clientKey =
    crypto
      .createHmac(
        "sha256",
        Buffer.from(
          "Client Key",
          "utf8"
        )
      )
      .update(saltedPassword)
      .digest();


  // 3. storedKey = SHA256(clientKey)

  const storedKey =
    crypto
      .createHash("sha256")
      .update(clientKey)
      .digest();


  // 4. Authentication message

  const authMessage =
    `${firstNonce},${serverNonce},${serverNonce}`;


  // 5. Huawei signature
  //
  // KEY  = authMessage
  // DATA = storedKey

  const signature =
    crypto
      .createHmac(
        "sha256",
        Buffer.from(
          authMessage,
          "utf8"
        )
      )
      .update(storedKey)
      .digest();


  // 6. XOR clientKey with signature

  const clientProof =
    Buffer.alloc(32);

  for (let i = 0; i < 32; i++) {
    clientProof[i] =
      clientKey[i] ^
      signature[i];
  }


  return clientProof.toString("hex");
}


// ======================================================
// AUTHENTICATION LOGIN
// ======================================================

async function authenticateLogin(challenge) {

  const clientProof =
    calculateClientProof({
      password: PASSWORD,
      salt: challenge.salt,
      iterations:
        challenge.iterations,
      firstNonce:
        challenge.firstNonce,
      serverNonce:
        challenge.serverNonce,
    });


  const body = `<?xml version="1.0" encoding="UTF-8"?>
<request>
  <clientproof>${clientProof}</clientproof>
  <finalnonce>${challenge.serverNonce}</finalnonce>
</request>`;


  const response = await fetch(
    `${ROUTER_URL}/api/user/authentication_login`,
    {
      method: "POST",

      headers: {
        Cookie:
          `SessionID=${challenge.session}`,

        "__RequestVerificationToken":
          challenge.token,

        "X-Requested-With":
          "XMLHttpRequest",

        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
      },

      body,
    }
  );


  const text =
    await response.text();


  console.log(
    "\nAuthentication response:"
  );

  console.log(text);


  if (!text.includes("<response>")) {
    throw new Error(
      "authentication_login failed."
    );
  }


  const returnedTokens =
    getTokensFromHeaders(
      response.headers
    );


  const authenticatedSession =
    getSessionFromHeaders(
      response.headers,
      challenge.session
    );


  console.log(
    "\nTokens returned after authentication:",
    returnedTokens.length
  );


  console.log(
    "SessionID updated:",
    authenticatedSession !== challenge.session
  );


  return {
    session:
      authenticatedSession,

    token:
      returnedTokens[0] ||
      challenge.token,

    tokens:
      returnedTokens,
  };
}


// ======================================================
// CHECK LOGIN STATE
// ======================================================

async function checkLoginState(
  session,
  token
) {

  const response = await fetch(
    `${ROUTER_URL}/api/user/state-login`,
    {
      headers: {
        Cookie:
          `SessionID=${session}`,

        "__RequestVerificationToken":
          token,
      },
    }
  );


  const text =
    await response.text();


  console.log(
    "\nLogin state:"
  );

  console.log(text);


  return text;
}


// ======================================================
// SEND SMS
// ======================================================

function sendSMS(
  session,
  token,
  phoneNumber,
  message
) {

  return new Promise(
    (resolve, reject) => {

      const now = new Date();


      const date =
        `${now.getFullYear()}-` +
        `${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-` +

        `${String(
          now.getDate()
        ).padStart(2, "0")} ` +

        `${String(
          now.getHours()
        ).padStart(2, "0")}:` +

        `${String(
          now.getMinutes()
        ).padStart(2, "0")}:` +

        `${String(
          now.getSeconds()
        ).padStart(2, "0")}`;


      const body =
`<?xml version="1.0" encoding="UTF-8"?>
<request>
  <Index>-1</Index>
  <Phones>
    <Phone>${phoneNumber}</Phone>
  </Phones>
  <Sca></Sca>
  <Content>${message}</Content>
  <Length>${message.length}</Length>
  <Reserved>1</Reserved>
  <Date>${date}</Date>
</request>`;


      const options = {
        hostname: new URL(ROUTER_URL).hostname,

        port: 80,

        path:
          "/api/sms/send-sms",

        method: "POST",

        headers: {
          Cookie:
            `SessionID=${session}`,

          "__RequestVerificationToken":
            token,

          "Content-Type":
            "text/xml; charset=UTF-8",

          "X-Requested-With":
            "XMLHttpRequest",

          "Content-Length":
            Buffer.byteLength(
              body,
              "utf8"
            ),

          Connection:
            "close",
        },
      };


      const request =
        http.request(
          options,
          (response) => {

            let data = "";


            response.on(
              "data",
              (chunk) => {
                data += chunk;
              }
            );


            response.on(
              "end",
              () => {

                console.log(
                  "\nSMS HTTP status:",
                  response.statusCode
                );

                console.log(
                  "\nSMS response:"
                );

                console.log(data);


                if (
                  data.includes(
                    "<response>OK</response>"
                  )
                ) {

                  console.log(
                    "\nSMS sent successfully!"
                  );

                } else {

                  console.log(
                    "\nRouter did not return OK."
                  );
                }


                resolve(data);
              }
            );
          }
        );


      request.on(
        "error",
        (error) => {

          console.error(
            "\nSMS HTTP ERROR:"
          );

          console.error(error);

          reject(error);
        }
      );


      request.write(body);
      request.end();
    }
  );
}


// ======================================================
// MAIN
// ======================================================

async function main() {

  console.log(
    "Getting initial session..."
  );


  const initial =
    await getSessionAndToken();


  console.log(
    "Running challenge login..."
  );


  const challenge =
    await challengeLogin(
      initial.session,
      initial.token
    );


  console.log(
    "Challenge accepted."
  );


  console.log(
    "Calculating client proof..."
  );


  console.log(
    "Authenticating..."
  );


  const authenticated =
    await authenticateLogin(
      challenge
    );


  console.log(
    "Authentication completed."
  );


  console.log(
    "\nFresh tokens after login:",
    authenticated.tokens.length
  );


  console.log(
    "Session available:",
    Boolean(
      authenticated.session
    )
  );


  console.log(
    "SMS token available:",
    Boolean(
      authenticated.token
    )
  );


  // Optional:
  // Check login state before SMS.
  //
  // If we suspect this affects token usage,
  // comment this out temporarily.

  await checkLoginState(
    authenticated.session,
    authenticated.token
  );


  console.log(
    "\nSending test SMS..."
  );


  await sendSMS(
    authenticated.session,
    authenticated.token,

    TEST_PHONE,

    "Hello from Node.js via White Mamba!"
  );
}


// ======================================================
// RUN
// ======================================================

main().catch(
  (error) => {

    console.error(
      "\nERROR:"
    );

    console.error(
      error.message
    );


    if (error.cause) {
      console.error(
        "\nCAUSE:"
      );

      console.error(
        error.cause
      );
    }
  }
);
