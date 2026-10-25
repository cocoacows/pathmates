import java.util.ArrayList;
import org.json.JSONObject;

public class StoryStoreCapacityTest {
    private static String submit(User user, int n) {
        return StoryStore.submit(new JSONObject()
            .put("title", "Story " + n)
            .put("author", "Test author")
            .put("text", "A fictional story number " + n + " for capacity testing."), user);
    }

    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    public static void main(String[] args) {
        User user = new User();
        ArrayList<String> pending = new ArrayList<>();
        for (int i = 0; i < 100; i++) pending.add(submit(user, i));
        try {
            submit(user, 100);
            throw new AssertionError("Pending queue accepted its 101st story");
        } catch (IllegalStateException expected) { /* Queue is bounded. */ }
        check(StoryStore.review(pending.remove(0), "reject"), "Rejection failed");
        pending.add(submit(user, 100));
        for (String id : pending) check(StoryStore.review(id, "approve"), "Approval failed");
        for (int i = 101; i <= 201; i++) {
            String id = submit(user, i);
            check(StoryStore.review(id, "approve"), "Approval after cap failed");
        }
        check(StoryStore.list("approved").length() == 200, "Approved list did not rotate at capacity");
        System.out.println("StoryStore capacity test passed");
    }
}
