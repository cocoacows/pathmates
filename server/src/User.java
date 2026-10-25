
public class User
{
	String sessionToken;
	String name, cancerType, cancerStage, mindState;
	String ageBand;
	int age;
	String story;
	long createdAt = System.currentTimeMillis();
	private String categorizedTranscript;
	private org.json.JSONObject suggestedCategories;

	synchronized void saveCategories(String transcript, org.json.JSONObject categories) {
		categorizedTranscript = transcript.trim();
		suggestedCategories = new org.json.JSONObject(categories.toString());
	}

	synchronized org.json.JSONObject categoriesFor(String text) {
		if (categorizedTranscript != null && categorizedTranscript.equals(text.trim()) && suggestedCategories != null)
			return new org.json.JSONObject(suggestedCategories.toString());
		return new org.json.JSONObject();
	}
	
}
