console.log('Background script is running.');

const baseUrl = 'http://127.0.0.1:8000/plugin/'

let user_email = null; 
let currentMessageId = null;     //Contains latest message Id which will send to server 
let eml_Download_Url = null;

let latitude = null;
let longitude = null;
let pluginId = null;
let ipAddress = null;
let browserInfo = null;
let operatingSystem = null;

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

// chrome.tabs.query({active : true , currentWindow : true},function(tabs){
  //   handleUrlChange(tabs[0].url, tabs[0].id);
  // });
  
  chrome.storage.local.get(null, function(data) {
    console.log("Data retrieved from local storage:", data);
  });
 
  // chrome.storage.local.remove("registration",()=>{
  //   console.log("registration removed")
  // })

// chrome.storage.local.remove("messages", function() {
//   if (chrome.runtime.lastError) {
//     console.error("Error removing messages:", chrome.runtime .lastError);
//   } else {
//     console.log("messages object cleared from local storage.");
//   }
// });

// chrome.storage.local.set({ registration: true });




function sendMessageToTab(tabId, message, retryCount = 0) {
  chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
          // Retry sending the message if there was an error (e.g., the content script isn't ready)
          if (retryCount < 3) {  // Limit the number of retries to avoid infinite loops
              setTimeout(() => {
                  sendMessageToTab(tabId, message, retryCount + 1);
              }, 1000); // Wait for 1 second before retrying
          } else {
              console.error("Failed to send message after retries", chrome.runtime.lastError);
          }
      } else if (!response.received) {
          // Optionally handle case where no valid response was received
          console.log("No valid response received, handling...");
      } else {
          console.log("Message received by content script");
          if (response.messageId) {
            console.log("Thread ID received:::::::::::::::::::::::", response.messageId);
            const messageId = response.messageId;
            currentMessageId = messageId;
            console.log("download Id ::::::",messageId);
            chrome.tabs.query({active : true , currentWindow : true},function(tabs){
              console.log(":::::::::::::::::::::::::");
              handleUrlChange(tabs[0].url, tabs[0].id,messageId);
              });
          } else {
            console.log("No thread ID received");
          }
        }
      
  });
}

// It will check mail is already opened or not
chrome.webNavigation.onCommitted.addListener(details => {
  if (isGmailMailOpened(details.url)) {
      console.log("Gmail email detected ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      sendMessageToTab(details.tabId, { action: "mailAlreadyOpened" });
  }
});

// Get email Id from content script and stored in local storage
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if(request.action == 'getEmail'){   
    user_email = request.content;
    console.log("got  the email form content script", user_email);
    
    // Get the stored email from local storage
    chrome.storage.local.get(['user_email'],function(results){

      // Check if the email is not already stored or if it is different
      if (!results['user_email'] && results['user_email'] != user_email){

        // Store the new email
        chrome.storage.local.set({'user_email': user_email}, function(){
          console.log("Stored email on local storage");
        });
      }else{
        console.log("Email id is already stored and matches the existing one")
      }
    })  
  }
});

let currentUrls = "";

// Listener for URL changes in any tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url !== currentUrls) {
    const oldUrl = currentUrls;
    const newUrl = changeInfo.url;
    
    // Update currentUrls
    currentUrls = newUrl;

    // Log old and new URLs
    console.log("Old URL:", oldUrl);
    console.log("New URL:", newUrl);

    // Send message to content script
    chrome.tabs.sendMessage(tabId, { action: "urlChanged", oldUrl: oldUrl, newUrl: newUrl }, (response) => {
      console.log("Response sent from content script:", response);
      if (response.status == 'Pending'){
        console.log("got messageid and status --------------------")
        const messageId = response.messageId ;
        chrome.tabs.query({active : true , currentWindow : true},function(tabs){
          console.log(":::::::::::::::::::::::::",messageId);
          currentMessageId = messageId
          handleUrlChange(tabs[0].url, tabs[0].id,messageId);
        });
      }else {
        console.log("No thread ID received");
      }
    });
  }
});


// Check for registration if not registered then called backend for true and false response
function checkRegistration() {
  chrome.storage.local.get('registration', (data) => {
    if (chrome.runtime.lastError || !data.registration) {
      // Registration not found, proceed to call server API
      const extensionId = chrome.runtime.id;
      const url = baseUrl + 'verify-license/';

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ extensionId: extensionId }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Server responded with true, store registration status
            chrome.storage.local.set({ registration: true }, () => {
              if (chrome.runtime.lastError) {
                console.error('Failed to save registration:', chrome.runtime.lastError);
              } else {
                console.log('Registration successful and stored.');
              }
            });
          } else {
            console.log('Registration failed, server did not return success.');
          }
        })
        .catch(error => {
          console.error('API call failed:', error);
        });
    } else {
      console.log('Registration already exists.');
    }
  });
}


// Listener for browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log("On startup is running");
  userDetails(); 
  // uninst()
  checkRegistration();
});
chrome.runtime.onInstalled.addListener(() => {
  console.log("On Installed is running");
  userDetails(); 
  // uninst()
  checkRegistration();
});



// Listener for extension installation and updates
 

// Reloads the current page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'reloadPage') {
      // Query the active tab in the current window
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          var currentTab = tabs[0];
          // Reload the current tab
          chrome.tabs.reload(currentTab.id, function() {
              sendResponse({ success: true });
          });
      });
      return true; // Keeps the message channel open until sendResponse is called
  }
});




// function openNewTabWithContent(content) {
//   const newTab = window.open('', '_blank');
//   if (newTab) {
//       newTab.document.write(content);
//       newTab.document.close(); // To finish the writing process
//   } else {
//       console.error("Failed to open a new tab. Please ensure pop-ups are allowed.");
//   }
// }




chrome.management.onEnabled.addListener(() => {
   // Make the fetch request to the server
      const url = baseUrl + "plugins/enable-disable/enable/"

   fetch(url, {
    method: 'GET',
    headers: {
        "Content-Type": "application/json"
    },
})
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
})
.then(data => {
    console.log('Fetch successful:', data);
})
.catch(error => {
    console.error('There was a problem with the fetch operation:', error);
});
});

// chrome.runtime.setUninstallURL('https://www.flipkart.com/', async () => {
//   console.log('Uninstall URL set.');
//   try{
//   const ipAddress =  await fetchIpAddress()
//   const extensionId =  chrome.runtime.id;
//   const extt = "about";
// const uploadUrl = baseUrl + "plugins/install-uninstall/uninstall/"


//   fetch(uploadUrl, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({ ipAddress: ipAddress,pluginId: extensionId }) // Include body if needed
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok.');
//     }
//     return response.json();
//   })
//   .then(data => {
//     console.log("Fetch successful:", data);
//   })
//   .catch(error => {
//     console.error('There was a problem with the fetch operation:', error);
//   });
// }catch(error){
//   console.error("Error fetching IP address",error)
// }
// });


async function showEmail(messageId) {
  try {
    // Assuming messageId is the filename of the text file
    const filePath = `file:///C:/Users/Dell/OneDrive/Desktop/Plugin/Backend/eml_backup/${messageId}/${messageId}.txt`;

    // Open a new tab with the file path
    chrome.tabs.create({ url: filePath });
  } catch (err) {
    console.error("Caught in showEmail: ", err);
  }
}

  


// _____________________________________________________________extension ___________________________________________________________

async function getExtensionid(){
  return new Promise((resolve) => {
    const extensionId = chrome.runtime.id;
    console.log('Extension ID:', extensionId);
    // userData.push({ type: 'extensionId', value: extensionId });
    pluginId =  extensionId;
    chrome.storage.local.set({ extensionId: extensionId }, () => {
      resolve();
    });
  })
}

getExtensionid();
console.log("*********************",pluginId);

// fetching user Ipv4 address
async function fetchIpAddress(){
  return fetch('https://api64.ipify.org?format=json')
  .then(response => response.json())
  .then(data => {
    console.log('User IP Address:', data.ip);
    // userData.push({type: 'ip',value: data.ip});
    ipAddress = data.ip;
    chrome.storage.local.set({ ipAddress: data.ip }, () => {
      return data.ip;
    });
  })
  .catch(error => {
    console.error("Error fetching IP address.", error);
    throw error;
  })
}

// This functions gets the user Browser details with its version 
function userBrowserInfo(){
  return new Promise((resolve) =>{
    navigator.sayswho= (function(){
      var ua= navigator.userAgent;
      var tem; 
      var M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
      if(/trident/i.test(M[1])){
          tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
          return 'IE '+(tem[1] || '');
      }
      if(M[1]=== 'Chrome'){
          tem= ua.match(/\b(OPR|Edg)\/(\d+)/);
          if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
      }
      M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
      if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
      return M.join(' ');
    })();
    console.log(navigator.sayswho);
    // userData.push({type: 'userAgent', value: navigator.sayswho});
    browserInfo = navigator.sayswho;
    chrome.storage.local.set({ browserInfo: navigator.sayswho }, () => {
      resolve();
    });
  })
}

// This function will gets the Operation system of user
function getPlatformInfo() {
  return new Promise((resolve) =>{
    chrome.runtime.getPlatformInfo(function (platformInfo) {
      console.log('Platform:', platformInfo.os);
      // console.log('Architecture:', platformInfo.arch);
      // userData.push({ type: 'platform', os: platformInfo.os});
      operatingSystem = platformInfo.os;
      chrome.storage.local.set({ operatingSystem: platformInfo.os }, () => {
        resolve();
      });
    });
  });
}

// Received Geolocation from content script and stored in Local storage   
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    if (request.type == 'geoLocationUpdate') {
        console.log("coords  received");
        const coordinates = request.coordinates;  // Access the coordinates object
        lat = coordinates.latitude;   // Extract latitude
        long = coordinates.longitude; // Extract longitude
        chrome.storage.local.set({ 'coordinates': coordinates },()=>{
            console.log("Saved coords to local storage")
            chrome.storage.local.get('coordinates', (result) => {
              console.log("Retrieved coords from local storage", result.coordinates.latitude);
            });
        });
        latitude = lat ;
        longitude = long ;  
        console.log('Received latitude , longitude', latitude , longitude);
    }
});

// Function to fetch and store user details like ip,extension id ,browser details 
async function userDetails(){
  return Promise.all([fetchIpAddress(),userBrowserInfo(),getPlatformInfo(),getExtensionid()])
  .then(() => {
    console.log('User details have been fetched and stored.');
  })
  .catch(error => {
    console.log('Error in userDetails:', error);
  })
};


// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------





// -----------------------------------------------------Listeners from Popup Script------------------------------------------------------------------------------------------------------------------------------------------


// Received message from popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getExtensiondata' ){
    chrome.storage.local.get(['extensionId', 'browserInfo','ipAddress'], (data) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      const pluginId = data.extensionId || chrome.runtime.id;
      const browserInfo = data.browserInfo || 'Unknown';
      const ipAddress = data.ipAddress || 'Unknown';
      
      
      console.log("####",pluginId,browserInfo,ipAddress)
      
      sendResponse({ pluginId: pluginId, browserInfo: browserInfo , ipAddress: ipAddress });
    });
    
    return true; // Indicate that the response will be sent asynchronously
  }
})

// Received message from popup script and send which age is opened currectly
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkEmailPage' ){
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0].url;
      console.log("%%%%%%%%%%%%% url check called ", currentUrl)
      if (isGmailMailOpened(currentUrl)){
        console.log("%%%%%%%%%%%%% url check called 1")
        sendResponse('OpendedGmail')
      }
      else if(isGmailPage(currentUrl)){
        console.log("%%%%%%%%%%%%% url check called 2")
        sendResponse('Gmail')
      }else if (isOutlookPage(currentUrl)){
        console.log("%%%%%%%%%%%%% url check called 3")

        // Send a message to the content script to check for Outlook email
        chrome.tabs.sendMessage(tabs[0].id, { action: "checkOutlookmail" }, (response) => {
          console.log("(((((((((((())___________", response);

          if (response && response.emailBodyExists) {
            sendResponse("OpenedOutlook");
          } else {
            sendResponse("Outlook");
          }
        });
        return true; // Keep the channel open for async response

      }
      else {
        sendResponse(false);
      }
    });
    return true; // Indicate that the response will be sent asynchronously
  }
  return false; // Default case if the action does not match
});
// }else if (request.action === 'openRegistrationPage') {
  
//           console.log('Background script received  checkAndPerformAction from popup');
//           chrome.action.setPopup({popup: 'licenseRegistration.html'});
//           // chrome.tabs.query({active : true , currentWindow : true},function(tabs){
  //           //   handleUrlChange(tabs[0].url, tabs[0].id);
  // } else{
    //       chrome.action.setPopup({popup: 'popup.html'}); 
    //       sendResponse({ success: true });
    // }

// Received message from popup script, it checks dispute counts and status and send back to popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkDispute") {
    console.log("Got request from popup to check dispute number");

      // Send a message to the content script to fetch the dispute message ID
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]; // Assuming only one active tab at a time
      const currentUrl = activeTab.url;

      console.log("Active Tab URL:", currentUrl);

      chrome.tabs.sendMessage(activeTab.id, { action: "fetchDisputeMessageId" }, (response) => {
        console.log("Response received from content script:", response);

        if (response && response.messageId) {
          // Fetch user email from local storage
          if(response.emailId){
            console.log("got dispute count check from outloooooook")
            user_email = response.emailId
          }else{

            chrome.storage.local.get(['user_email'], async (results) => {
              const email = results['user_email'];
              user_email = results['user_email'];
              console.log("~~~~~~~~~~~~~~~~~~", email);
              if (!email) {
                console.error("No email found in local storage");
                sendResponse({ error: "No email found in local storage" });
                return;
              }
            });
          }

            // if (response.status === 'Pending') {
            //   console.log(`Thread ID ${response.threadId} is Pending, awaiting status.`);
            //   sendResponse({ status: 'Pending', messageId: response.threadId });
            // } else {
              // Check dispute count using API call
              try {
                const { dispute_count, message_status } = checkDisputeCount(response.messageId, user_email);
                console.log("-----======++++++++++++",dispute_count, message_status)

                if (dispute_count < 4) {
                  sendResponse({ status: message_status, messageId: response.messageId});
                } 
                // else {
                //   console.log(`Dispute count for Thread ID ${response.threadId} is too high.`);
                //   sendResponse({ status: 'TooHigh', messageId: response.threadId, disputeCount });
                // }
              } catch (error) {
                console.error("Error checking dispute count:", error);
                sendResponse({ error: "Error checking dispute count" });
              }
            // }

        } else if (response && response.error) {
          // If an error occurred in the content script
          console.error("Error from content script:", response.error);
          sendResponse({ error: response.error });
        } else {
          // Handle case where no valid response was received
          console.error("No valid response received from content script");
          sendResponse({ error: "No valid response from content script" });
        }
      });
    });
    // Indicate that sendResponse will be called asynchronously
    return true;
  }
});

// Received message from popup script to show all spam mails in a list
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.action == "displayAllSpams"){
      console.log("received response form popup to show all spams")
      displayAllSpamMails();
    };
});

// Received message from popup script to show particular mail in txt form
chrome.runtime.onMessage.addListener((request,sender,sendResponse) =>{
    if (request.action ==="showEmail"){
      console.log("Showing email in popup page");
      const messageId = request.id;
      showEmail(messageId);
    }
})

async function displayAllSpamMails(){
  try{
    if(!pluginId){
      pluginId = await getExtensionid();
    }
    
    if(!user_email){
      console.log("Currently email is null",user_email);
      const data = await new Promise((resolve) => {
        chrome.storage.local.get('user_email', function (data) {
          resolve(data);
        });
      });

      if (data.user_email) {
        user_email = data.user_email;
        console.log("Retrieved email from storage:", user_email);
      }
    }

    let sendingData = [user_email,pluginId]
    console.log("data[1][3] , data[1][8]",sendingData);
    console.log(JSON.stringify({user_email,pluginId}));
    const url = baseUrl + 'spam-email/';
    const response = await fetch(url,{
      method : "POST",
      headers:{
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({emailId:user_email,pluginId}),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    console.log(data[1][3] , data[1][10]);

    // Handle the response data here
    console.log('Server response:', data);
    chrome.runtime.sendMessage({action : 'spamTables', content : data});
  } catch (error) {
    // Handle errors here
    console.error('Error fetching data:', error.message);
  }
}

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------



//Call the server for dipute count
async function checkDisputeCount(messageId, emailId) {
  const url = baseUrl + `disputes/count?messageId=${messageId}&emailId=${emailId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    console.log("@@@@@@@@@@@@@@@@@@", data);

    // Assuming the API response contains disputeCount and status
    const { dispute_count, message_status } = data;
    return { dispute_count, message_status };

  } catch (err) {
    console.error("Got error in dispute count", err);
    throw err; // Propagate the error so it can be caught in the caller
  }
}



// Received message from dispute_popup for disputing on particular mail
chrome.runtime.onMessage.addListener((request,sender,sendResponse) =>{
  if(request.action == 'dispute'){
    console.log('Background script received dispute:', request.reason);

    const messageId = request.messageId;
    console.log("dispute message ID on background received from content script");
    
    // setMessageIdStatus(messId, 'Pending');
    chrome.storage.local.get(['user_email'], async (results) => {
      const email = results['user_email'];
      console.log("~~~~~~~~~~~~~~~~~~", email,messageId);

    // Send the dispute reason to the server
    sendDisputeToServer(request.reason,email)
    .then(response => {
    console.log('Server response to dispute:', response);
    // Handle server response if needed
    sendResponse({ success: true });
    })
    .catch(error => {
    console.error('Error sending dispute to server:', error);
    sendResponse({ success: false, error: 'Error sending dispute to server' });
    });
  });
    // Return true to indicate that you will asynchronously respond
  return true;
}
});


// Send Dispute with reason to server
async function sendDisputeToServer(reason,email,messageId) {
  try {
    const url = baseUrl + 'disputes/raise/';
    // const serverUrl = 'http://localhost:8000/dispute'; // Replace with your server URL
    // const requestData = {
    //   reason: reason,
    // };

    // Example using fetch with async/await
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({userComment:reason, email, medId:messageId}),
    });

    if (!response.ok) {
      throw new Error('Server error');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending dispute to server:', error);
    throw error;
  }
}

// async function showEmail(messageId){
//   try {
//     const response = await fetch("http://localhost:5000/showEmail", {
//       method: 'POST',
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({id: messageId})
//     });

//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }

//     const data = await response.json();
//     console.log("###########", data); // Log the response data
//   } catch (err) {
//     console.error("Caught in showEmail: ", err);
//   }
// }




 
//  this function First check the url and then send message to content script accordingly
async function handleUrlChange(url, tabId,messageId) {
  if (isGmailMailOpened(url)) {
    console.log("sending and receiving email data",tabId,messageId);
    createUrl(url,messageId);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@$$$$$$$$$$$$$$$$$$$44",user_email)
    await emlExtractionGmail(eml_Download_Url,messageId);
    console.log('This is a particular email page.');
  }else{
    console.log("Not GMAIL Page");
  }
}

// it create downloadable link for downloading eml of a particular mail 
function createUrl(url,messageId){
  let prefixUrl = url.substr(0,url.search("/#"));
  eml_Download_Url = (`${prefixUrl}?view=att&th=${messageId}&attid=0&disp=comp&safe=1&zw`);
  console.log("urls>>>>>>>",eml_Download_Url);
}


async function emlExtractionGmail(url, messageId) {
  console.log('content script received scraped URL:', url, messageId);
  
  try {
    console.log("-------------------");
    // Fetch the eml content using emal download url
    const response = await fetch(url);
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP ERROR! Status: ${response.status}`);
    }
    const blob = await response.blob();
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@$$$$$$$$$$$$$$$$$$$44",user_email)
    await sendEmlToServer(messageId,blob,'gmail',user_email)   //send eml to server
    console.log("Blob fetched:", blob);
  } catch (error) {
    console.error('Error in emlExtractionGmail:', error);
  }
}

async function sendEmlToServer(messageId, blob = null, client,user_email) {
  try {
    const formData = new FormData();

    // Append the Blob if it's provided
    if (client == 'gmail') {
      formData.append('file', blob, 'downloaded.eml');
    }else if (client == 'outlook'){
      blob = new Blob([blob], { type: 'text/plain' });
      formData.append('file', blob, 'downloaded.eml');
    }
    

    // Adding user data to FormData
    formData.append('messageId', messageId);
    formData.append('pluginId', pluginId);
    formData.append('browser', browserInfo);
    formData.append('ipv4', ipAddress);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('emailId', user_email);

    console.log(">>>>>> Form Data >>>>>", formData);
    const url = baseUrl + 'check-email/';

    // const uploadUrl = 'http://localhost:8000/plugin/check-email/'

    // Upload the file to the server 
    const uploadResponse = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        // Set the proper Content-Disposition header
        'Content-Disposition': 'attachment; filename="downloaded.eml"',
      },
    });

    // if (!uploadResponse.ok) {
    //   throw new Error(`HTTP ERROR! Status: ${uploadResponse.status}`);
    // }

    console.log("File successfully uploaded to the server");
    const serverData = await uploadResponse.json();
    console.log("Server Response:", serverData);

    console.log("Second Object - STATUS:", serverData.STATUS);
    console.log("Second Object - messageId:", serverData.messageId);

    const status = serverData.STATUS ;
     console.log(">>>>>>>>>>", status);
     const messId = serverData.messageId;
     console.log("Received  Message ID from Server : ",messId);

     // Handle the response based on the STATUS received
     const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
     const activeTabId = tabs[0].id;


     try {
      // Fetch the current messages from chrome.storage.local
      chrome.storage.local.get('messages', function(result) {
          let messages = result.messages ? JSON.parse(result.messages) : {};
  
          // Update the messages object based on the status
          messages[messId] = status;
  
          // Store the updated messages object back to chrome.storage.local
          chrome.storage.local.set({ messages: JSON.stringify(messages) }, function() {
              console.log("Messages:", messages);
          });

          if(currentMessageId == messId){
            console.log("Current Message Id is same")
            // Perform actions based on the status
            if (status === 'Unsafe' || status === 'Pending') {
                console.log('This mail is unsafe, blocking it');
                chrome.tabs.sendMessage(activeTabId, { action: 'blockUrls' })
                    .then(response => {
                        console.log('Message sent to content script for blocking:', response);
                    })
                    .catch(error => {
                        console.error('Error sending message to content script:', error);
                    });
            } else if (status === 'Safe') {
                console.log("This message is safe");
                chrome.tabs.sendMessage(activeTabId, { action: 'unblock' })
                    .then(response => {
                        console.log('Message sent to content script for safe mail:', response);
                    })
                    .catch(error => {
                        console.error('Error sending message to content script:', error);
                    });
            }
          }else{
            console.log("Got response for different mail")
          }
      });
  } catch (error) {
      console.error('Error handling message status:', error);
  }
  
} catch (error) {
  console.error('Error uploading file to the server:', error);
}
}







      
// ________________________________________ OUTLOOK ______________________________________________
      
// let emailContent = "";
// let dataConvidId = "";

// Listen for messages from the content script OF OUTLOOK and store messageId and eml data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('Background script received message:', message);
  if (message.action === 'outlookEmlContent') {
      console.log('Received email content:', message.emailContent);
      const emailContent = message.emailContent;
      currentMessageId = message.dataConvid;
      user_email =  message.userEmailId;
      console.log('Data Convid Id:', dataConvidId);
      sendEmlToServer(currentMessageId,emailContent,'outlook',user_email)
  }
});

































// Define your data structure
// const data = {
//   browserInfo: "Chrome 127",
//   coordinates: { latitude: 28.6125776, longitude: 77.358871 },
//   extensionId: "kdlhmggpddiplnfngcbpgelechjjemic",
//   ipAddress: "115.244.252.166",
//   operatingSystem: "win",
//   registration: true,
//   users: {
//     "example@gmail.com": {
//       "1918ee1bdaf90868": "Safe",
//       "1918be1bdaf90868": "Unsafe",
//       "19328e1bdaf90868": "Pending"
//     }
//     // Additional users can be added here
//   }
// };

// // Convert the object to a JSON string
// localStorage.setItem('extensionData', JSON.stringify(data));











// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   if (changeInfo.status === 'complete' && tab.url) {
//     console.log("This one is working from background"); 
//     console.log("current tab url & id", tab.url," ",tabId);
//     handleUrlChange(tab.url, tabId); // Pass tabId as the second argument
//   }
// });

// function processArray(arr){
//    arr.forEach(element => {
//     let downloadId = element; // Declare as local variable using 'let'
//     console.log("Download Ids",downloadId);
//      createUrl(url);   
//    });
// };
