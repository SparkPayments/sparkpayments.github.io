function download() {
    let user = document.getElementById("username").value.toLowerCase();

    let data = {
        metadata: {
            displayName: user,
            profilePicture: document.getElementById("profile").value
        },
        dash: document.getElementById("address").value
    };
    let fileName = `${user}.json`;

    // Create a blob of the data
    var fileToSave = new Blob([JSON.stringify(data, undefined, 2)], {
        type: 'application/json'
    });

    // Save the file
    saveAs(fileToSave, fileName);
    console.log(data);

    //clear form data
    document.getElementById("username").value = "";
    document.getElementById("profile").value = "";
    document.getElementById("address").value = "";
}