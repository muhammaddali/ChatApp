document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem('messageIdCounter') === null) {
        localStorage.setItem('messageIdCounter', '1');
    }

    let signupForm = document.getElementById('sign-up');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const firstName = document.getElementById('fName').value;
            const lastName = document.getElementById('lName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('psw').value;
            const createdAt = new Date().toLocaleString();

            let users = JSON.parse(localStorage.getItem('users')) || [];
            let userId = users.length + 1;
            let name = firstName + " " + lastName;

            let user = {
                name,
                userId,
                createdAt,
                lastLogin: null,
                email,
                password,
                messages: []
            };

            users.push(user);
            localStorage.setItem('users', JSON.stringify(users));

            alert("Successfully Signed Up");
            window.location.href = 'login.html';
        });
    }

    let loginForm = document.getElementById('login');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const loginEmail = document.getElementById('loginEmail').value;
            const loginPsw = document.getElementById('loginPsw').value;

            let users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === loginEmail);

            if (user && user.password === loginPsw) {
                user.lastLogin = new Date().toLocaleString();
                const userIndex = users.findIndex(u => u.email === loginEmail);
                users[userIndex] = user;
                localStorage.setItem('users', JSON.stringify(users));

                let authUser = {
                    name: user.name,
                    userId: user.userId,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin,
                    email: user.email,
                    password: user.password,
                    messages: user.messages || []
                };
                localStorage.setItem('authUser', JSON.stringify(authUser));

                window.location.href = 'welcome.html';
            } else {
                alert("Invalid Email or Password");
            }
        });
    }

    function logOut() {
        localStorage.removeItem('authUser');
        window.location.href = 'login.html';
    }

    let loggingOut = document.getElementById('logout-id');
    if (loggingOut) {
        loggingOut.addEventListener('click', logOut);
    }

    let users = JSON.parse(localStorage.getItem('users')) || [];
    let authUser = JSON.parse(localStorage.getItem('authUser')) || {};
    let userList = document.querySelector('.chat-list');
    let chat = document.querySelector('.chat');
    let chatHistory = document.querySelector('.chat-history');

    //  the user list
    userList.innerHTML = '';
    let excluded = users.filter(excludeUser => excludeUser.userId !== authUser.userId);

    excluded.forEach(user => {
        let initial = user.name.charAt(0).toUpperCase();
        let listItem = `
            <li class="clearfix" data-user-id="${user.userId}">
                <div class="about" style="position: relative;">
                    <div class="avatar">${initial}</div>
                    <div class="name">${user.name}</div>
                    <div class="status">${user.lastLogin}</div>
                </div>
            </li>`;
        userList.innerHTML += listItem;
    });

    let selectedUserId = parseInt(localStorage.getItem('selectedUserId')) || null;

    function renderChatHistory() {
        chatHistory.innerHTML = '';

        if (authUser.messages && authUser.messages.length > 0) {
            let chatWithSelectedUser = authUser.messages.find(chat => chat.id === selectedUserId);
            if (chatWithSelectedUser) {
                chatWithSelectedUser.chatHistory.forEach(message => {
                    addMessage(message.text, message.senderId === authUser.userId, message.time, message.msgId);
                });
            }
        }

        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    userList.querySelectorAll('li').forEach(user => {
        user.addEventListener('click', function () {
            selectedUserId = parseInt(this.getAttribute('data-user-id'));
            localStorage.setItem('selectedUserId', selectedUserId);
            renderChatHistory();
            chat.style.display = 'block';
        });
    });

    if (selectedUserId) {
        renderChatHistory();
        chat.style.display = 'block';
    } else {
        chat.style.display = 'none';
    }

    let sendMessageButton = document.getElementById('sendMessageButton');
    let sendingInput = document.querySelector('.inp-field');

    function sendMsg() {
        let text = sendingInput.value.trim();
        if (text === '' || selectedUserId === null) {
            return;
        }

        let selectedUser = users.find(u => u.userId === selectedUserId);
        let authUser = JSON.parse(localStorage.getItem('authUser'));

        if (selectedUser && authUser) {
            let messageTime = new Date().toLocaleString();

            let messageIdCounter = parseInt(localStorage.getItem('messageIdCounter'));
            let newMessageId = messageIdCounter;
            localStorage.setItem('messageIdCounter', (messageIdCounter + 1).toString());

            let chatHistoryObj = {
                msgId: newMessageId,
                text: text,
                senderId: authUser.userId,
                time: messageTime,
                timestamp: Date.now() // Store the current time in milliseconds
            };

            let chatWithSelectedUser = authUser.messages.find(msg => msg.id === selectedUserId);
            if (!chatWithSelectedUser) {
                chatWithSelectedUser = {
                    id: selectedUserId,
                    chatHistory: []
                };
                authUser.messages.push(chatWithSelectedUser);
            }
            chatWithSelectedUser.chatHistory.push(chatHistoryObj);

            let recipientChat = selectedUser.messages.find(msg => msg.id === authUser.userId);
            if (!recipientChat) {
                recipientChat = {
                    id: authUser.userId,
                    chatHistory: []
                };
                selectedUser.messages.push(recipientChat);
            }
            recipientChat.chatHistory.push({
                ...chatHistoryObj
            });

            let updatedUsers = users.map(user => user.userId === selectedUserId ? selectedUser : (user.userId === authUser.userId ? authUser : user));
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            localStorage.setItem('authUser', JSON.stringify(authUser));

            addMessage(text, true, messageTime, newMessageId);

            sendingInput.value = '';
            chatHistory.scrollTop = chatHistory.scrollHeight;
        } else {
            console.error('No selected user or authenticated user found.');
        }
    }

    sendMessageButton.addEventListener('click', sendMsg);

    sendingInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMsg();
        }
    });

    function addMessage(message, isMyMessage, timestamp, msgId) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        if (isMyMessage) {
            messageElement.classList.add('my-message');
            messageElement.innerHTML = `
                <div class="message-content" data-msg-id="${msgId}">
                    <span>${message}</span>
                    <small>${timestamp}</small>
                    <div class="dropdown">
                        <button class="btn dropdown-toggle" type="button" id="dropdownMenuButton${msgId}" data-bs-toggle="dropdown" aria-expanded="false">
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton${msgId}">
                            <li><a class="dropdown-item edit-btn" href="#">Edit</a></li>
                            <li><a class="dropdown-item delete-f-me-btn" href="#">Delete for Me</a></li>
                            <li><a class="dropdown-item delete-btn" href="#">Delete from Everyone</a></li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            messageElement.classList.add('other-message');
            messageElement.innerHTML = `
                <div class="message-content">
                    <span>${message}</span>
                    <small>${timestamp}</small>
                </div>
            `;
        }
        document.querySelector('.chat-history').appendChild(messageElement);
        addMessageEventListeners();
    }


    function addMessageEventListeners() {
        document.querySelectorAll('.message-content').forEach(message => {
            const editBtn = message.querySelector('.edit-btn');
            const deleteForMeBtn = message.querySelector('.delete-f-me-btn')
            const deleteBtn = message.querySelector('.delete-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => editMessage(message));
            }
            if (deleteForMeBtn) {
                deleteForMeBtn.addEventListener('click', () => deleteForMe(message))
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => deleteMessage(message));
            }
        });
    }

    function editMessage(messageElement) {
        let msgId = parseInt(messageElement.getAttribute('data-msg-id'));
        let newText = prompt("Edit your message:", messageElement.querySelector('span').innerText);
        if (newText !== null) {
            let authUser = JSON.parse(localStorage.getItem('authUser'));
            let users = JSON.parse(localStorage.getItem('users')) || [];
            let currentTime = Date.now();
    
          
            let chatWithSelectedUser = authUser.messages.find(chat => chat.id === selectedUserId);
    
            if (chatWithSelectedUser) {
  
                let message = chatWithSelectedUser.chatHistory.find(msg => msg.msgId === msgId);
    
              
                if (message && (currentTime - new Date(message.time).getTime() <= 60000)) {
          
                    message.text = newText;
                    message.time = new Date().toLocaleString();
    
                
                    let authUserInUsersArray = users.find(u => u.userId === authUser.userId);
                    if (authUserInUsersArray) {
                        let authUserChat = authUserInUsersArray.messages.find(chat => chat.id === selectedUserId);
                        if (authUserChat) {
                            let authUserMessage = authUserChat.chatHistory.find(msg => msg.msgId === msgId);
                            if (authUserMessage) {
                                authUserMessage.text = newText;
                                authUserMessage.time = message.time;
                            }
                        }
                    }
    
               
                    let selectedUser = users.find(u => u.userId === selectedUserId);
                    if (selectedUser) {
                        let recipientChat = selectedUser.messages.find(chat => chat.id === authUser.userId);
                        if (recipientChat) {
                            let recipientMessage = recipientChat.chatHistory.find(msg => msg.msgId === msgId);
                            if (recipientMessage) {
                                recipientMessage.text = newText;
                                recipientMessage.time = message.time;
                            }
                        }
                    }
    
                  
                    localStorage.setItem('authUser', JSON.stringify(authUser));
                    localStorage.setItem('users', JSON.stringify(users));
    
                
                    messageElement.querySelector('span').innerText = newText;
                    messageElement.querySelector('small').innerText = message.time;
                } else {
                    alert("You can only edit messages within 1 minute.");
                }
            }
        }
    }
    

    function deleteForMe(messageElement) {
        let msgId = parseInt(messageElement.getAttribute('data-msg-id'));
        let authUser = JSON.parse(localStorage.getItem('authUser'));
    
        if (authUser) {
            let chatWithSelectedUser = authUser.messages.find(chat => chat.id === selectedUserId);
            if (chatWithSelectedUser) {
                // Delete the message from the authenticated user's chat history
                chatWithSelectedUser.chatHistory = chatWithSelectedUser.chatHistory.filter(msg => msg.msgId !== msgId);
    
                // Update the authUser in local storage
                localStorage.setItem('authUser', JSON.stringify(authUser));
    
                // Provide feedback to the user
                addMessage("Message has been deleted for me", true, new Date().toLocaleString());
    
                // Remove the message element from the UI
                messageElement.remove();
            }
        }
    }
    



    function deleteMessage(messageElement) {
        let msgId = parseInt(messageElement.getAttribute('data-msg-id'));
        let authUser = JSON.parse(localStorage.getItem('authUser'));
        let users = JSON.parse(localStorage.getItem('users')) || [];
        let chatWithSelectedUser = authUser.messages.find(chat => chat.id === selectedUserId);
        let currentTime = Date.now();

        if (chatWithSelectedUser) {
            let message = chatWithSelectedUser.chatHistory.find(msg => msg.msgId === msgId);
            if (message && (currentTime - new Date(message.time).getTime() <= 60000)) {
                chatWithSelectedUser.chatHistory = chatWithSelectedUser.chatHistory.filter(msg => msg.msgId !== msgId);

                let selectedUser = users.find(u => u.userId === selectedUserId);
                if (selectedUser) {
                    let recipientChat = selectedUser.messages.find(chat => chat.id === authUser.userId);
                    if (recipientChat) {
                        recipientChat.chatHistory = recipientChat.chatHistory.filter(msg => msg.msgId !== msgId);


                        recipientChat.chatHistory.push({
                            msgId: Date.now(),
                            text: "Message has been deleted",
                            senderId: -1,
                            time: new Date().toLocaleString()
                        });

                        localStorage.setItem('users', JSON.stringify(users));
                    }
                }


                chatWithSelectedUser.chatHistory.push({
                    msgId: Date.now(), // Unique ID for the deletion notice
                    text: "Message has been deleted",
                    senderId: -1, // Special ID for notices
                    time: new Date().toLocaleString()
                });

                localStorage.setItem('authUser', JSON.stringify(authUser));
                messageElement.querySelector('span').innerText = "Message has been deleted";
                messageElement.querySelector('small').innerText = new Date().toLocaleString();
            } else {
                alert("You can only delete messages for everyone within 1 minute.");
            }
        }
    }

    document.getElementById('toggleUserList').addEventListener('click', function() {
        var userList = document.getElementById('plist');
        var chat = document.querySelector('.chat');
        if (userList.classList.contains('show')) {
            userList.classList.remove('show');
            chat.style.marginLeft = '0';
        } else {
            userList.classList.add('show');
            chat.style.marginLeft = '250px'; 
        }
    });

    const userListElement = document.querySelector('.chat-list');
    const chatHistoryElement = document.querySelector('.chat-history');
    const searchInput = document.getElementById('searchUser');

   
    const searchUsers = (searching) => {
        const userItems = userListElement.querySelectorAll('li');
        userItems.forEach(item => {
            const userName = item.textContent.toLowerCase();
            if (userName.includes(searching.toLowerCase())) {
                item.style.display = ''; 
            } else {
                item.style.display = 'none'; 
            }
        });
    };

    
    const openChat = (userId) => {
        const chats = JSON.parse(localStorage.getItem('chats')) || {};
        const chatHistory = chats[userId] || []; 
        
     
        chatHistoryElement.innerHTML = '';
        
        
        chatHistory.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.textContent = message; 
            chatHistoryElement.appendChild(messageElement);
        });
    };

   
    userListElement.addEventListener('click', (event) => {
        const clickedItem = event.target;
        if (clickedItem.tagName === 'LI') {
            const userId = clickedItem.dataset.userId;
            openChat(userId);
        }
    });

   
    searchInput.addEventListener('input', () => {
        searchUsers(searchInput.value);
    });
});