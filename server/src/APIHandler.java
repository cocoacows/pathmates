import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

public abstract class APIHandler implements HttpHandler
{

	public void handle(HttpExchange exchange) throws IOException
	{
		BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
		StringBuilder builder = new StringBuilder();

		String ln = reader.readLine();
		while(ln != null)
		{
			builder.append(ln);
			builder.append("\n");

			ln = reader.readLine();
		}
		
		JSONTokener tokenizer = new JSONTokener(builder.toString());
		JSONObject object = null;
		try
		{
			object = new JSONObject(tokenizer);
		} 
		catch (JSONException e)
		{
			e.printStackTrace();
		}
		
		JSONObject response = handleAPICallWrapper(object);
		String responseString = response.toString();
		exchange.sendResponseHeaders(response.getInt("response"), responseString.getBytes().length);
		
		try (OutputStream os = exchange.getResponseBody()) 
		{
			os.write(responseString.getBytes());
			os.close();
		}
		catch(IOException e)
		{
			e.printStackTrace();
		}
	}
	
	private JSONObject handleAPICallWrapper(JSONObject JSON)
	{
		if(JSON == null)
			return nullResponse();

		try 
		{ 
			return handleAPICall(JSON);
		} 
		catch (JSONException e)
		{ 
			return badResponse();
		}
	}
	
	public abstract JSONObject handleAPICall(JSONObject JSON);
	
	protected JSONObject nullResponse()
	{
		JSONObject response = new JSONObject();
		response.put("response", 400);
		response.put("successful", false);
		response.put("response-text", "Invalid JSON Request");
		return response;
	}
	
	private JSONObject badResponse()
	{
		JSONObject response = new JSONObject();
		response.put("response", 400);
		response.put("successful", false);
		response.put("response-text", "Bad request");
		return response;
	}
}

