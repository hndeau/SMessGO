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

var UN;
let cognitoUser = getCognitoUser();
let summaryList = [];
getCurrentUser()
    .then(username => {
        UN = username;
        userData.Username = username;
        console.log('Username:', username);
        (async () => {
            let response_messages;
            try {
                const users = [document.getElementById('recipient').textContent, document.getElementById('username').textContent].sort();
                response_messages = sortMessages(await getMessages(users[0] + '-' + users[1]));
                formatMessages(response_messages);
                console.log(response_messages);
            } catch (error) {
                console.error('Error:', error.message);
            }
        })();
        (async () => {
            let response;
            try {
                response = decodeConversations(await getConversations());
                displayConversations(response);
                console.log(response);
            } catch (error) {
                console.error('Error:', error.message);
            }
        })();
        addMessageElementListeners();
    })
    .catch(error => {
        console.error('Error getting user:', error);

    });

function getToken(key) {
    const token = localStorage.getItem(key);

    if (token) {
        return token;
    }

    return null;
}

function getCognitoUser() {
    const username = localStorage.getItem('username');

    if (username) {
        const userData = {
            Username: username,
            Pool: userPool,
        };
        return new AmazonCognitoIdentity.CognitoUser(userData);
    }

    return null;
}

async function getCurrentUser() {
    // Set up the parameters for the getUser API call
    const params = {
        AccessToken: getToken('accessToken')
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

function refreshSession() {
    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.error(err);
                return;
            }

            if (session.isValid()) {
                const refreshToken = session.getRefreshToken();

                cognitoUser.refreshSession(refreshToken, (refreshErr, newSession) => {
                    if (refreshErr) {
                        console.error(refreshErr);
                        return;
                    }

                    console.log('Session has been refreshed successfully');
                    // Handle the new session, e.g., update your application state, make API calls, etc.
                });
            } else {
                console.log('Session is not valid');
                // Handle the invalid session, e.g., prompt the user to log in again.
            }
        });
    } else {
        console.log('No user is logged in');
        // Handle the case when no user is logged in, e.g., redirect to the login page.
    }
}


async function getFetch(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'id_token': getToken("idToken"),
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

async function postFetch(url, payload) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'id_token': getToken("idToken"),
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

async function messageinator() {
    let response_messages;
    try {
        const users = [document.getElementById('recipient').textContent, document.getElementById('username').textContent].sort();
        response_messages = sortMessages(await getMessages(users[0] + '-' + users[1]));
        formatMessages(response_messages);
        console.log(response_messages);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function decodeMessage(inputString) {
    const splitIndex = inputString.lastIndexOf('_');
    if (splitIndex === -1) {
        throw new Error('Invalid input format');
    }

    const message = inputString.slice(0, splitIndex);
    const username = inputString.slice(splitIndex + 1);

    return [message, username];
}

function formatMessages(messages) {
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

        timestampDiv.textContent = dateFormatter.format(date);
        timestampDiv.classList.add('timestamp');
        messageDiv.appendChild(timestampDiv);

        const result = decodeMessage(message.message);
        const text = result[0];
        const user = result[1];

        const textDiv = document.createElement('div');
        textDiv.textContent = text;
        textDiv.classList.add('text');
        messageDiv.appendChild(textDiv);

        // Add classes for chat bubble appearance and position
        messageDiv.classList.add('message');
        if (user === UN) {
            messageDiv.classList.add('user');
        } else {
            messageDiv.classList.add('people');
        }

        messagesDiv.appendChild(messageDiv);
    });

    // Move the scrollbar to the bottom
    var messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    addMessageElementListeners();
}

function sortMessages(messageString) {
    const messagesArray = JSON.parse(messageString);

    messagesArray.sort((a, b) => {
        return parseInt(a.timestamp) - parseInt(b.timestamp);
    });

    return messagesArray;
}

function decodeConversations(response) {
    try {
        const parsedResponse = JSON.parse(response);
        return parsedResponse.map(conversation => {
            const messages = conversation.message.split('_');
            const decodedMessages = messages.map(message => {
                const [name, id] = message.split('-');
                return {
                    name: name,
                    id: id
                };
            });

            return {
                messages: decodedMessages,
                conversation_id: conversation.conversation_id,
                timestamp: conversation.timestamp,
            };
        });
    } catch (error) {
        console.error('Failed to decode conversations:', error);
        throw new Error('Failed to decode conversations');
    }
}

function displayConversations(conversations) {
    conversations[0].messages.forEach(message => {
        let otherUser;
        if (message.name === UN) {
            otherUser = message.id;
        } else {
            otherUser = message.name;
        }
        if (otherUser) {
            const listItem = document.createElement('li');
            const div = document.createElement('div');
            div.textContent = `${otherUser}`;
            div.style.cursor = 'pointer';
            div.onclick = () => {
                window.location.href = `/chat?user=${otherUser}`;
            };
            listItem.appendChild(div);
            document.getElementById('conversations').appendChild(listItem);
        }
    });
}

async function getConversations() {
    if (!UN) {
        throw new Error('Missing UN!');
    }

    const url = 'https://58z24w81cl.execute-api.us-east-1.amazonaws.com/prod/getCon/' + UN;
    return await getFetch(url);
}

async function getMessages(conversationId) {
    if (!conversationId) {
        throw new Error('Missing conversation_id');
    }

    const url = 'https://58z24w81cl.execute-api.us-east-1.amazonaws.com/prod/getMessages/' + conversationId;

    return await getFetch(url);
}

async function sendMessage(conversationId, message) {
    if (!conversationId) {
        throw new Error('Missing conversation_id');
    }

    if (!message) {
        throw new Error('Missing message');
    }

    if (!UN) {
        throw new Error('Missing username');
    }

    const payload = {
        conversation_id: conversationId,
        message: message,
        username: UN
    };

    const url = 'https://58z24w81cl.execute-api.us-east-1.amazonaws.com/prod/sendMessage';

    return await postFetch(url, payload);
}


// Add this function to handle the click event on message elements
function messageElementClicked(event) {
    const elementContent = event.target.textContent;
    console.log('Message element content:', elementContent);
    summaryList.push(elementContent);
}

// Add this function to add the click event listener to all message elements
function addMessageElementListeners() {
    const messageElements = document.querySelectorAll('#messages .message');
    for (const element of messageElements) {
        element.addEventListener('click', messageElementClicked);
    }
}

function signOut() {
    // Delete user's cookies
    document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to homepage
    window.location.href = "/";

}
