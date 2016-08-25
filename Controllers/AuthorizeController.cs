using Microsoft.AspNetCore.Mvc;
using System.Text.Encodings.Web;

namespace fb_messenger_bot_tt_emergencyservices.Controllers
{
    public class AuthorizeController : Controller
    {
        /*
        * This path is used for account linking. The account linking call-to-action
        * (sendAccountLinking) is pointed to this URL. 
        * 
        */
        public ViewResult Index()
        {
            // Authorization Code should be generated per user by the developer. This will 
            // be passed to the Account Linking callback.
            var authCode = "1234567890";

            ViewBag.AccountLinkingToken = Request.Query["account_linking_token"];
            ViewBag.RedirectURI = Request.Query["redirect_uri"];
            // Redirect users to this URI on successful login
            ViewBag.RedirectURISuccess = ViewBag.RedirectURI + "&authorization_code=" + authCode;
            
            return View();
        }
    }
}
