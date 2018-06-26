<html>
<head>
    <title>Choose your preferences</title>
</head>
<body>
<script>
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.com/en_US/messenger.Extensions.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'Messenger'));

    window.extAsyncInit = () => {
        // TODO: How to parse env file from here?
        MessengerExtensions.getSupportedFeatures(function success(result) {
            let features = result.supported_features;
            if (features.includes("context")) {
                MessengerExtensions.getContext('<APP_ID>',
                    function success(thread_context) {
                        // success
                        document.getElementById("psid").value = thread_context.psid;
                    },
                    function error(err) {
                        // error
                        console.log(err);
                    }
                );
            }
        }, function error(err) {
            // error retrieving supported features
            console.log(err);
        });
        document.getElementById('submitButton').addEventListener('click', () => {
            MessengerExtensions.requestCloseBrowser(function success() {
                console.log("Webview closing");
            }, function error(err) {
                console.log(err);
            });
        });
    };

</script>
<form action="/optionspostback" method="get">
    <input type="hidden" name="psid" id="psid">
    <h3>Pillows</h3>
    <input type="radio" name="pillows" value="soft" checked>Soft<br>
    <input type="radio" name="pillows" value="hard">Hard<br>
    <h3>Bed</h3>
    <input type="radio" name="bed" value="single" checked>Single<br>
    <input type="radio" name="bed" value="double">Double<br>
    <input type="radio" name="bed" value="twin">Twin<br>
    <h3>View</h3>
    <input type="radio" name="view" value="sea" checked>Sea<br>
    <input type="radio" name="view" value="street">Street<br>
    <input type="submit" value="Submit" id="submitButton">
</form>
</body>
</html>