import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import com.sun.net.httpserver.HttpExchange;

public class FileHandler implements Handler {
    private final File file;
    public FileHandler(File file) { this.file = file; }

    public void handle(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod()) && !"HEAD".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(405, -1);
            return;
        }
        if (!file.isFile()) {
            exchange.sendResponseHeaders(404, -1);
            return;
        }
        String name = file.getName();
        String type = name.endsWith(".css") ? "text/css" : name.endsWith(".js") ? "text/javascript" : name.endsWith(".ico") ? "image/x-icon" : "text/html";
        byte[] content = Files.readAllBytes(file.toPath());
        exchange.getResponseHeaders().set("Content-Type", type + (type.startsWith("text/") ? "; charset=UTF-8" : ""));
        exchange.getResponseHeaders().set("Cache-Control", "no-store");
        exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        exchange.sendResponseHeaders(200, content.length);
        if (!"HEAD".equals(exchange.getRequestMethod())) {
            try (OutputStream out = exchange.getResponseBody()) { out.write(content); }
        }
    }
}
