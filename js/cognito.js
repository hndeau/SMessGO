// Make sure the AmazonCognitoIdentity namespace is available
if (typeof AmazonCognitoIdentity === 'undefined') {
    console.error('AmazonCognitoIdentity is undefined. Make sure you have included the SDK.');
}
AWS.config.region = 'us-east-1'; // Replace with the region you are using
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:175761ac-5e82-41e0-91ab-0d952714f634', // Replace with your Identity Pool ID
});

const poolData = {
    UserPoolId: 'us-east-1_WusNRaP2h', // Replace with your User Pool ID
    ClientId: '34mgjfocrlfp3c4ij35qoe8d4b', // Replace with your App Client ID
};

let cognitoUser;

function signIn() {
    var authenticationData = {
        Username: document.getElementById('username').value,
        Password: document.getElementById('password').value,
    };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
        authenticationData
    );
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: authenticationData.Username,
        Pool: userPool,
    };
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            // You can store the tokens and the CognitoUser object in your application state.
            // For example, you can use the localStorage for a simple client-side storage solution.

            // Store the tokens and the username in the local storage.
            localStorage.setItem('accessToken', result.getAccessToken().getJwtToken());
            localStorage.setItem('idToken', result.getIdToken().getJwtToken());
            localStorage.setItem('refreshToken', result.getRefreshToken().getToken());
            localStorage.setItem('username', cognitoUser.getUsername());
            localStorage.setItem('cognitoUser', JSON.stringify(cognitoUser));
            // Redirect to /chat
            window.location.href = "/chat";
        },
        onFailure: function (err) {
            console.log(err);
            document.getElementById('error').innerHTML = err.message;
        },
    });
}

function signUp() {
    var userPoolData = {
        UserPoolId: 'us-east-1_WusNRaP2h',
        ClientId: '34mgjfocrlfp3c4ij35qoe8d4b',
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(userPoolData);

    var username = document.getElementById('signup-username').value;
    var password = document.getElementById('signup-password').value;
    var email = document.getElementById('signup-email').value;

    var attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email,
        }),
    ];

    userPool.signUp(username, password, attributeList, null, (err, result) => {
        if (err) {
            console.log(err);
            document.getElementById('error').innerHTML = err.message;
            return;
        }
        cognitoUser = result.user;
        console.log('User signed up:', cognitoUser.getUsername());
        // Redirect to /login
        window.location.href = "/login";
    });

}