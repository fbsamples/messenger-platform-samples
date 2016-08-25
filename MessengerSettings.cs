public class MessengerSettings
{
    public string ApplicationName { get; set; } = "Trinidad and Tobago Emergency Services Contact";
    // App Secret can be retrieved from the App Dashboard
    public string FBAppSecret { get; set; }
    // Arbitrary value used to validate a webhook
    public string FBValidationToken { get; set; }
    // Generate a page access token for your page from the App Dashboard
    public string FBPageAccessToken { get; set; }
    // URL where the app is running (include protocol). Used to point to scripts and 
    // assets located at this address. 
    public string ServerURL { get; set; }
}