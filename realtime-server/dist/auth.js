import * as jose from "jose";
import { redis } from "./redis.js";
import { getSupabase } from "./supabase.js";
const TOKEN_SECRET = process.env.REALTIME_TOKEN_SECRET;
export const auth = {
    async verify(token) {
        if (!token?.trim())
            return null;
        const supabase = getSupabase();
        if (!supabase) {
            console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
            return null;
        }
        if (!TOKEN_SECRET) {
            console.error("Missing REALTIME_TOKEN_SECRET");
            return null;
        }
        try {
            const secret = new TextEncoder().encode(TOKEN_SECRET);
            const { payload } = await jose.jwtVerify(token, secret, {
                issuer: "interview-prep-realtime",
                audience: "ws-client",
                maxTokenAge: "60s",
            });
            const userId = (payload.userId ?? payload.sub);
            const sessionId = (payload.sessionId ?? payload.session_id);
            const jti = payload.jti;
            if (!userId || !sessionId)
                return null;
            if (jti && (await redis.isUsed(jti))) {
                return null;
            }
            if (jti) {
                await redis.markUsed(jti);
            }
            const { data, error } = await supabase
                .from("sessions")
                .select("user_id, status")
                .eq("id", sessionId)
                .single();
            if (error || !data || data.user_id !== userId) {
                return null;
            }
            // Only allow connections to active sessions
            if (data.status !== "active") {
                return null;
            }
            return { userId, sessionId };
        }
        catch {
            return null;
        }
    },
};
