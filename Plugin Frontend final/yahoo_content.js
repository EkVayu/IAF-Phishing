let extractionDone = false;

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.checkDiv) {
//       // Check if the div with id 'message-group-view-scroller' exists
//       const emailBodySearch = document.querySelector('div[data-test-id="message-group-view-scroller"]');
//       console.log("emailBodySearch", emailBodySearch);

//       if (emailBodySearch) {
//         console.log("dispute",sendMessageId, sendUserEmail);
//         // Send response back to background.js
//         sendResponse({
//           messageId: sendMessageId,
//           emaiId: sendUserEmail
//         });
        
//       } else {
//         sendResponse(null);
//       }
//     }
//     return true;  // Keeps the message channel open for async sendResponse
// });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "checkYahoomail" || message.action == "fetchDisputeMessageId") {
    // Check if the div with id 'message-group-view-scroller' exists
    const emailBodySearch = document.querySelector('div[data-test-id="message-group-view-scroller"]');
    console.log("emailBodySearch", emailBodySearch);

    if (emailBodySearch) {

      console.log("ehhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiiiiiiii",sendMessageId, sendUserEmail);
      // Send response back to background.js
      sendResponse({
        emailBodyExists: true,
        messageId: sendMessageId,
        emaiId: sendUserEmail
      });
      
    } else {
      sendResponse({ emailBodyExists: false, error:"did't get the messasge Id"});
    }
  }
  return true;  // Keeps the message channel open for async sendResponse
});


// chrome.storage.local.remove("messages", function() {
//   console.log("Messages removed");
// });


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "runScript") {
        console.log("URL contains 'message'. Running script...");
        window.location.reload();
        return;  // Exit early since reload will reset the script
    }
});

var sendMessageId;
var sendUserEmail;
const url = window.location.href;
//MAin function starts here------------------- 
if (url.includes("message") && url.includes("mail.yahoo.com") && !extractionDone) {
    console.log('Extracted URL:');

      chrome.storage.local.get('registration', (data) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      if (data.registration) {
        const {lastMessageId, userEmail} = extractIdsFromNonceScripts();
        console.log("Extracted messageId:", lastMessageId ,"Extracted UserEmail:", userEmail);
        sendMessageId = lastMessageId;
        sendUserEmail = userEmail;
        extractionDone = true;
      }
    }
  );  
}

let currentPointerEvent = true;

function applyPointerEventsNone() {
    const element = document.querySelector('div[data-test-id="focus-group"]');
    if (element) {
        if (currentPointerEvent) {
            console.log("Pointer Event None-----------yahoomail");
            element.style.pointerEvents = 'none';
        } else {
            console.log("Pointer Event All---------yahoomail");
            element.style.pointerEvents = 'all';
        }
    } 
}







// chrome.storage.local.remove("messages", function() {
//     console.log("Messages removed");
// });
 

function extractIdsFromNonceScripts() {
    let messageIds = [];
    let selectedMailboxId = null;
    let userEmail = null;

    const scripts = Array.from(document.querySelectorAll('script[nonce]'));

    scripts.forEach(script => {
        const nonceValue = script.getAttribute('nonce');
        const content = script.textContent || script.innerHTML;

        if (nonceValue === '') {
            const messageIdRegex = /"messageId":"([A-Za-z0-9_-]+)"/g;
            const selectedMailboxRegex = /"selectedMailbox":\{"id":"([A-Za-z0-9_-]+)","email":"([A-Za-z0-9@._-]+)"/;

            let match;
            while ((match = messageIdRegex.exec(content)) !== null) {
                messageIds.push(match[1]);
            }

            const selectedMailboxMatch = selectedMailboxRegex.exec(content);
            if (selectedMailboxMatch) {
                selectedMailboxId = selectedMailboxMatch[1];
                userEmail = selectedMailboxMatch[2];
            }

            // console.log('Extracted message IDs:', messageIds.length ? messageIds : 'None');
            // console.log('Extracted selectedMailbox ID:', selectedMailboxId || 'None');
            // console.log('Extracted selectedMailbox Email:', userEmail || 'None');
        } else {
            console.log('Script nonce:', nonceValue);
        }
    });

    // Construct the URL using the last messageId and selectedMailboxId
    let lastMessageId = messageIds[messageIds.length - 1];

    if (lastMessageId) {    
        console.log("Working on the messageId to check the status-----------");
        // Retrieve the "messages" object from chrome.storage.local
          chrome.storage.local.get("messages", function(result) {
           let messages = JSON.parse(result.messages || '{}'); // Ensure messages is an object
            // console.log("___________________", messages);

          if (messages[lastMessageId]) {
            console.log("Thread ID status:", messages[lastMessageId]);
            if (messages[lastMessageId] === "Safe") {
                console.log("Local Storage status", messages[lastMessageId]);
                currentPointerEvent = false;
                applyPointerEventsNone();
                alert('Safe Environment');
                console.log(`Removing blocking layer because message is ${messages[lastMessageId]}`);
              } else if (messages[lastMessageId] === "Unsafe") {
               console.log("Local Storage status", messages[lastMessageId]);
                console.log(`Applying blocking layer because message is ${messages[lastMessageId]}`);
                currentPointerEvent = true;
                applyPointerEventsNone();
                alert('Unsafe Environment Detected');
                // applyBlockingLayer(); // Applying Blocking Layer on the mail
               }
               else{
                chrome.runtime.sendMessage({ action: "pendingStatusYahoo", sendMessageId, sendUserEmail }, function(response) {
                  console.log("Response from background.js", response);
                });
              }
            }
          else {
            console.log("messageId not found, skipping email extraction");
              // If lastMessageId does not exist, set it to "Pending" and store it
              messages[lastMessageId] = "Pending";
              chrome.storage.local.set({ "messages": JSON.stringify(messages) }, function() {
                chrome.storage.local.get(null, function(data){
                  console.log("Data from local storage:", data);
              })
              console.log("Script Executed===========================");
              const url = `https://apis.mail.yahoo.com/ws/v3/mailboxes/@.id==${selectedMailboxId}/messages/@.id==${lastMessageId}/content/rawplaintext?appId=YMailNovation`;

             console.log('Extracted URL:', url);
            try {
            chrome.runtime.sendMessage({ action: "sendYahooData", lastMessageId, userEmail, url }, function(response) {
            console.log("Response from background.js", response);
            });
            } catch (error) {
            console.error('Error sending email content to background script:', error);
            }
                // console.log("Applying blocking layer because message is not Present in Local storage and execute the script");
                // shouldApplyPointerEvents = true;
                // applyPointerEventsNone();
                // extecutTheScript();                                                        
              });
            }
          });
          
    } 
    else {
       console.log("messageId not found, skipping email extraction");
    }
    
    return { lastMessageId, userEmail };
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.client = 'yahoo'){
      console.log('Background script received message:', message);
        if (message.action == 'blockUrls') {
        currentPointerEvent = true;
        console.log('Blocking URLs, currentPointerEvent set to true');
        // alert('Unsafe Environment Detected');
      } else if (message.action == 'unblock') {
        currentPointerEvent = false;
        console.log('Unblocking URLs, currentPointerEvent set to false');
        // alert('Safe Environment');
      }
    applyPointerEventsNone();
  }
});

console.log("Blocking Script Executed===========================");
applyPointerEventsNone();







