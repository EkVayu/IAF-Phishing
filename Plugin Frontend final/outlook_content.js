console.log("Content script loaded.");

chrome.storage.local.get('registration', (data) => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError);
    return;
  }

  if (data.registration) {
    console.log('Registration data:', data.registration);
    setupClickListener();
    findOutlookEmailId();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "checkOutlookmail" || message.action == "fetchDisputeMessageId") {
    // Check if the div with id 'ReadPaneContainer' exists
    const emailBodySearch = document.querySelector('#ReadingPaneContainerId');
    if (emailBodySearch) {
      // Send response back to background.js
      sendResponse({
        emailBodyExists: true,
        messageId: dataConvid,
        emailId: userEmailId
      });
    } else {
      sendResponse({ emailBodyExists: false, error:"did't grt the messasge Id"});
    }
  }
  return true;  // Keeps the message channel open for async sendResponse
});

// Content.js
function detectMenuItems(event) {
  let target = event.target;

  // Traverse up the DOM tree to find the parent div, in case the click was on a child element
  while (target && target.tagName !== 'DIV') {
    target = target.parentElement;
  }

  // Helper function to check if the target matches the given criteria
  function isMatchingDiv(target, titleText, folderName) {
    return target &&
      target.tagName === 'DIV' &&
      target.getAttribute('title')?.toLowerCase().includes(titleText.toLowerCase()) &&
      (target.getAttribute('aria-selected') === 'true' || 
       target.getAttribute('data-folder-name')?.toLowerCase() === folderName.toLowerCase());
  }

  const isJunkEmailDiv = isMatchingDiv(target, 'junk email', 'junk email');
  const isArchiveDiv = isMatchingDiv(target, 'archive', 'archive');
  const isDeletedItemsDiv = isMatchingDiv(target, 'deleted items', 'deleted items');
  const isSentItemsDiv = isMatchingDiv(target, 'sent items', 'sent items');
  const isDraftDiv = isMatchingDiv(target, 'drafts', 'drafts');
  const isInboxDiv = isMatchingDiv(target, 'inbox', 'inbox');


  if (isJunkEmailDiv || isArchiveDiv || isDeletedItemsDiv || isSentItemsDiv || isDraftDiv || isInboxDiv) {
    console.log('Junk Email, Archive, or Deleted Items div clicked');
    // reInitializeTheScript();
    setTimeout(() => {
      window.location.reload();
    }, 200);
    // twoSecondDelay();
  }

  // if (isSentItemsDiv || isDraftDiv) {
  //   // twoSecondDelay();
  //       // setTimeout(() => {
  //         shouldApplyPointerEvents = false;
  //         blockEmailBody();
  //       // }, 200);    
  //   }

}

document.addEventListener('click', detectMenuItems, true);

// Global boolean flag to control the execution of blockEmailBody
let shouldApplyPointerEvents = null; // Default value

// function reloadDetectBlockBody() {
// shouldApplyPointerEvents = true;
// blockEmailBody();
// if(shouldApplyPointerEvents){
//   console.log('Reload Detected and the message body is blocked');
// }
// }

// // // Send email content when the page is loaded
// window.addEventListener('load', reloadDetectBlockBody);


//To cover the display


// Blocking user interactions
function blockUserInteraction() {
  document.body.style.pointerEvents = 'none'; // Disable all pointer events on the page
  window.addEventListener('keydown', preventDefaultForKeyPress, true); // Block keyboard interaction
  window.addEventListener('mousedown', preventDefaultForMouse, true);  // Block mouse clicks
}

function unblockUserInteraction() {
  document.body.style.pointerEvents = ''; // Re-enable pointer events
  window.removeEventListener('keydown', preventDefaultForKeyPress, true); // Unblock keyboard
  window.removeEventListener('mousedown', preventDefaultForMouse, true);  // Unblock mouse clicks
}

function preventDefaultForKeyPress(e) {
  e.preventDefault(); // Prevent all key presses
}

function preventDefaultForMouse(e) {
  e.preventDefault(); // Prevent all mouse events
}

function showLoadingScreen() {
  const loadingScreen = document.createElement('div');
  loadingScreen.id = 'loading-screen';

  // Styles for the loading screen
  Object.assign(loadingScreen.style, {
    pointerEvents: 'all', // Ensure this captures all mouse events
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0,0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    zIndex: '2147483647',
    fontFamily: 'Segoe UI, sans-serif',
    textAlign: 'center',
  });

  // Prevent any mouse interaction during loading screen
  ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover', 'mouseenter', 'mouseleave'].forEach(eventType => {
    loadingScreen.addEventListener(eventType, (e) => {
      e.stopPropagation(); // Stop events from propagating
      e.preventDefault();  // Prevent default action
    });
  });

  // Create a morphing shape animation
  const morphingShape = document.createElement('div');
  Object.assign(morphingShape.style, {
    width: '70px',
    height: '70px',
    backgroundColor: '#3498db',
    borderRadius: '15%',
    animation: 'morph 3s infinite ease-in-out',
  });

  // Create a fading text message
  const loadingText = document.createElement('p');
  loadingText.innerText = 'Please wait...';
  Object.assign(loadingText.style, {
    marginTop: '30px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    animation: 'fade 3s infinite alternate ease-in-out',
  });

  // Append morphing shape and text to the loading screen
  loadingScreen.appendChild(morphingShape);
  loadingScreen.appendChild(loadingText);

  document.body.appendChild(loadingScreen);

  // Adding keyframes for morphing shape animation
  const styleSheet = document.styleSheets[0];
  const morphKeyframes =
    `@keyframes morph {
      0% { border-radius: 15%; transform: rotate(0deg); }
      33% { border-radius: 50%; transform: rotate(120deg); }
      66% { border-radius: 0; transform: rotate(240deg); }
      100% { border-radius: 15%; transform: rotate(360deg); }
    }`;
  const fadeKeyframes =
    `@keyframes fade {
      0% { opacity: 1; }
      100% { opacity: 0.5; }
    }`;

  styleSheet.insertRule(morphKeyframes, styleSheet.cssRules.length);
  styleSheet.insertRule(fadeKeyframes, styleSheet.cssRules.length);
}

// function showLoadingScreen() {
//   const loadingScreen = document.createElement('div');
//   loadingScreen.id = 'loading-screen';

//   // Styles for the loading screen
//   Object.assign(loadingScreen.style, {
//     pointerEvents: 'all', // Ensure this captures mouse events
//     position: 'fixed',
//     top: '0',
//     left: '0',
//     width: '100%',
//     height: '100%',
//     backgroundColor: 'rgba(0, 0, 0,0.8)',
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     color: '#fff',
//     zIndex: '2147483647',
//     fontFamily: 'Segoe UI, sans-serif',
//     textAlign: 'center',
//   });

//   // Prevent mouse events
//   loadingScreen.addEventListener('click', (e) => {
//     e.stopPropagation(); // Stop click events from propagating
//     e.preventDefault();  // Prevent default action
//   });

//   // Create a morphing shape animation
//   const morphingShape = document.createElement('div');
//   Object.assign(morphingShape.style, {
//     width: '70px',
//     height: '70px',
//     backgroundColor: '#3498db',
//     borderRadius: '15%',
//     animation: 'morph 3s infinite ease-in-out',
//   });

//   // Create a fading text message
//   const loadingText = document.createElement('p');
//   loadingText.innerText = 'Please wait...';
//   Object.assign(loadingText.style, {
//     marginTop: '30px',
//     fontSize: '20px',
//     fontWeight: 'bold',
//     color: '#ffffff',
//     animation: 'fade 3s infinite alternate ease-in-out',
//   });

//   // Append morphing shape and text to the loading screen
//   loadingScreen.appendChild(morphingShape);
//   loadingScreen.appendChild(loadingText);

//   document.body.appendChild(loadingScreen);

//   // Adding keyframes for morphing shape animation
//   const styleSheet = document.styleSheets[0];
//   const morphKeyframes =
//     `@keyframes morph {
//       0% { border-radius: 15%; transform: rotate(0deg); }
//       33% { border-radius: 50%; transform: rotate(120deg); }
//       66% { border-radius: 0; transform: rotate(240deg); }
//       100% { border-radius: 15%; transform: rotate(360deg); }
//     }`;
//   const fadeKeyframes =
//     `@keyframes fade {
//       0% { opacity: 1; }
//       100% { opacity: 0.5; }
//     }`;

//   styleSheet.insertRule(morphKeyframes, styleSheet.cssRules.length);
//   styleSheet.insertRule(fadeKeyframes, styleSheet.cssRules.length);
// }




function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.remove();
  }
}

// Function to show the loading screen for 5 seconds
function showLoadingScreenFor5Seconds() {
return new Promise((resolve) => {
  showLoadingScreen();
  setTimeout(() => {
    hideLoadingScreen();
    resolve();
  }, 5000);
});
}

// Function to execute email extraction code with loading screen

async function executeWithLoadingScreenAndExtraction() {
  blockUserInteraction(); // Disable all user interactions
  showLoadingScreen();     // Show the loading screen indefinitely

  try {
    await runEmailExtraction(); // Extract email content
  } finally {
    hideLoadingScreen();    // Hide the loading screen once email content is extracted
    unblockUserInteraction(); // Re-enable user interactions
  }
  informUser();             // Inform the user after completion
}


// async function executeWithLoadingScreenAndExtraction() {
//   showLoadingScreen(); // Show the loading screen indefinitely

//   try {
//     await runEmailExtraction(); // Extract email content
//   } finally {
//     hideLoadingScreen(); // Hide the loading screen once email content is extracted
//   }
//   informUser();

// }


function informUser(){
  alert("Please open the email again to check response whether the environment is safe or not");
}


// Updated blockEmailBody function to toggle pointer-events

function blockEmailBody() {
const element = document.querySelector('#ConversationReadingPaneContainer');
const junkBox = document.querySelector('#ItemReadingPaneContainer');

// Function to apply pointer events to an element if it exists
function applyPointerEvents(el, state) {
  if (el) {
    el.style.pointerEvents = state;
    console.log(`Applied pointer-events: ${state} to ${el.id}`);
  }
}

// Apply pointer events to both elements
if (element || junkBox) {
  const pointerState = shouldApplyPointerEvents ? 'none' : 'all';
  applyPointerEvents(element, pointerState);
  applyPointerEvents(junkBox, pointerState);
}
}

// Function to set up the click event listener on the .EeHm8 elements

function setupClickListener(attempts = 20) {
  console.log("Setting up click listener for email elements");
  const emailListContainer = document.querySelector('.customScrollBar.jEpCF');
  

  if (emailListContainer) {
    console.log("Email list container found, setting up click listener");
    emailListContainer.addEventListener('click', (event) => {
      let clickedElement = event.target;
  
      while (clickedElement && !clickedElement.classList.contains('EeHm8')) {
        clickedElement = clickedElement.parentElement;
      }
  
      if (clickedElement) {
        console.log("Clicked on an element within .EeHm8");
        setTimeout(() => {
          const selectedDiv = clickedElement.querySelector('div[aria-selected="true"]');
  
          dataConvid = selectedDiv?.getAttribute('data-convid');
          console.log("data-convid:", dataConvid);
  
          // Get aria-label from the clicked element
          const ariaLabelDiv = clickedElement.querySelector('div[aria-label]');
          const ariaLabel = ariaLabelDiv?.getAttribute('aria-label');
          const containsUnknown = ariaLabel?.includes('[Unknown]');
          console.log("Contains '[Unknown]':", containsUnknown);
  
          // Query once for inner folder div
          const innerFolderDiv = document.querySelector('span.vlQVl.jXaVF.P3G2l');
          const isSentItems = innerFolderDiv?.textContent === "Sent Items";
          const isDraftItems = innerFolderDiv?.textContent === "Drafts";
  
          if (isSentItems) {
            console.log("This is the Sent Items folder");
          } else if (isDraftItems) {
            console.log("This is the Draft Items folder");
          }
  
          // Execute further actions if necessary conditions are met
          if (containsUnknown || isSentItems || isDraftItems) {
            shouldApplyPointerEvents = false;
            blockEmailBody();
          }

  
          else if (dataConvid) {
            console.log("data-convid found, running email extraction");
            // Retrieve the "messages" object from chrome.storage.local
              chrome.storage.local.get("messages", function(result) {
               let messages = JSON.parse(result.messages || '{}'); // Ensure messages is an object
                console.log("___________________", messages);
  
              if (messages[dataConvid]) {
                console.log("Thread ID status:", messages[dataConvid]);
                if (messages[dataConvid] === "safe") {
                    console.log("Local Storage status", messages[dataConvid]);
                    shouldApplyPointerEvents = false;
                    blockEmailBody();
                    alert('Safe Environment');
                    console.log(`Removing blocking layer because message is ${messages[dataConvid]}`);
                  } else if (messages[dataConvid] === "unsafe") {
                   console.log("Local Storage status", messages[dataConvid]);
                    console.log(`Applying blocking layer because message is ${messages[dataConvid]}`);
                    alert('Unsafe Environment');
                    shouldApplyPointerEvents = true;
                    blockEmailBody();
                   } 
                   else{
                    console.log("Pending status in Local Storage");
                    const emailBodySearch = document.querySelector('#ReadingPaneContainerId');
                    if(emailBodySearch){
                    executeWithLoadingScreenAndExtraction();
                   }
                   else{
                    console.log("Email Body not found and retying to find the email body");
                    setTimeout(() => setupClickListener(), 1000);
                   }
                  }
                  //  else{
                  //   console.log("Local Storage status pending 84517428712858412867842078");
                  //   chrome.runtime.sendMessage({ action: "pendingStatusOutlook", dataConvid, userEmailId }, function(response) {
                  //     console.log("Response from background.js", response);
                  //   });
                  //  }
                }
              else {
                  // If dataConvid does not exist, set it to "Pending" and store it
                  messages[dataConvid] = "Pending";
                  chrome.storage.local.set({ "messages": JSON.stringify(messages) }, function() {
                    chrome.storage.local.get(null, function(data){
                      console.log("Data from local storage:", data);
                  })
                    console.log("Applying blocking layer because message is not Present in Local storage");
                    shouldApplyPointerEvents = true;
                    // blockEmailBody()
                    executeWithLoadingScreenAndExtraction();
                                        
                    // sendResponse({ received: true, dataConvid: dataConvid });
                  });
                }
              });
          } 
          else {
            console.log("data-convid not found or null, skipping extraction");
          }
        }, 1000);
      }
    });
    console.log("Click listener set up for .EeHm8 elements");
  } else if (attempts > 0) {
    console.log("Email list container not found, retrying...");
    setTimeout(() => setupClickListener(attempts - 1), 500);
  } else {
    console.log("Email list container still not found after multiple attempts, giving up");
  }
}

async function runEmailExtraction() {
  console.log("Running email extraction code");

  // Batch processing for DOM interactions
  const processNavigationButton = async () => {
    const navi = document.querySelectorAll(".ms-Button--hasMenu");
    console.log("Navigation buttons:", navi);
    
    const lastIndex = Math.max(3, navi.length - 1);
    if (navi[lastIndex] && navi[lastIndex].offsetParent !== null) {
      console.log(`Clicking navigation button at index ${lastIndex}`);
      navi[lastIndex].click();
      await waitForMenu(); // Wait for menu to appear
    } else {
      console.log("Navigation button not found or not visible, retrying...");
      await new Promise(resolve => setTimeout(resolve, 500));
      await processNavigationButton(); // Retry
    }
  };

  const waitForMenu = async () => {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        const list = document.querySelector('.ms-ContextualMenu-list.is-open');
        if (list) {
          console.log('Menu opened');
          resolve(extractMenu(list)); // Call extractMenu directly
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  };

  const extractMenu = async (list) => {
    const listItems = list.querySelectorAll('.ms-ContextualMenu-item');
    for (const item of listItems) {
      const button = item.querySelector('button.ms-ContextualMenu-link');
      const buttonText = button?.querySelector('.ms-ContextualMenu-itemText');
      if (buttonText?.textContent === "View") {
        const mouseoverEvent = new MouseEvent('mouseover', { view: window, bubbles: true, cancelable: true });
        button.dispatchEvent(mouseoverEvent);
        console.log('Mouseover event triggered on "View" button');
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Short delay
    await clickViewMessageSource();
  };

  const clickViewMessageSource = async () => {
    const button = document.querySelector('button[aria-label="View message source"]');
    if (button) {
      button.click();
      console.log('Clicked "View message source"');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for content to load
      await extractTextContent();
    } else {
      console.log('View message source button not found, retrying...');
      await new Promise(resolve => setTimeout(resolve, 500));
      await clickViewMessageSource(); // Retry
    }
  };

  const extractTextContent = async () => {
    const element = document.querySelector('.lz61e.allowTextSelection');
    if (element && element.innerText.trim().length > 0) {
      const emailContent = element.innerText;
      console.log('Extracted email content:', emailContent);
      await sendContentToBackground(emailContent);
      await closeEmail();
    } else {
      console.log('Text content element not found or empty, retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await extractTextContent(); // Retry
    }
  };
  

  const sendContentToBackground = async (emailContent) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "outlookEmlContent", emailContent, dataConvid, userEmailId }, function(response) {
        console.log("the outlook data is sended to background.js and response will be undefined: ", response);
        resolve();
      });
    });
  };

  const closeEmail = async () => {
    const closeButton = document.querySelector('._9aDAm');
    const modalContent = document.querySelector('.ms-Modal-scrollableContent');

    if (!modalContent) {
      console.log('Modal content is not found, means it is already closed.');
      return;
    }

    if (closeButton && closeButton.offsetParent !== null) {
      closeButton.click();
      console.log('Close button clicked');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before checking modal state
      await closeEmail(); // Retry if needed
    } else {
      console.log('Close button not found, cannot close modal');
    }
  };

  // Start the extraction process
  await processNavigationButton();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.client === 'outlook') {  // Check if the message is for Outlook
    console.log("this is the function that will be called when the content script receives a message for the Outlook client");

    if (message.action === 'blockUrls') {
      console.log('Outlook Content script received message:', message.action);

      shouldApplyPointerEvents = true;
      console.log('Blocking URLs for Outlook');
    } else if (message.action === 'unblock') {
      shouldApplyPointerEvents = false;
      console.log('Unblocking URLs for Outlook');
    }
    blockEmailBody();
    sendResponse({status: 'success'});
  }
});



// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//       console.log('Content script received message:', message);

//       if (message.action === 'blockUrls') {
//           shouldApplyPointerEvents = true;
//           console.log('Blocking URLs, shouldApplyPointerEvents set to true');
//       } else if (message.action === 'unblock') {
//           shouldApplyPointerEvents = false;
//           console.log('Unblocking URLs, shouldApplyPointerEvents set to false');
//       }

//       // Re-execute blockEmailBody whenever shouldApplyPointerEvents changes
//       blockEmailBody();
//     //   if (shouldApplyPointerEvents) {
//     //     alert('Unsafe Environment Detected');
//     // } else {
//     //     alert('Safe Environment');
//     // }
//       sendResponse({status: 'success'});
// });

// Function to find the Outlook email ID



function findOutlookEmailId() {
const outlookRegex = /^https:\/\/(?:outlook\.office\.com|outlook\.live\.com|office\.live\.com|outlook\.office365\.com)\/mail\//;

if (!outlookRegex.test(window.location.href)) {
  console.log('Not on an Outlook mail page');
  return;
}

const searchInterval = setInterval(() => {
  const anchor = [...document.querySelectorAll('a')].find(a => a.getAttribute('aria-label') === 'Go to Outlook');
  
  if (anchor) {
    const match = anchor.getAttribute('href').match(/login_hint=([^&]+)/);
    userEmailId = match ? decodeURIComponent(match[1]) : null;

    if (userEmailId) {
      console.log('Email ID found:', userEmailId);
      clearInterval(searchInterval); // Stop searching once email ID is found
      return;
    }
  } else {
    console.log('Email ID not found. Searching again...');
  }
}, 1000); // Run the search every 1 second (adjust interval as needed)
}

// setupClickListener();
// findOutlookEmailId();









