import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

public abstract class APIHandler implements HttpHandler {
    private static final int MAX_REQUEST_BYTES = 37_000_000;

    public void handle(HttpExchange exchange) throws IOException {
        JSONObject response;
        if (!"POST".equals(exchange.getRequestMethod())) {
            response = error(405, "Use POST.");
        } else {
            try {
                byte[] body = exchange.getRequestBody().readNBytes(MAX_REQUEST_BYTES + 1);
                if (body.length > MAX_REQUEST_BYTES) response = error(413, "Request is too large.");
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
