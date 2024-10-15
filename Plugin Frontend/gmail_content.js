console.log("Content script is running");
console.log("Content script is running on:", window.location.href);




const isGmailHomePage = function(url) {
  const gmailInboxRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash|category\/(social|updates|forums|promotions))\/?[a-zA-Z0-9]*$/;
  return !gmailInboxRegex.test(url);
};


const isGmailMailOpened = function(url) {
  const gmailEmailRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash|category\/(social|updates|forums|promotions))\/[a-zA-Z0-9]+\/?$/;
  return gmailEmailRegex.test(url);
};


const isGmailPage = function(url) {
  return url.includes("https://mail.google.com/mail");
};

const isOutlookPage = function(url) {
  return url.includes("https://outlook.live.com/mail");
};





// Global variables
let searchInterval;
let blockingLayer = null; //Checks whether blocking  layer applied on email or not

chrome.storage.local.get(null, function(data) {
  console.log("Data retrieved from local storage:", data);
});


// When gmail page DOM is loading it will detect and try to fetch email Id
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEmailSearch);
} else {
  initEmailSearch();
}


function initEmailSearch() {
  if (isGmailPage(window.location.href)) {
    console.log("Gmail page detected.");
    searchInterval = setInterval(findAndExtractEmail, 500); // Check every 500ms
    findAndExtractEmail(); // Initial attempt to find the email
  }else {
    console.log("Not a Gmail page.");
  }
}


function findAndExtractEmail() {
  const element = document.querySelector('[aria-label^="Google Account:"]');
  if (element) {
    const fullLabel = element.getAttribute('aria-label');
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const match = fullLabel.match(emailRegex);

    if (match) {
      const email = match[1];
      console.log("Email found:", email);
      clearInterval(searchInterval); // Stop the interval
      // Send the email to the background script
      chrome.runtime.sendMessage({action: 'getEmail', content: email}, (response) => {
        console.log("Email sent to background.");
      });
    } else {
      console.log("Email not yet found in the label. Searching again...");
    }
  } else {
    console.log("Element not yet found. Searching again...");
  }
}



// function isGmailMailOpened(url) {
//   const gmailEmailRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash)\/[a-zA-Z0-9]+\/?$/;
//   return gmailEmailRegex.test(url);
// }

const websitesToRequestGeolocation = [
  "https://mail.google.com/*",
  "https://outlook.live.com/*",
  "https://mail.yahoo.com/*"
];

function shouldRequestGeolocation() {
  const currentUrl = window.location.href;
  const urlRegex = new RegExp(`^(${websitesToRequestGeolocation.join("|")})`);
  console.log("@@@@@@", urlRegex.test(currentUrl));
  return urlRegex.test(currentUrl);
}


if (shouldRequestGeolocation()) {
  navigator.geolocation.getCurrentPosition(
    (loc) => {
    // Handle successful location retrieval
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;

      console.log(latitude," ++++ ",longitude),

    chrome.runtime.sendMessage({
      type : "geoLocationUpdate",
      coordinates : {
        latitude ,
        longitude
      } 
    });
     console.log("send coords to background");
    },
    (err) => {
      console.error("Error getting geolocation:", err);
    }
  )
};



chrome.runtime.onMessage.addListener((message,sender,sendResponse) =>{
  if (message.action == 'fetchDisputeMessageId'){
    console.log("Got message 44444444444444444444444444")
    findAndExtractEmail()
    findMessageIdRecursive(sendResponse);
    // Indicate to Chrome that we will be calling `sendResponse` asynchronously.
    return true;
  } 
})


// Find thread id of alredy opened mail
async function findMessageIdRecursive(sendResponse) {
  const node = document.querySelector('[data-legacy-message-id]');
 
  if (node) {
    const messageId = node.getAttribute('data-legacy-message-id');
    console.log("Thread ID found:", messageId);

    try {
      // Retrieve the "messages" object from chrome.storage.local asynchronously
      const result = await chrome.storage.local.get("messages");
      let messages = result.messages ? JSON.parse(result.messages) : {}; // Ensure messages is an object
      console.log("___________________", messages);

      if (messages[messageId]) {
          console.log("Thread ID status:", messages[messageId]);
          if (messages[messageId] == "Safe") {
            console.log("Local Storage status", messages[messageId]);
            console.log(`Removing blocking layer because message is ${messages[messageId]}`);
            blockingLayer = false;
            applyBlockingLayer(); // Applying Blocking Layer on the mail 
           sendResponse({ status: 'Safe', messageId: messageId });
          } else if (messages[messageId] == "Unsafe") {
            console.log("Local Storage status", messages[messageId]); 
            console.log(`Applying blocking layer because message is ${messages[messageId]}`); 
            sendResponse({ status: 'Unsafe', messageId: messageId });
          }else{
            sendResponse({ status: 'Pending', messageId: messageId });
          }

      } else {
        // If messageId does not exist, set it to "Pending" and store it
        messages[messageId] = "Pending";
        await chrome.storage.local.set({ "messages": JSON.stringify(messages) });
        console.log("Applying blocking layer because message is not Present in Local storage"); 
        sendResponse({ status: 'Pending', messageId: messageId });
      }
    } catch (error) {
      console.error("Error retrieving or setting messages in storage:", error);
      sendResponse({ received: false, error: error.message });
    }

  } else {
    // If attribute not found, wait and then try again recursively
    setTimeout(() => {
      findMessageIdRecursive(sendResponse);
    }, 500); // Adjust the delay as needed
  }
}


async function findMessageId(sendResponse) {
  const messageIdElement = document.querySelector('[data-legacy-message-id]');
  if (messageIdElement) {
    const messageId = messageIdElement.getAttribute('data-legacy-message-id');
    console.log("Thread ID found:", messageId);

    try {
      // Retrieve the "messages" object from chrome.storage.local asynchronously
      const result = await chrome.storage.local.get("messages");
      let messages = result.messages ? JSON.parse(result.messages) : {}; // Ensure messages is an object
      console.log("___________________", messages);

      if (messages[messageId]) {
        console.log("Thread ID status:", messages[messageId]);
        if (messages[messageId] === "Safe") {
          console.log("Local Storage status", messages[messageId]);
          console.log(`Removing blocking layer because message is ${messages[messageId]}`);
          sendResponse({ status: 'Safe', messageId: messageId });
        } else if (messages[messageId] === "Unsafe") {
          console.log("Local Storage status", messages[messageId]); 
          console.log(`Applying blocking layer because message is ${messages[messageId]}`); 
          sendResponse({ status: 'Unsafe', messageId: messageId });
        }
        // sendResponse({ received: true, messageId: messageId });
      } else {
        // If messageId does not exist, set it to "Pending" and store it
        messages[messageId] = "Pending";
        await chrome.storage.local.set({ "messages": JSON.stringify(messages) });
        console.log("Applying blocking layer because message is not Present in Local storage"); 
        // blockingLayer = true;
        // applyBlockingLayer();
        sendResponse({ status: 'Pending', messageId: messageId });
      }
    } catch (error) {
      console.error("Error retrieving or setting messages in storage:", error);
      sendResponse({ received: false, error: error.message });
    }
  } else {
    console.log("data-legacy-message-id not found in the DOM. Searching again...");
    findMessageId(sendResponse);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "mailAlreadyOpened") {
    chrome.storage.local.get('registration', (data) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    if (data.registration) {
        try {
            console.log("Performing action as requested by background.");
            blockingLayer = true;
            applyBlockingLayer();
            findMessageIdRecursive(sendResponse);
            // applyBlockingLayer(); // Applying Blocking Layer on the mail 
        } catch (error) {
            console.error('Error:', error);
        }
    }
    });

  } else if (message.action === "urlChanged") {
    chrome.storage.local.get('registration', (data) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      if (data.registration) {
        try {
          findAndExtractEmail()
          const currentUrl = window.location.href;
          console.log("Current URL:", currentUrl);
          console.log("New URL matches current URL:", message.newUrl === currentUrl);
          console.log("New URL is a Gmail URL:", isGmailMailOpened(window.location.href));
          console.log("New URL:", message.newUrl);
          console.log("Old URL:", message.oldUrl);

          if(isGmailHomePage(message.newUrl) &&  !isGmailPage(message.oldUrl)){
            console.log("Removing bloacking layer from here 11111111111111")
            blockingLayer = false;
            applyBlockingLayer();

          }else if (message.newUrl === currentUrl && isGmailMailOpened(window.location.href) && !isGmailMailOpened(message.oldUrl)) {
            console.log("Opening mail from inbox, sent, etc.");
            blockingLayer = true;
            applyBlockingLayer();
          
            findMessageIdRecursive(sendResponse);
            // applyBlockingLayer(); // Applying Blocking Layer on the mail 
          } else if (message.newUrl === currentUrl && isGmailMailOpened(window.location.href) && isGmailMailOpened(message.oldUrl)) {
            console.log("This mail is from an internal click");
            blockingLayer = true;
            applyBlockingLayer(); // Applying Blocking Layer on the mail 
            setTimeout(() => {
              findMessageId((result) => {
                console.log("Thread ID:", result.messageId);
                sendResponse(result);
              });
            }, 500);
          } else if (message.newUrl === currentUrl && isGmailHomePage(window.location.href) && !isGmailMailOpened(message.oldUrl)) {
            console.log("Search mail");
            blockingLayer = true;
            applyBlockingLayer();
            // applyBlockingLayer(); // Applying Blocking Layer on the mail 
            findMessageIdRecursive(sendResponse);
          } else {
            console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm else condition")
            blockingLayer = false;
            applyBlockingLayer();
          }
          return true; // Indicate that the response is asynchronous
        } catch (error) {
          console.error('Error:', error);
        }
      }
    });
    return true; // Indicate that the response is asynchronous
  }
});



// Function to detect search urls
// function isGmailHomePage(url) {
//   const regex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#search\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/;
//   return regex.test(url);
// }



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
   if (request.action == 'blockUrls') {
     console.log('>>>>Content script received message to block URLs');
     const messId = request.content;
     console.log("get MessID:: ",messId);
     console.log('???????????????????',request.status);

    if(request.status === 'Unsafe' ||  request.status == 'Pending'){

          if(request.status == 'Unsafe'){
            console.log("&&&&&&&&&&&&&&&&&&&&&&&");
            alert('This mail is unsafe');
            // sendResponse({ message: 'URL blocking activated' });
          }else if(request.status === "Pending"){
            alert('Status is pending');
            console.log("status is pending ");
          }
          sendResponse({ message: 'URL blocking activated' });
    }
  }else if(request.action == 'Unblock'){
    console.log( "mail is safe");
    // alert("Not a phishing mail! dispute if you don't  feel the same");
    alert("Not a phishing mail!");
    blockingLayer = false;
    applyBlockingLayer();

   
  }
});

// Outlook Express Blocker Code ------------------------------------------------

let outurl = window.location.href;

// function isOutlookPage(url) {
//   // Updated regex to match a broader range of Outlook URLs, including Office 365
//   const outlookRegex = /^https:\/\/(?:outlook\.office\.com|outlook\.live\.com|office\.live\.com|outlook\.office365\.com)\/mail\//;
//   return outlookRegex.test(url);
// }


function findEmailId() {
  const searchInterval = setInterval(() => {
    const anchorTags = document.querySelectorAll('a');
    for (let i = 0; i < anchorTags.length; i++) {
      const anchor = anchorTags[i];
      if (anchor.getAttribute('aria-label') === 'Go to Outlook') {
        const href = anchor.getAttribute('href');
        const emailId = getEmailIdFromHref(href);
        if (emailId) {
          console.log('Email ID found:', emailId);
          clearInterval(searchInterval); // Stop searching once email ID is found
          return;
        }
      }
    }
    console.log('Email ID not found. Searching again...');
  }, 1000); // Run the search every 1 second (adjust interval as needed)
}

function getEmailIdFromHref(href) {
  const regex = /login_hint=([^&]+)/;
  const match = href.match(regex);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
}


function applyBlockingLayer() {
  
  
  if(isGmailPage(window.location.href)){
    // Adjust this selector to target the email content area specifically
    const targetElement = document.getElementById(':1'); // This selector is specific to Gmail email content
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!",isGmailPage(window.location.href))
    if (targetElement) {
        if (blockingLayer && isGmailMailOpened(window.location.href)) {
            // Layer already exists
          targetElement.style.pointerEvents = 'none';
          console.log('Interaction blocked by setting pointer-events: none;');
          // return;
        }else{
          // Reset pointer-events to its default value
          targetElement.style.pointerEvents = 'auto';
          console.log('Interaction unblocked by resetting pointer-events.');
          // return;
        }
      // Set pointer-events to none to block interactions
      
    } 
    // else {
    //   setTimeout(() => {
    //     console.error('Target element not found. Trying again...');
    //     applyBlockingLayer();
    //   }, 500); // Adjust the delay as needed
    // }
  }else{
    targetElement.style.pointerEvents = 'auto';
    console.log('Interaction unblocked by resetting pointer-events.');
  }
}



















  


  

