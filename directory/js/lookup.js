function lookup() {
    // clear error if there was one
    document.getElementById("error").innerHTML = "";

    // parse identifier into user and domain
    let id = document.getElementById("identity").value.split('@');
    let user = id[0].toLowerCase();
    let domain = id[1].toLowerCase();

    // reach out to domain and ask for user file
    fetch(`https://${domain}/.well-known/${user}.json`)
        .then(response => response.json())
        .then(function (userObject) {
            // match our json object data to our html placeholders
            document.getElementById("profile").src = userObject.metadata.profilePicture;
            document.getElementById("display").innerHTML = userObject.metadata.displayName;
            document.getElementById("address").innerHTML = userObject.dash;

            // create qr code object
            QR_CODE = new QRCode("qrcode", {
                width: 220,
                height: 220,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H,
            });

            // need to clear qr code if there is any previous one

            // generate qr code with address
            QR_CODE.makeCode(userObject.dash);

            // show user card on successful search
            document.getElementById("card").style.display = "flex";
            // hide search bar
            document.getElementById("search").style.display = "none";

            console.log(userObject);
        }).catch(function (error) {
            // if there is an error, display message to user and log actual error to the console
            document.getElementById("error").innerHTML = "invalid user or other error";
            console.log(error);
        })
}