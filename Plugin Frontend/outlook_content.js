console.log("Content script loaded.");

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


  if (isJunkEmailDiv || isArchiveDiv || isDeletedItemsDiv) {
    console.log('Junk Email, Archive, or Deleted Items div clicked');
    // reInitializeTheScript();
    setTimeout(() => {
      window.location.reload();
    }, 200);
    // twoSecondDelay();
  }

  if (isSentItemsDiv || isDraftDiv) {
    // twoSecondDelay();
        setTimeout(() => {
          shouldApplyPointerEvents = false;
          blockEmailBody();
        }, 200);    
    }
}

document.addEventListener('click', detectMenuItems, true);

// twoSecondDelay = ()=> {
//   const emailListContainerBlock = document.querySelector('.customScrollBar.jEpCF');
//     if (emailListContainerBlock) {
//       emailListContainerBlock.style.pointerEvents = 'none';
//       console.log('Pointer events disabled');

//        setTimeout(() => {
//          emailListContainerBlock.style.pointerEvents = 'auto';
//          console.log('Pointer events re-enabled');
//        }, 2000); 
//        } else {
//        console.log('Element not found');
//        }
// }




// function reInitializeTheScript() {
//   console.log('Re-initializing the content script');

//   const emailListContainerBlock = document.querySelector('.customScrollBar.jEpCF');
  
//   if (emailListContainerBlock) {
//     emailListContainerBlock.style.pointerEvents = 'none';
//     console.log('Pointer events disabled');

//      setTimeout(() => {
//        emailListContainerBlock.style.pointerEvents = 'auto';
//        console.log('Pointer events re-enabled');
//      }, 2000); 
//      } else {
//      console.log('Element not found');
//      }

//   // Set up click listeners in parallel
//   setTimeout(() => {
//     setupClickListener();
//   }, 100);
// }


// Global boolean flag to control the execution of blockEmailBody


var shouldApplyPointerEvents = true; // Default value

function reloadDetectBlockBody() {
shouldApplyPointerEvents = true;
blockEmailBody();
if(shouldApplyPointerEvents){
  console.log('Reload Detected and the message body is blocked');
}
}

// // Send email content when the page is loaded
window.addEventListener('load', reloadDetectBlockBody);

function showLoadingScreen() {
const loadingScreen = document.createElement('div');
loadingScreen.id = 'loading-screen';

// Styles for the loading screen
Object.assign(loadingScreen.style, {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  zIndex: '2147483647',
  pointerEvents: 'none',
  fontFamily: 'Segoe UI, sans-serif',
  textAlign: 'center',
});

// Create a morphing shape animation
const morphingShape = document.createElement('div');
Object.assign(morphingShape.style, {
  width: '70px',
  height: '70px',
  backgroundColor: '#3498db',
  borderRadius: '15%', // Starting as a rounded square
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
await Promise.all([blockEmailBody(), showLoadingScreenFor5Seconds(), runEmailExtraction()]);
}

// Updated blockEmailBody function to toggle pointer-events
function blockEmailBody(attempts = 10) {
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
} else if (attempts > 0) {
  // console.log('Email Body or Junk Box not found, retrying...');
  setTimeout(() => blockEmailBody(attempts - 1), 500);
} else {
  // console.log('Email content and Junk Box still not found after multiple attempts, giving up');
  console.log("..");
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

        const ariaLabelDiv = clickedElement.querySelector('div[aria-label]');
        const ariaLabel = ariaLabelDiv?.getAttribute('aria-label');
        const containsUnknown = ariaLabel?.includes('[Unknown]');
        console.log("Contains '[Unknown]':", containsUnknown);
        if (containsUnknown) {
          // setTimeout(() => {
            shouldApplyPointerEvents = false;
            blockEmailBody();
          // }, 100);
        }


        else if (dataConvid) {

          console.log("data-convid found, running email extraction");
          // Retrieve the "messages" object from chrome.storage.local
            chrome.storage.local.get("messages", function(result) {
             let messages = JSON.parse(result.messages || '{}'); // Ensure messages is an object
              console.log("___________________", messages);

            if (messages[dataConvid]) {
              console.log("Thread ID status:", messages[dataConvid]);
              if (messages[dataConvid] === "Safe") {
                  console.log("Local Storage status", messages[dataConvid]);
                  shouldApplyPointerEvents = false;
                  blockEmailBody();
                  // alert('Safe Environment');
                  console.log(`Removing blocking layer because message is ${messages[dataConvid]}`);
                } else if (messages[dataConvid] === "Unsafe") {
                 console.log("Local Storage status", messages[dataConvid]);
                  console.log(`Applying blocking layer because message is ${messages[dataConvid]}`);
                  shouldApplyPointerEvents = true;
                  blockEmailBody();
                  // alert('Unsafe Environment Detected');
                  // applyBlockingLayer(); // Applying Blocking Layer on the mail
                 } 
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



//Little bit slower then the above code
function runEmailExtraction() {
console.log("Running email extraction code");

function waitForNavButton(attempts = 30) {
  const navi = document.querySelectorAll(".ms-Button--hasMenu");
  console.log("Navigation buttons:", navi);

  const lastIndex = Math.max(3, navi.length - 1);

  if (navi[lastIndex] && navi[lastIndex].offsetParent !== null) {
      console.log(`Clicking navigation button at index ${lastIndex}`);
      navi[lastIndex].click();
      setTimeout(() => extractMenu(), 500); // Slightly increased timeout
  } else if (attempts > 0) {
      console.log("Navigation button not found or not visible, retrying...");
      setTimeout(() => waitForNavButton(attempts - 1), 500); // Increased retry delay
  } else {
      console.log("Navigation button still not found after multiple attempts, giving up");
  }
}

function extractMenu(attempts = 20) {
  const list = document.querySelector('.ms-ContextualMenu-list.is-open');
  if (list) {
    const listItems = list.querySelectorAll('.ms-ContextualMenu-item');
    listItems.forEach((item) => {
      const button = item.querySelector('button.ms-ContextualMenu-link');
      const buttonText = button?.querySelector('.ms-ContextualMenu-itemText');
      if (buttonText?.textContent === "View") {
        const mouseoverEvent = new MouseEvent('mouseover', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        button.dispatchEvent(mouseoverEvent);
        console.log('Mouseover event triggered on "View" button');
      }
    });
    setTimeout(() => clickViewMessageSource(), 500);
  } else if (attempts > 0) {
    console.log('Menu list not found, retrying...');
    setTimeout(() => extractMenu(attempts - 1), 700); // Adjusted retry timing
  } else {
    console.log('Menu list still not found after multiple attempts');
  }
}

function clickViewMessageSource(attempts = 20) {
  const button = document.querySelector('button[aria-label="View message source"]');
  if (button) {
    button.click();
    setTimeout(() => extractTextContent(), 1000); // Increased delay for loading content
  } else if (attempts > 0) {
    console.log('View message source button not found, retrying...');
    setTimeout(() => clickViewMessageSource(attempts - 1), 500);
  } else {
    console.log('View message source button still not found after multiple attempts');
  }
}


function extractTextContent(attempts = 20) {
  const element = document.querySelector('.lz61e.allowTextSelection');
  if (element && element.innerText.trim().length > 0) {
    const emailContent = element.innerText;
    console.log('Extracted email content:', emailContent);

    setTimeout(() => {
      try {
        chrome.runtime.sendMessage({ action: "outlookEmlContent", emailContent, dataConvid,  userEmailId }, function(response) {
          console.log("Response from background.js", response);
        });
      } catch (error) {
        console.error('Error sending email content to background script:', error);
      }
    }, 1000);
  } else if (attempts > 0) {
    console.log('Text content element not found or empty, retrying...');
    setTimeout(() => extractTextContent(attempts - 1), 1000); // Retry with longer interval
  } else {
    console.error('Text content element still not found after multiple attempts');
  }
  setTimeout(() => closeEmail(), 1500); // Increased delay before closing the email
}

function closeEmail(attempts = 20) {
  const closeButton = document.querySelector('._9aDAm');
  const modalContent = document.querySelector('.ms-Modal-scrollableContent');

  if (!modalContent) {
    console.log('Modal content is not found, means it is already closed.');
    return; // Exit if the modal content is no longer in the DOM
  }

  if (closeButton && closeButton.offsetParent !== null) { // Check visibility before closing
    closeButton.click();
    console.log('Close button clicked, checking if modal content is still open...');

    setTimeout(() => {
      if (modalContent && (modalContent.offsetParent !== null || modalContent.style.display !== 'none')) {
        console.log('Modal content is still open, retrying...');
        closeEmail(attempts - 1); // Retry closing the modal
      } else {
        console.log('Modal content closed successfully');
      }
    }, 1000); // Increased delay to allow time for closing
  } else if (attempts > 0) {
    console.log('Close button not found, retrying...');
    setTimeout(() => closeEmail(attempts - 1), 500);
  } else {
    console.error('Close button still not found after multiple attempts');
  }
}

// Call the function to start searching
waitForNavButton();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message);

      if (message.action === 'blockUrls') {
          shouldApplyPointerEvents = true;
          console.log('Blocking URLs, shouldApplyPointerEvents set to true');
      } else if (message.action === 'unblock') {
          shouldApplyPointerEvents = false;
          console.log('Unblocking URLs, shouldApplyPointerEvents set to false');
      }

      // Re-execute blockEmailBody whenever shouldApplyPointerEvents changes
      blockEmailBody();
    //   if (shouldApplyPointerEvents) {
    //     alert('Unsafe Environment Detected');
    // } else {
    //     alert('Safe Environment');
    // }
      sendResponse({status: 'success'});
});

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

setupClickListener();
findOutlookEmailId();