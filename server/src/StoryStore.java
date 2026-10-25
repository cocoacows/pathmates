import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.json.JSONObject;
import org.json.JSONArray;

/** Temporary in-memory queue. All access is synchronized because the HTTP server is threaded. */
public class StoryStore {
    private static final Map<String, JSONObject> stories = new LinkedHashMap<>();
    private static final int MAX_PENDING = 100;
    private static final int MAX_APPROVED = 200;
    private static final long PENDING_AGE_MS = 24L * 60 * 60 * 1000;

    private static int count(String status) {
        int total = 0;
        for (JSONObject story : stories.values())
            if (status.equals(story.getString("status"))) total++;
        return total;
    }

    private static void removeExpiredPending() {
        long now = System.currentTimeMillis();
        stories.entrySet().removeIf(entry -> "pending".equals(entry.getValue().getString("status"))
            && now - entry.getValue().getLong("created-at") > PENDING_AGE_MS);
    }

    public static synchronized String submit(JSONObject input, User user) {
        removeExpiredPending();
        if (count("pending") >= MAX_PENDING)
            throw new IllegalStateException("The story queue is full. Please try later.");
        String title = input.optString("title", "").trim();
        String author = input.optString("author", "").trim();
        String text = input.optString("text", "").trim();
        if (title.isBlank() || title.length() > 120 || author.isBlank() || author.length() > 80 || text.length() < 10 || text.length() > 12000)
            throw new IllegalArgumentException("Add a title, display name, and story (10–12,000 characters).");
        String id = UUID.randomUUID().toString();
        JSONObject story = new JSONObject()
            .put("id", id).put("title", title).put("author", author)
            .put("text", text).put("cancer", user.cancerType == null ? "" : user.cancerType)
            .put("stage", user.cancerStage == null ? "" : user.cancerStage)
            .put("topic", user.mindState == null ? "" : user.mindState)
            .put("open-to-help", input.optBoolean("open-to-help", false))
            .put("categories", user.categoriesFor(text))
            .put("status", "pending").put("created-at", System.currentTimeMillis());
        stories.put(id, story);
        return id;
    }

    public static synchronized JSONArray list(String status) {
        removeExpiredPending();
        JSONArray result = new JSONArray();
        for (JSONObject story : stories.values()) {
            if (!status.equals(story.getString("status"))) continue;
            JSONObject copy = new JSONObject(story.toString());
            copy.remove("status");
            copy.remove("created-at");
            if ("approved".equals(status)) copy.remove("open-to-help");
            result.put(copy);
        }
        return result;
    }

    public static synchronized boolean review(String id, String decision) {
        removeExpiredPending();
        JSONObject story = stories.get(id);
        if (story == null || !"pending".equals(story.getString("status"))) return false;
        if (decision.equals("reject")) stories.remove(id);
        else {
            if (count("approved") >= MAX_APPROVED) {
                String oldestApproved = null;
                for (Map.Entry<String, JSONObject> entry : stories.entrySet()) {
                    if ("approved".equals(entry.getValue().getString("status"))) {
                        oldestApproved = entry.getKey();
                        break;
                    }
                }
                if (oldestApproved != null) stories.remove(oldestApproved);
            }
            story.put("status", "approved");
        }
        return true;
    }
}
