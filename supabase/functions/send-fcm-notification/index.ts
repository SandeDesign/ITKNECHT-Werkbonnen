import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
    if (!fcmServerKey) {
      throw new Error("FCM_SERVER_KEY environment variable not set");
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

    const fcmPayload = {
      to: body.fcmToken,
      notification: {
        title: body.notification.title,
        body: body.notification.body,
        icon: body.notification.icon || "/icon-192.png",
        click_action: body.data?.action_url || "/dashboard",
        tag: body.data?.notification_id || `notification-${Date.now()}`
      },
      data: {
        ...body.data,
        timestamp: Date.now().toString()
      },
      priority: "high",
      content_available: true,
      mutable_content: true
    };

    console.log("Sending FCM notification to token:", body.fcmToken.substring(0, 20) + "...");

    const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${fcmServerKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error("FCM API error:", fcmResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: fcmResult.error || "Failed to send FCM notification",
          details: fcmResult
        }),
        {
          status: fcmResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (fcmResult.failure === 1) {
      console.error("FCM delivery failed:", fcmResult.results?.[0]);

      const errorCode = fcmResult.results?.[0]?.error;
      if (errorCode === "NotRegistered" || errorCode === "InvalidRegistration") {
        console.log("Token is invalid, should be deactivated");
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorCode || "FCM delivery failed",
          shouldDeactivateToken: errorCode === "NotRegistered" || errorCode === "InvalidRegistration"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("FCM notification sent successfully:", fcmResult.results?.[0]?.message_id);

    const response: FCMResponse = {
      success: true,
      messageId: fcmResult.results?.[0]?.message_id
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
