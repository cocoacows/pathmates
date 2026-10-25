import java.io.File;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import javax.swing.JOptionPane;

import org.json.JSONArray;
import org.json.JSONObject;

import com.sun.net.httpserver.HttpServer;

public class WebServer
{
	static HashMap<String, User> users = new HashMap<>();
	static String metaAPIKey = "";
	static String openAIAPIKey = "";
	public static void main(String[] args) throws IOException
	{
		HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 8080), 0);
		server.setExecutor(Executors.newFixedThreadPool(10));
		
		server.start();
		server.createContext("/", new FileHandler(new File("websiteFiles/html/index.html")));
		server.createContext("/api/submitSurvey", new APIHandler()
		{
			
			public JSONObject handleAPICall(JSONObject JSON)
			{

				User newUser = new User();
				newUser.name = getStringOrDefault(JSON, "name", null);
				newUser.cancerType = getStringOrDefault(JSON, "cancer-type", null);
				newUser.cancerStage = getStringOrDefault(JSON, "cancer-stage", null);
				newUser.mindState = getStringOrDefault(JSON, "mind-state", null);
				newUser.age = getIntOrDefault(JSON, "age", 0);
				
				users.put(newUser.name, newUser);
				
				JSONObject ret = new JSONObject();
				
				ret.put("response", 200);
				ret.put("successful", true);
				ret.put("response-text", "Survey submission successful!");
				
				return ret;
			}
			
		});
		server.createContext("/api/transcribe", new APIHandler()
		{
			
			public JSONObject handleAPICall(JSONObject JSON)
			{
				String name = getStringOrDefault(JSON, "name", null);
				String audioBase64 = getStringOrDefault(JSON, "audio", null);

		        // Verify the user exists.
		        if(name == null || !users.containsKey(name))
		            return transcriptionError(404, "User not found.");

		        // Verify audio was included.
		        if(audioBase64 == null || audioBase64.isBlank())
		            return transcriptionError(400, "No audio provided.");

		        try
		        {
		            // Prevent excessively large uploads.
		            if(audioBase64.length() > 36_000_000)
		                return transcriptionError(413, "Audio file too large.");

		            // Support both plain Base64 and data URLs.
		            if(audioBase64.startsWith("data:"))
		                audioBase64 = audioBase64.substring(
		                    audioBase64.indexOf(',') + 1
		                );

		            // Decode the uploaded audio.
		            byte[] audio = Base64.getDecoder().decode(audioBase64);

		            if(audio.length == 0 || audio.length > 25_000_000)
		                return transcriptionError(413, "Invalid audio size.");

		            // Convert audio and send it to Meta.
		            String transcript = transcribeWithMeta(audio, metaAPIKey);

		            JSONObject ret = new JSONObject();

		            ret.put("response", 200);
		            ret.put("successful", true);
		            ret.put("response-text", "Transcription successful!");
		            ret.put("transcript", transcript);

		            return ret;
		        }
		        catch(IllegalArgumentException e)
		        {
		            return transcriptionError(400, e.getMessage());
		        }
		        catch(InterruptedException e)
		        {
		            Thread.currentThread().interrupt();

		            return transcriptionError(503, "Transcription interrupted.");
		        }
		        catch(Exception e)
		        {
		            return transcriptionError(502, "Transcription service failed.");
		        }
			}
			
		});
		server.createContext("/api/transcript", new APIHandler()
		{
			
			public JSONObject handleAPICall(JSONObject JSON)
			{
				String name = getStringOrDefault(JSON, "name", null);
				String transcript = getStringOrDefault(JSON, "transcript", null);

		        // Verify the user exists.
		        if(name == null || !users.containsKey(name))
		            return transcriptionError(404, "User not found.");

		        // Verify audio was included.
		        if(transcript == null || transcript.isBlank())
		            return transcriptionError(400, "No story provided.");

		        try
		        {
		            // Prevent excessively large uploads.
		            if(transcript.length() > 36_000_000)
		                return transcriptionError(413, "Transcript text file too large.");

		            
		            
		            JSONObject ret = new JSONObject();

		            ret.put("response", 200);
		            ret.put("successful", true);
		            ret.put("response-text", "Transcription successful!");
		            ret.put("transcript", transcript);

		            return ret;
		        }
		        catch(IllegalArgumentException e)
		        {
		            return transcriptionError(400, e.getMessage());
		        }
		        catch(Exception e)
		        {
		            return transcriptionError(502, "Transcription service failed.");
		        }
			}
			
		});
		server.createContext("/css", new DirectoryHandler("/css", new File("websiteFiles")));
		server.createContext("/js", new DirectoryHandler("/js", new File("websiteFiles")));
		server.createContext("/favicon.ico", new FileHandler(new File("websiteFiles/favicon.ico")));
	}
	
	protected static String getStringOrDefault(JSONObject JSON, String key, String defaultObject)
	{
		if(JSON.has(key))
			return JSON.getString(key);
		return defaultObject;
	}
	
	protected static Integer getIntOrDefault(JSONObject JSON, String key, int defaultObject)
	{
		if(JSON.has(key))
			return JSON.getInt(key);
		return defaultObject;
	}
	
	protected static JSONObject getJSONOrDefault(JSONObject JSON, String key, JSONObject defaultObject)
	{
		if(JSON.has(key))
			return JSON.getJSONObject(key);
		return defaultObject;
	}
	
	protected static JSONArray getArrayOrDefault(JSONObject JSON, String key, JSONArray defaultObject)
	{
		if(JSON.has(key))
			return JSON.getJSONArray(key);
		return defaultObject;
	}

	public static void showError(String title, String message)
	{
		JOptionPane.showMessageDialog(null, message, title, JOptionPane.ERROR_MESSAGE);
	}
	
	

	private static JSONObject transcriptionError(int code, String message)
	{
	    JSONObject ret = new JSONObject();

	    ret.put("response", code);
	    ret.put("successful", false);
	    ret.put("response-text", message);

	    return ret;
	}

	// Reusable HTTP client.
	private static final HttpClient metaClient = HttpClient.newBuilder()
	    .connectTimeout(Duration.ofSeconds(15))
	    .build();

	private static String transcribeWithMeta(
	    byte[] audio,
	    String apiKey
	) throws IOException, InterruptedException
	{
	    Path input = Files.createTempFile("audio-", ".input");
	    Path wav = Files.createTempFile("audio-", ".wav");

	    try
	    {
	        Files.write(input, audio);

	        // Convert the recording to 16 kHz mono PCM WAV.
	        Process process = new ProcessBuilder(
	            "ffmpeg",
	            "-nostdin",
	            "-hide_banner",
	            "-loglevel", "error",
	            "-y",
	            "-i", input.toString(),
	            "-t", "601",
	            "-vn",
	            "-ac", "1",
	            "-ar", "16000",
	            "-c:a", "pcm_s16le",
	            wav.toString()
	        )
	        .redirectError(ProcessBuilder.Redirect.DISCARD)
	        .start();

	        if(!process.waitFor(120, TimeUnit.SECONDS))
	        {
	            process.destroyForcibly();
	            throw new IOException("Audio conversion timed out.");
	        }

	        if(process.exitValue() != 0 || Files.size(wav) < 44)
	            throw new IllegalArgumentException(
	                "Invalid or unsupported audio recording."
	            );

	        // Limit the converted recording to 10 minutes.
	        long maxSize = 600L * 16000 * 2 + 4096;

	        if(Files.size(wav) > maxSize)
	            throw new IllegalArgumentException(
	                "Audio recording exceeds 10 minutes."
	            );

	        // Build Meta's transcription settings.
	        JSONObject settings = new JSONObject();

	        settings.put("model", "muse-voice-transcribe-1.0");
	        settings.put("audioEncoding", "WAV");
	        settings.put("mode", "PUSH_TO_TALK");

	        String boundary = "----Muse" + UUID.randomUUID();

	        // Multipart request: JSON configuration.
	        String prefix =
	            "--" + boundary + "\r\n" +
	            "Content-Disposition: form-data; name=\"request\"\r\n" +
	            "Content-Type: application/json\r\n\r\n" +
	            settings.toString() + "\r\n" +
	            "--" + boundary + "\r\n" +
	            "Content-Disposition: form-data; name=\"audio\"; " +
	            "filename=\"recording.wav\"\r\n" +
	            "Content-Type: audio/wav\r\n\r\n";

	        String suffix = "\r\n--" + boundary + "--\r\n";

	        // Stream the WAV file into the multipart request.
	        HttpRequest.BodyPublisher body =
	            HttpRequest.BodyPublishers.concat(
	                HttpRequest.BodyPublishers.ofString(prefix),
	                HttpRequest.BodyPublishers.ofFile(wav),
	                HttpRequest.BodyPublishers.ofString(suffix)
	            );

	        HttpRequest request = HttpRequest.newBuilder()
	            .uri(URI.create(
	                "https://api.meta.ai/v1/asr/transcribe"
	            ))
	            .header("Authorization", "Bearer " + apiKey)
	            .header("Accept", "application/json")
	            .header(
	                "Content-Type",
	                "multipart/form-data; boundary=" + boundary
	            )
	            .timeout(Duration.ofMinutes(4))
	            .POST(body)
	            .build();

	        HttpResponse<String> response = metaClient.send(
	            request,
	            HttpResponse.BodyHandlers.ofString()
	        );

	        if(response.statusCode() != 200)
	            throw new IOException(
	                "Meta returned HTTP " + response.statusCode()
	            );

	        JSONObject result = new JSONObject(response.body());

	        return result.getString("transcript");
	    }
	    finally
	    {
	        // Always delete temporary audio files.
	        Files.deleteIfExists(input);
	        Files.deleteIfExists(wav);
	    }
	}
}