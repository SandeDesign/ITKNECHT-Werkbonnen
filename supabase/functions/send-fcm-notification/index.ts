import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FCMRequest {
  fcmToken: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
  };
  data?: Record<string, any>;
}

interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken && tokenExpiryTime > now + 300) {
    console.log("Using cached access token");
    return cachedAccessToken;
  }

  console.log("Generating new access token");

  try {
    const jwtPayload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase.messaging"
    };

    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
    const pkcs8Key = await importPKCS8(privateKey, "RS256");

    const jwt = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(pkcs8Key);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    cachedAccessToken = tokenData.access_token;
    tokenExpiryTime = now + 3600;

    console.log("Access token generated successfully");
    return cachedAccessToken;
  } catch (error) {
    console.error("Error generating access token:", error);
    throw error;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      throw new Error("FCM_SERVICE_ACCOUNT environment variable not set");
    }

    let serviceAccount: ServiceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      throw new Error("Invalid FCM_SERVICE_ACCOUNT JSON format");
    }

    const body: FCMRequest = await req.json();

    if (!body.fcmToken || !body.notification) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: fcmToken and notification"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = await getAccessToken(serviceAccount);

    const v1Payload = {
      message: {
        token: body.fcmToken,
        notification: {
          title: body.notification.title,
          body: body.notification.body,
        },
        data: {
          ...(body.data || {}),
          timestamp: Date.now().toString(),
          click_action: body.data?.action_url || "/dashboard",
          notification_id: body.data?.notification_id || `notification-${Date.now()}`
        },
        webpush: {
          notification: {
            icon: body.notification.icon || "/icon-192.png",
            badge: "/icon-192.png",
            requireInteraction: true,
            tag: body.data?.notification_id || `notification-${Date.now()}`,
          },
          fcm_options: {
            link: body.data?.action_url || "/dashboard"
          }
        },
        android: {
          priority: "high",
          notification: {
            icon: body.notification.icon || "/icon-192.png",
            click_action: body.data?.action_url || "/dashboard",
            tag: body.data?.notification_id || `notification-${Date.now()}`
          }
        },
        apns: {
          payload: {
            aps: {
              "content-available": 1,
              "mutable-content": 1
            }
          }
        }
      }
    };

    console.log("Sending FCM V1 notification to token:", body.fcmToken.substring(0, 20) + "...");

    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(v1Payload),
      }
    );

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error("FCM V1 API error:", fcmResult);

      const errorCode = fcmResult.error?.status;
      const shouldDeactivateToken =
        errorCode === "NOT_FOUND" ||
        errorCode === "UNREGISTERED" ||
        errorCode === "INVALID_ARGUMENT";

      if (shouldDeactivateToken) {
        console.log("Token is invalid or unregistered, should be deactivated");
      }

      if (errorCode === "UNAUTHENTICATED") {
        cachedAccessToken = null;
        tokenExpiryTime = 0;
        console.log("Authentication failed, cleared cached token");
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: fcmResult.error?.message || "Failed to send FCM notification",
          errorCode: errorCode,
          shouldDeactivateToken,
          details: fcmResult
        }),
        {
          status: fcmResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("FCM V1 notification sent successfully:", fcmResult.name);

    const response: FCMResponse = {
      success: true,
      messageId: fcmResult.name
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-fcm-notification function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
