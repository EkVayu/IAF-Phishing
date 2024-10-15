// dispute_popup.js
console.log("dispute_popup.js script loaded");

const statusElement = document.querySelector('.status');
const reasonTextarea = document.getElementById('reason');
const submitButton = document.getElementById('submit');


// Function to check if at least 5 words are entered in the reason textarea
function checkWordCount() {
  const reasonText = reasonTextarea.value.trim();
  const wordCount = reasonText.split(/\s+/).filter(word => word.length > 0).length;

  if (wordCount >= 5) {
    submitButton.classList.add('enabled');
    submitButton.disabled = false;
  } else {
    submitButton.classList.remove('enabled');
    submitButton.disabled = true;
  }
}

// Event listener to validate word count in the reason textarea
reasonTextarea.addEventListener('input', checkWordCount);



// Event listener for the submit button click
submitButton.addEventListener('click', () => {
    const reasonText = reasonTextarea.value.trim();
    const messageId = document.getElementById('messageId').textContent
    console.log("XXXXXXXXXXXXXXX",reasonText,messageId)
  
    // Send reason and message ID back to the background script
    chrome.runtime.sendMessage({ 
      action: 'dispute', 
      reason: reasonText, 
      messageId: messageId 
    }, (response) => {
      if (response && response.success) {
        console.log('Dispute sent successfully');
  
        // Close the popup (you can simply close the window if it is in a new tab or a separate popup)
        window.close();  // This will close the popup
  
      } else {
        console.error('Failed to send dispute');
        window.close();
        alert('Failed to send the dispute. Please try again.');
      }
    });
  });


// Send reason back to background script
    //   chrome.runtime.sendMessage({ action: 'dispute', reasonText, messId }, (response) => {
    //     if (response && response.success) {
    //       console.log('Dispute sent successfully');
    //     } else {
    //       console.error('Failed to send dispute');
    //     }
    //   });





// function showConfirmationPopup(messId) {
//     // Create popup dynamically 
//     console.log("Popup is created dynamically");
//     const popupDiv = document.createElement('div');
//     popupDiv.id = "user-confirmation-popup";
//     console.log("2--------------");
  
//     // Set popup styles
//     popupDiv.style.position = 'fixed';
//     popupDiv.style.top = '23%';
//     popupDiv.style.right = '0.5%';
//     popupDiv.style.transform = 'translate(-50%, -50%)';
//     popupDiv.style.backgroundColor = '#ffffff';
//     popupDiv.style.padding = '20px';
//     popupDiv.style.border = '2px solid #333333';
//     popupDiv.style.borderRadius = '5px';
//     popupDiv.style.zIndex = '9999';
  
//     // Load external CSS
//     const link = document.createElement('link');
//     link.rel = 'stylesheet';
//     link.href = chrome.runtime.getURL('dispute_popup.css');
//     document.head.appendChild(link);
//     console.log("3--------------");
  
  
//     popupDiv.innerHTML = `
//       <button id="close-button" style="position: absolute; top: 10px; right: 10px; border: none; background: none; cursor: pointer; font-size: 20px; font-weight: bold;">×</button>
//       <h2>This is a phishing mail</h2> 
//       <p>For dispute press "Not Accepted"?</p>
//       <div id="button-container">
//          <button id="accept-button">Accept</button>
//          <button id="reject-button">Not Accepted</button>
//       </div>
//       <textarea id="reason-area" placeholder="Reason (if not accepted)" style="display:none;" maxlength="500"></textarea>
//       <button id="send-button" style="display:none;">Send</button>
//     `;
//     document.body.appendChild(popupDiv);
//     console.log("4--------------");
  
  
//     const acceptButton = document.getElementById('accept-button');
//     const rejectButton = document.getElementById('reject-button');
//     const reasonArea = document.getElementById('reason-area');
//     const sendButton = document.getElementById('send-button');
//     const closeButton = document.getElementById('close-button');
  
//     console.log("5--------------");
  
//     // Add button event listeners
//     acceptButton.addEventListener('click', handleAccept);
//     rejectButton.addEventListener('click', handleReject);
//     sendButton.addEventListener('click', handleSend);
//     // Close button event listener
//     closeButton.addEventListener('click', function() {
//       document.body.removeChild(popupDiv); // Remove the popup from the DOM
//     });
  
  
  
//     console.log("6--------------");
  
  
//     function handleAccept() {
//       // ... Logic to carry out URL blocking ...
//       console.log("User has accepted the request");
//       removePopup(); 
//     }
  
//     function handleReject() {
//       reasonArea.style.display = 'block';
//       sendButton.style.display = 'block';
//       disableButtons();
//       reasonArea.focus(); // Put the cursor in for user convenience
//     }
  
//     function handleSend() {
//       const reasonText = reasonArea.value.trim();
//       const wordCount = reasonText.split(/\s+/).filter(Boolean).length;
  
//       if (wordCount < 5) {
//           alert('Please provide a reason with at least 5 words.');
//           return; // Stop the function if the validation fails
//       }
  
//       console.log("User disputed so removing urls blocking", reasonText);
  
//       // // Disable URL blocking
//       // blockUrlsEnabled = false;
  
//       // // Remove URL blocking
//       // blockUrls();
  
//       // Send reason back to background script
//       chrome.runtime.sendMessage({ action: 'dispute', reasonText, messId }, (response) => {
//         if (response && response.success) {
//           console.log('Dispute sent successfully');
//           removePopup();
//         } else {
//           console.error('Failed to send dispute');
//         }
//       });
//     }
  
//     function disableButtons() {
//       acceptButton.disabled = true;
//       rejectButton.disabled = true;
//     }
//   }
  
//   function removePopup() {
//     document.getElementById('user-confirmation-popup').remove();
//   }


