import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.json.JSONObject;
import org.json.JSONArray;

/** Temporary in-memory queue. All access is synchronized because the HTTP server is threaded. */
public class StoryStore {
    private static final Map<String, JSONObject> stories = new LinkedHashMap<>();

    public static synchronized String submit(JSONObject input, User user) {
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
            .put("categories", input.optJSONObject("categories") == null ? new JSONObject() : new JSONObject(input.getJSONObject("categories").toString()))
            .put("status", "pending");
        stories.put(id, story);
        return id;
    }

    public static synchronized JSONArray list(String status) {
        JSONArray result = new JSONArray();
        for (JSONObject story : stories.values()) {
            if (!status.equals(story.getString("status"))) continue;
            JSONObject copy = new JSONObject(story.toString());
            copy.remove("status");
            result.put(copy);
        }
        return result;
    }

    public static synchronized boolean review(String id, String decision) {
        JSONObject story = stories.get(id);
        if (story == null || !"pending".equals(story.getString("status"))) return false;
        story.put("status", decision.equals("approve") ? "approved" : "rejected");
        return true;
    }
}
