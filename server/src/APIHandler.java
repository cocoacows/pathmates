import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

public abstract class APIHandler implements HttpHandler {
    private static final int MAX_AUDIO_BYTES = 37_000_000;
    private static final int MAX_TEXT_BYTES = 100_000;
    private static final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    private static class Window {
        volatile long startsAt = System.currentTimeMillis();
        int count = 0;
        synchronized boolean allow(int max, long duration) {
            long now = System.currentTimeMillis();
            if (now - startsAt >= duration) { startsAt = now; count = 0; }
            return ++count <= max;
        }
    }

    private static boolean rateLimited(HttpExchange exchange) {
        String path = exchange.getRequestURI().getPath();
        int max;
        long duration;
        if (path.startsWith("/api/admin/")) { max = 20; duration = 60_000; }
        else if (path.equals("/api/stories/submit")) { max = 50; duration = 3_600_000; }
        else if (path.equals("/api/submitSurvey")) { max = 200; duration = 3_600_000; }
        else return false;
        String key = path + ":" + exchange.getRemoteAddress().getAddress().getHostAddress();
        if (windows.size() > 10_000) windows.entrySet().removeIf(entry -> System.currentTimeMillis() - entry.getValue().startsAt > 3_600_000);
        return !windows.computeIfAbsent(key, ignored -> new Window()).allow(max, duration);
    }

    public void handle(HttpExchange exchange) throws IOException {
        JSONObject response;
        if (!"POST".equals(exchange.getRequestMethod())) {
            response = error(405, "Use POST.");
        } else if (rateLimited(exchange)) {
            response = error(429, "Too many requests. Please try again later.");
        } else {
            try {
                int limit = "/api/transcribe".equals(exchange.getRequestURI().getPath()) ? MAX_AUDIO_BYTES : MAX_TEXT_BYTES;
                byte[] body = exchange.getRequestBody().readNBytes(limit + 1);
                if (body.length > limit) response = error(413, "Request is too large.");
                else response = handleAPICall(new JSONObject(new String(body, StandardCharsets.UTF_8)));
            } catch (Exception e) {
                response = error(400, "Invalid JSON request.");
            }
        }
        byte[] output = response.toString().getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.sendResponseHeaders(response.optInt("response", 500), output.length);
        try (OutputStream out = exchange.getResponseBody()) { out.write(output); }
    }

    public abstract JSONObject handleAPICall(JSONObject json);

    private static JSONObject error(int status, String message) {
        return new JSONObject().put("response", status).put("successful", false).put("response-text", message);
    }
}
