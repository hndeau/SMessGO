// Make sure the AmazonCognitoIdentity namespace is available
if (typeof AmazonCognitoIdentity === 'undefined') {
    console.error('AmazonCognitoIdentity is undefined. Make sure you have included the SDK.');
}

AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:175761ac-5e82-41e0-91ab-0d952714f634',
});

const poolData = {
    UserPoolId: 'us-east-1_WusNRaP2h',
    ClientId: '34mgjfocrlfp3c4ij35qoe8d4b',
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const userData = {
    Username: UN,
    Pool: userPool
};

var UN = "";
let cognitoUser;
getCurrentUser()
    .then(username => {
        UN = username;
        userData.Username = username;
        console.log('Username:', username);
        (async () => {
            try {
                const users = [document.getElementById('recipient').textContent, document.getElementById('username').textContent].sort();
                response_messages = sortMessagesByTimestamp(await getMessages(users[0] + '-' + users[1]));
                displayMessages(response_messages);
                console.log(response_messages);
            } catch (error) {
                console.error('Error:', error.message);
            }
        })();
    })
    .catch(error => {
        console.error('Error getting user:', error);
    });

function displayMessages(messages, currentUsername) {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = ''; // Clear the existing messages

    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        const timestampDiv = document.createElement('div');
        const date = new Date(parseInt(message.timestamp) * 1000); // Unix timestamp is in seconds, convert it to milliseconds

        // Create a custom date formatter that includes the full month string and omits the year
        const dateFormatter = new Intl.DateTimeFormat(undefined, {
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        });

        const dateString = dateFormatter.format(date);
        timestampDiv.textContent = dateString;
        timestampDiv.classList.add('timestamp');
        messageDiv.appendChild(timestampDiv);

        const textDiv = document.createElement('div');
        textDiv.textContent = message.message;
        textDiv.classList.add('text');
        messageDiv.appendChild(textDiv);

        // Add classes for chat bubble appearance and position
        messageDiv.classList.add('message');
        messageDiv.classList.add('right');

        // if (message.sender === currentUsername) {
        //     messageDiv.classList.add('right');
        // } else {
        //     messageDiv.classList.add('left');
        // }

        messagesDiv.appendChild(messageDiv);
    });

    // Move the scrollbar to the bottom
    var messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sortMessagesByTimestamp(messageString) {
    const messagesArray = JSON.parse(messageString);

    messagesArray.sort((a, b) => {
        return parseInt(a.timestamp) - parseInt(b.timestamp);
    });

    return messagesArray;
}

function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
}

function refreshTokenIfNeeded() {
    getCurrentUser()
        .then(username => {
            UN = username;
            userData.Username = username;
            console.log('Username:', username);
        })
        .catch(error => {
            console.error('Error getting user:', error);
        });

    // Check if the user is logged in
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    if (!cognitoUser) {
        console.log("User not logged in");
        return;
    }

    // Get the access token
    let accessToken = cognitoUser.getSignInUserSession().getAccessToken();

    // Check if the access token has expired
    if (accessToken && accessToken.getExpiration() * 1000 <= Date.now()) {
        // Get the refresh token
        let refreshToken = cognitoUser.getSignInUserSession().getRefreshToken();

        // Refresh the access token
        cognitoUser.refreshSession(refreshToken, (err, session) => {
            if (err) {
                console.log("Error refreshing the token", err);
                return;
            }

            // Update the cookies with the new tokens
            document.cookie = "access_token=" + session.getAccessToken().getJwtToken();
            document.cookie = "id_token=" + session.getIdToken().getJwtToken();
            document.cookie = "refresh_token=" + session.getRefreshToken().getToken();

            console.log("Access token refreshed");
        });
    } else {
        console.log("Access token still valid");
    }
}

async function getCurrentUser() {
    // Get the access token from cookies
    const accessToken = getCookie('access_token');

    // Set up the parameters for the getUser API call
    const params = {
        AccessToken: accessToken
    };

    // Create a new CognitoIdentityServiceProvider object
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

    return new Promise((resolve, reject) => {
        // Call the getUser API with the session token
        cognitoIdentityServiceProvider.getUser(params, (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                // Set the output element's text to the username
                document.getElementById("username").textContent = result.Username;
                resolve(result.Username);
            }
        });
    });
}

async function getMessages(conversationId) {
    if (!conversationId) {
        throw new Error('Missing conversation_id');
    }

    const url = 'https://58z24w81cl.execute-api.us-east-1.amazonaws.com/prod/getMessages/' + conversationId;

    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'id_token': getCookie("id_token"),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return response.text();
    } catch (error) {
        console.error('Failed to get messages:', error);
        throw new Error('Failed to get messages');
    }
}

async function sendMessage(conversationId, message) {
    if (!conversationId) {
        throw new Error('Missing conversation_id');
    }

    if (!message) {
        throw new Error('Missing conversation_id');
    }

    const payload = {
        conversation_id: conversationId,
        message: message
    };

    const url = 'https://58z24w81cl.execute-api.us-east-1.amazonaws.com/prod/sendMessage';

    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'id_token': getCookie("id_token"),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        console.error('Failed to get messages:', error);
        throw new Error('Failed to get messages');
    }
}

function signOut() {
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: UN,
        Pool: userPool,
    };
    cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    // Get the current user from local storage, if available
    const currentUser = cognitoIdentityServiceProvider.getCurrentUser();

    if (currentUser !== null) {
        // If the current user is loaded in memory, sign them out
        currentUser.signOut(() => {
            console.log('User signed out successfully');
        });
    } else {
        console.log('No user is currently loaded in memory');
    }
}