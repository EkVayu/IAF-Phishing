document.addEventListener('DOMContentLoaded', function () {
  chrome.runtime.sendMessage({ action: 'checkEmailPage' }, function (response) {
    const buttonContainer = document.querySelector('.button-container');
    const emailPages = ['Gmail', 'Outlook', 'OpendedGmail', 'OpenedOutlook', 'Yahoo', 'OpenedYahoo'];
    const isEmailPage = emailPages.includes(response);

    if (isEmailPage) {
      chrome.storage.local.get('registration', (data) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        // User not registered
        if (!data.registration) {
          buttonContainer.innerHTML = `
            <p>Please register to access your phishing mails</p>
            <button id="registerButton" type="button">Register</button>
          `;
          setupRegisterButton(buttonContainer);
        } else {
          setupEmailPage(buttonContainer, response);
        }
      });
    } else {
      buttonContainer.innerHTML = `<p>This is not an Email page.</p>`;
    }
  });

  // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //   if (request.action === 'spamTables') {
  //     const buttonContainer = document.querySelector('.button-container');
  //     const mailServiceList = document.querySelector('#email-services');

  //     // Hide containers if they exist
  //     if (buttonContainer) buttonContainer.style.display = 'none';
  //     if (mailServiceList) mailServiceList.style.display = 'none';

  //     const data = request.data;
  //     chrome.runtime.sendMessage({action : 'activityData', data : data});
  //     // extractAndCreateTable(data);
  //   }
  // });
});


function setupRegisterButton(buttonContainer) {
  document.getElementById('registerButton').addEventListener('click', function () {
    fetch('licenseRegistration.html')
      .then(response => response.text())
      .then(html => {
        buttonContainer.innerHTML = html;

        // Request extension data from the background script
        chrome.runtime.sendMessage({ action: 'getExtensiondata' }, function (response) {
          if (response && response.pluginId && response.browserInfo && response.ipAddress) {
            document.getElementById('pluginId').value = response.pluginId;
            document.getElementById('browser').value = response.browserInfo;
            document.getElementById('ipAddress').value = response.ipAddress;
          } else {
            console.error('Failed to get the extensionID and browserId');
          }
        });

        // Load the registration script
        const script = document.createElement('script');
        script.src = 'licenseRegistration.js';
        document.body.appendChild(script);
      })
      .catch(error => console.error('Error loading registration form:', error));
  });
}


function setupEmailPage(buttonContainer, response) {
  const openedServices = ['OpendedGmail', 'OpenedOutlook', 'OpenedYahoo'];

  if (openedServices.includes(response)) {
    // Show phishing and dispute buttons
    buttonContainer.innerHTML = `
      <p>Click here to access all your phishing mails</p>
      <button id="showSpamButton" type="button">Show Phishing mails</button>
      <p>Click here for dispute</p>
      <button id="disputeButton" type="button">Dispute</button>
      <span id="dispute-error" style="color:red; display:none;"></span>
    `;

    setupShowSpamButton(buttonContainer);
    setupDisputeButton(buttonContainer);
  } else {
    // Show phishing button only
    buttonContainer.innerHTML = `
      <p>Click here to access all your phishing mails</p>
      <button id="showSpamButton" type="button">Show Phishing mails</button>
    `;
    setupShowSpamButton(buttonContainer);
  }
}

function setupShowSpamButton(buttonContainer) {
  document.getElementById('showSpamButton').addEventListener('click', () => {
    fetch('displayActivity.html')
      .then(response => response.text())
      .then(html => {
        buttonContainer.innerHTML = html;
        initializeDisplayActivityScript();
      })
      .catch(error => console.error('Error loading Display Activity:', error));
  });
}

function setupDisputeButton(buttonContainer) {
  document.getElementById('disputeButton').addEventListener('click', async () => {
    console.log('Dispute button clicked');
    chrome.runtime.sendMessage({ action: 'checkDispute' }, function (response) {
      if (response.error) {
        document.getElementById('dispute-error').textContent = 'An error occurred. Please try again later.';
        document.getElementById('dispute-error').style.display = 'block';
      } else if (response && response.status) {
        loadDisputePopup(buttonContainer, response);
      } else {
        console.log('No dispute response');
      }
    });
  });
}

function loadDisputePopup(buttonContainer, response) {
  fetch('dispute_popup.html')
    .then(res => res.text())
    .then(html => {
      buttonContainer.innerHTML = html;
      document.getElementById('messageId').textContent = response.messageId;
      document.querySelector('.status').textContent = response.status;
      document.getElementById('emailId').textContent = response.emailId;
      document.getElementById('countRaise').textContent = response.countRaise;

      const statusElement = document.querySelector('.status');
      statusElement.classList.remove('safe', 'unsafe');
      statusElement.classList.add(response.status === 'Safe' ? 'safe' : 'unsafe');

      // Load the dispute popup script
      const script = document.createElement('script');
      script.src = 'dispute_popup.js';
      document.body.appendChild(script);
    })
    .catch(error => console.error('Error loading dispute form:', error));
}

function extractAndCreateTable(data) {
  const table = document.createElement('table');
  table.style.border = '1px solid black';
  table.style.width = '500px';
  table.style.height = '550px';

  const headerRow = table.insertRow();
  headerRow.insertCell().textContent = 'From';
  headerRow.insertCell().textContent = 'Timestamp';

  headerRow.cells[0].style.fontWeight = 'bold';
  headerRow.cells[0].style.textAlign = 'center';
  headerRow.cells[1].style.fontWeight = 'bold';
  headerRow.cells[1].style.textAlign = 'center';

  // Sort data by timestamp (descending)
  data.sort((a, b) => new Date(b[10]) - new Date(a[10]));

  data.forEach(row => {
    const tableRow = table.insertRow();
    const cell1 = tableRow.insertCell();
    const cell2 = tableRow.insertCell();

    const link = document.createElement('a');
    link.textContent = row[3];
    link.href = '#';
    cell1.appendChild(link);

    const timestamp = new Date(row[10]).toLocaleString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    cell2.textContent = timestamp;

    // Style table cells
    cell1.style.border = '1px solid black';
    cell2.style.border = '1px solid black';

    // Event Listener for each email link
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const messageId = row[6];
      chrome.runtime.sendMessage({ action: 'showEmail', id: messageId });
    });
  });

  document.body.appendChild(table);
}

function initializeDisplayActivityScript() {
  const script = document.createElement('script');
  script.src = 'displayActivity.js';
  document.body.appendChild(script);
}























// document.addEventListener('DOMContentLoaded', function() {
//   chrome.runtime.sendMessage({ action: 'checkEmailPage' }, function(response) {
//     const buttonContainer = document.querySelector('.button-container');
//     console.log("-----",response);
//     const resp = response

//     if (resp == 'Gmail' || resp == 'Outlook' || resp == 'OpendedGmail' || resp == 'OpenedOutlook' || resp == 'Yahoo' || resp == 'OpenedYahoo') {
//       console.log("It's a Email page");
//       chrome.storage.local.get('registration', (data) => {
//         if (chrome.runtime.lastError) {
//           console.error(chrome.runtime.lastError);
//           return;
//         }

//         if (!data.registration) {
//           buttonContainer.innerHTML = `
//             <p>Please register to access your phishing mails</p>
//             <button id="registerButton" type="button">Register</button>
//           `;
          
//           document.getElementById('registerButton').addEventListener('click', function() {
//             fetch('licenseRegistration.html')
//               .then(response => response.text())
//               .then(html => {
//                 buttonContainer.innerHTML = html;

//                 // Request the extension ID from the background script
//                 chrome.runtime.sendMessage({ action: 'getExtensiondata' }, function(response) {
//                   if (response && response.pluginId && response.browserInfo && response.ipAddress) {
//                     document.getElementById('pluginId').value = response.pluginId;
//                     document.getElementById('browser').value = response.browserInfo;
//                     document.getElementById('ipAddress').value = response.ipAddress;
//                   } else {
//                     console.error('Failed to get the extensionID and browserId');
//                   }
//                 });

//                 // Initialize the registration form logic
//                 const script = document.createElement('script');
//                 script.src = 'licenseRegistration.js';
//                 document.body.appendChild(script);
//               })
//               .catch(error => {
//                   console.error('Error loading registration form:', error);
//               });

//              // Send a message to set the popup to the registration page
//             //  chrome.runtime.sendMessage({ action: 'openRegistrationPage' }, function(response) {
//             //   if (response && response.success) {
//             //     // Update the popup content
//             //     chrome.action.setPopup({ popup: 'licenseRegistration.html' }, function() {
//             //       window.location.reload(); // Reload the popup to show the registration content
//             //     });
//             //   } else {
//             //     console.error('Failed to set registration popup');
//             //   }
//             // });
//           });
//         }else if (resp == "OpendedGmail" || resp == "OpenedOutlook" || resp == "OpenedYahoo") {
//           console.log("!!!!!!!!!!!!!!!!!!!", resp);

//           // Insert both buttons in a single innerHTML assignment
//           buttonContainer.innerHTML = `
//             <p>Click here to access all your phishing mails</p>
//             <button id="showSpamButton" type="button">Show Phishing mails</button>
//             <p>Click here for dispute</p>
//             <button id="disputeButton" type="button">Dispute</button>
//             <span id= "dispute-error" style = "color:red ; display: none;"></span>
//           `;
          
//           // Add event listener for "disputeButton"
//           document.getElementById("disputeButton").addEventListener('click', async () => {
//             console.log("Dispute button clicked");
//             // buttonContainer.innerHTML = "<p>Dispute button works!</p>";
//             await chrome.runtime.sendMessage({action:"checkDispute"},function(response){
//                    console.log("check dispute message send to background",response)
//                    if(response.error){
//                     document.getElementById("dispute-error").textContent = 'An error occurred. Please try again later.';
//                     document.getElementById("dispute-error").style.display = 'block';
//                    }
                    
//                    if (response && response.status){
//                       console.log("{{{{{{{{{{}}}}}}}}}}}}",response.messageId,response.status)
//                       fetch('dispute_popup.html')
//                       .then(response => response.text())
//                       .then(html => {
//                       buttonContainer.innerHTML = html;

//                       // Use textContent to set text for non-input elements like <span>
//                       document.getElementById('messageId').textContent = response.messageId;
//                       document.querySelector('.status').textContent = response.status;
//                       document.getElementById('emailId').textContent = response.emailId;
//                       document.getElementById('countRaise').textContent = response.countRaise;
                      

//                       // Also, update the class for status based on its value
//                       const statusElement = document.querySelector('.status');
//                       statusElement.classList.remove('safe', 'unsafe');
//                       if (response.status == "Safe") {
//                           statusElement.classList.add('safe');
//                       } 
//                       else if(response.status == "Unsafe"){
//                           statusElement.classList.add('unsafe');
//                       }
//                       else{
                        
//                       }

//                       // Initialize the registration form logic
//                       const script = document.createElement('script');
//                       script.src = 'dispute_popup.js';
//                       document.body.appendChild(script);
//                     })
//                     .catch(error => {
//                         console.error('Error loading registration form:', error);
//                     });
//                    }else{
//                     console.log(">>>>>>>>>>>>>>>>>>>>>>>no dispue response" )
//                    }
//             });
//             // fetch(dispute_popup.html)
//           });
          
//           // Add event listener for "showSpamButton"

//           document.getElementById("showSpamButton").addEventListener('click', () => {
//             console.log("Show spam button clicked");
//             fetch('displayActivity.html')
//                 .then(response => response.text())
//                 .then(html => {
//                     buttonContainer.innerHTML = html;
//                     initializeButtonListeners(); // Reinitialize listeners after loading new content
//                 })

//                 .catch(error => {
//                     console.error('Error loading Display Activity :', error);
//                 });
//                 // Initialize the registration form logic
//                 const scripts = document.createElement('script');
//                 scripts.src = 'displayActivity.js';
//                 document.body.appendChild(scripts);
//       });
        
//         // Function to initialize event listeners for newly added buttons
//         function initializeButtonListeners() {
//             // Example: If there is a button you want to add an event listener to
//             const newButton = buttonContainer.querySelector('.newButtonClass'); // Replace with your button class
//             if (newButton) {
//                 newButton.addEventListener('click', () => {
//                     // Handle the button click
//                     console.log("New button clicked");
//                 });
//             }
//         }
        



//           // document.getElementById("showSpamButton").addEventListener('click', () => {
//           //   // chrome.runtime.sendMessage({action:'displayAllSpams'},function(response){
//           //   // });
//           //   console.log("Show spam button clicked");
//           //             fetch('displayActivity.html')
//           //             .then(response => response.text())
//           //             .then(html => {
//           //             buttonContainer.innerHTML = html;
//           //           })
//           //           .catch(error => {
//           //               console.error('Error loading registration form:', error);
//           //         });

//           //         // Initialize the registration form logic
//           //       const scripts = document.createElement('script');
//           //       scripts.src = 'displayActivity.js';
//           //       document.body.appendChild(scripts);

//           // }); 
          
          
//         } else {
//           console.log("!!!!!!!!!!!!!!!!!!!    2222",resp)
//           buttonContainer.innerHTML = `
//             <p>Click here to access all your phishing mails</p>
//             <button id="showSpamButton" type="button">Show Phishing mails</button>
//           `;

//           document.getElementById("showSpamButton").addEventListener('click', () => {
//             // chrome.runtime.sendMessage({action:'displayAllSpams'},function(response){
//             // });
//             console.log("Show spam button clicked");
//                       fetch('displayActivity.html')
//                       .then(response => response.text())
//                       .then(html => {
//                       buttonContainer.innerHTML = html;
//                     })
//                     .catch(error => {
//                         console.error('Error loading registration form:', error);
//                   });

//                   // Initialize the registration form logic
//                 const scripts = document.createElement('script');
//                 scripts.src = 'displayActivity.js';
//                 document.body.appendChild(scripts);

//           });
//         }
//       });
//     } else {
//       console.log("It's not a Email page");
//       buttonContainer.innerHTML = `
//         <p>This is not a Email page.</p>
//       `;
//     }
//   });
// });






// // console.log('Popup script is running.');

// // chrome.runtime.sendMessage({ action: 'checkAndPerformAction' }, function() {
// //     console.log('Popup script received response:');
// // });


// // document.addEventListener('DOMContentLoaded', function () {
// //   console.log("loaded for button");
// //   document.getElementById('showSpamButton').addEventListener('click', () => {
// //       console.log("Show spam button clicked");
// //       chrome.runtime.sendMessage({action:'displayAllSpams'},function(response){
// //       });
// //   });
// // });



// chrome.runtime.onMessage.addListener((request,sender,sendResponse) =>{
//   if(request.action == 'spamTables'){
//     const buttonContainer = document.querySelector('.button-container');
//     const mail_service_list = document.querySelector("#email-services");
//     console.log('>>>>>>>>>>>>>>>>>>>',mail_service_list);

//     // Hide the button container
//     if (buttonContainer) {
//       buttonContainer.style.display = 'none';
//     }
//     if(mail_service_list){
//       mail_service_list.style.display = 'none';
//     }
//     const data = request.content ;
//     console.log("got sapm data from background" , data);
//      extractAndCreateTable(data);
//   }
// });


// function extractAndCreateTable(data) {
//   const table = document.createElement('table');
//   table.style.border = "1px solid black"; // Border for the entire table
//   table.style.width = "500px"; // Set the width of the table
//   table.style.height = "550px"; // Set the height of the table
//   // tableContainer.style.overflow = "auto"; // Enable scrolling if the content overflows

//   const headerRow = table.insertRow();
//   headerRow.insertCell().textContent = "From";
//   headerRow.insertCell().textContent = "Timestamp";

//   // Style the header cells for bold text AND centering
//   headerRow.cells[0].style.fontWeight = "bold"; 
//   headerRow.cells[0].style.textAlign = "center"; 
//   headerRow.cells[1].style.fontWeight = "bold"; 
//   headerRow.cells[1].style.textAlign = "center"; 

//   // Sort the data before creating table rows
//   data.sort((a, b) => {
//     return new Date(b[10]) - new Date(a[10]); // Descending order
//   });
 
//   data.forEach(row => {
//     const tableRow = table.insertRow();

//     const cell1 = tableRow.insertCell(); 
//     const cell2 = tableRow.insertCell();
  
//     // Make the text in the first column look like a link
//     const link = document.createElement('a');
//     link.textContent = row[3]; 
//     link.href = '#'; // Set href to '#' to make it look like a link
//     cell1.appendChild(link);

//     const timestamp = new Date(row[10]).toLocaleString('en-US', { 
//       weekday: 'short', 
//       day: '2-digit', 
//       month: 'short', 
//       year: 'numeric', 
//       hour: 'numeric', 
//       minute: 'numeric',
//       hour12: true // Use 12-hour format
//     });
//     cell2.textContent = timestamp;

//     // Add borders to each cell
//     cell1.style.border = "1px solid black";
//     cell2.style.border = "1px solid black";

//     // Event Listener
//     link.addEventListener('click', (event) => {
//       event.preventDefault(); // Prevent the default action of anchor link
//       messageId = row[6];
//       console.log("You clicked row data:", messageId); // Log the whole row data
//       chrome.runtime.sendMessage({ action: "showEmail", id: messageId }); // Send Message to background
//     });
//   });
//   document.body.appendChild(table);
// }



// const isGmailHomePage = function(url) {
//   const gmailInboxRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash|category\/(social|updates|forums|promotions))\/?[a-zA-Z0-9]*$/;
//   return !gmailInboxRegex.test(url);
// };

// const isGmailMailOpened = function(url) {
//   const gmailEmailRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash|category\/(social|updates|forums|promotions))\/[a-zA-Z0-9]+\/?$/;
//   return gmailEmailRegex.test(url);
// };

// const isGmailPage = function(url) {
//   return url.includes("https://mail.google.com/mail");
// };

// const isOutlookPage = function(url) {
//   return url.includes("https://outlook.live.com/mail");
// };

// const isYahooPage = function(url) {
//   return url.imcludes("https://mail.yahoo.com");
// };



























// console.log('Popup script is running.');

// chrome.runtime.sendMessage({ action: 'checkRegistration' }, function() {
//     console.log('Popup script received response:');
// });



// document.addEventListener('DOMContentLoaded', function () {
//   console.log("loaded for button");
//   document.getElementById('showSpamButton').addEventListener('click', () => {
//       console.log("Show spam button clicked");
//       chrome.runtime.sendMessage({action:'displayAllSpams'},function(response){
//       });
//   });
// });

// chrome.runtime.onMessage.addListener((request,sender,sendResponse) =>{
//   if(request.action == 'spamTables'){
//     const buttonContainer = document.querySelector('.button-container');
//     const mail_service_list = document.querySelector("#email-services");
//     console.log('>>>>>>>>>>>>>>>>>>>',mail_service_list);

//     // Hide the button container
//     if (buttonContainer) {
//       buttonContainer.style.display = 'none';
//     }
//     if(mail_service_list){
//       mail_service_list.style.display = 'none';
//     }
//     const data = request.content ;
//     console.log("got sapm data from background" , data);
//      extractAndCreateTable(data);
//   }
// });


// function extractAndCreateTable(data) {
//   const table = document.createElement('table');
//   table.style.border = "1px solid black"; // Border for the entire table
//   table.style.width = "500px"; // Set the width of the table
//   table.style.height = "550px"; // Set the height of the table
//   // tableContainer.style.overflow = "auto"; // Enable scrolling if the content overflows

//   const headerRow = table.insertRow();
//   headerRow.insertCell().textContent = "From";
//   headerRow.insertCell().textContent = "Timestamp";

//   // Style the header cells for bold text AND centering
//   headerRow.cells[0].style.fontWeight = "bold"; 
//   headerRow.cells[0].style.textAlign = "center"; 
//   headerRow.cells[1].style.fontWeight = "bold"; 
//   headerRow.cells[1].style.textAlign = "center"; 

//   // Sort the data before creating table rows
//   data.sort((a, b) => {
//     return new Date(b[10]) - new Date(a[10]); // Descending order
//   });
 
//   data.forEach(row => {
//     const tableRow = table.insertRow();

//     const cell1 = tableRow.insertCell(); 
//     const cell2 = tableRow.insertCell();
  
//     // Make the text in the first column look like a link
//     const link = document.createElement('a');
//     link.textContent = row[3]; 
//     link.href = '#'; // Set href to '#' to make it look like a link
//     cell1.appendChild(link);

//     const timestamp = new Date(row[10]).toLocaleString('en-US', { 
//       weekday: 'short', 
//       day: '2-digit', 
//       month: 'short', 
//       year: 'numeric', 
//       hour: 'numeric', 
//       minute: 'numeric',
//       hour12: true // Use 12-hour format
//     });
//     cell2.textContent = timestamp;

//     // Add borders to each cell
//     cell1.style.border = "1px solid black";
//     cell2.style.border = "1px solid black";

//     // Event Listener
//     link.addEventListener('click', (event) => {
//       event.preventDefault(); // Prevent the default action of anchor link
//       messageId = row[6];
//       console.log("You clicked row data:", messageId); // Log the whole row data
//       chrome.runtime.sendMessage({ action: "showEmail", id: messageId }); // Send Message to background
//     });
//   });
//   document.body.appendChild(table);
// }

  

//   let url;
  
//   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'scrapedData') {
//       console.log('Popup script received scraped data:', request.content);
  
//       // Process the data and update the popup's HTML
//       var scrapedData = request.content;
//       console.log('Popup script received content scraped message:');
  
//       // Get the final formatted data
//       var finalData = extractEmailsAndSnameFromJson(scrapedData);
  
//       // Update the content of the HTML element
//       document.getElementById("printOutput").innerHTML = finalData;
  
//       // Send the final data to the testing server
//       var userData = extractUserDataFromJson(scrapedData);
//       document.getElementById('userEmail').innerHTML = userData;
    
//   }
// });
  
// function extractUserDataFromJson(jsonData) {
//     var index01 = jsonData.indexOf('title');
//     index01 = jsonData.indexOf('-', index01);
//     var index02 = jsonData.indexOf('Gmail', index01);
//     var user_email = jsonData.substring(index01 + 2, index02 - 3);
  
//     var timestamp = new Date()
//     userData = `<strong>User ID: ${user_email} - Time of data extraction: ${timestamp}</strong>`;
  
//     return userData;
//   }
  
// function extractEmailsAndSnameFromJson(jsonData) {
//     var dataarray = jsonData.split("<tr class");
//     var vcount = 0;
//     var Record = 1;
  
//     var output = '<table style="border-collapse: collapse; width: 100%; max-width: 800px;">';
//     output += '<tr style="border-bottom: 1px solid #ddd; background-color: #f2f2f2;">' +
//       '<th style="width:2%; border-right: 1px solid #ddd;">No</th>' +
//       '<th style="width:29%; border-right: 1px solid #ddd;">Sender Email</th>' +
//       '<th style="width:18%; border-right: 1px solid #ddd;">Sender Name</th>' +
//       '<th style="width:28%; border-right: 1px solid #ddd;">Subject</th>' +
//       '<th style="width:15%; border-right: 1px solid #ddd;">Time</th>' +
//       '<th style="width:12%;">Message id</th>' +
//       '</tr>';
  
//     dataarray.forEach(function (emailElement) {
//       if (vcount <= 1) {
//         vcount += 1;
//         return;
//       } else {
//         var index01 = emailElement.indexOf('email=');
//          if(index01 == -1 || index01 == 0){
//            vcount += 1;
//         }else{
//         var index02 = emailElement.indexOf('name', index01);
//         var senderEmail = emailElement.substring(index01 + 7, index02 - 2);
//         index01 = index02;
//         index02 = emailElement.indexOf('\"', index01 + 8);
//         var senderName = emailElement.substring(index01 + 6, index02);
//         index01 = index02;
//         index01 = emailElement.indexOf('msg-', index01);
//         index02 = emailElement.indexOf('\"', index01);
//         var messageId = emailElement.substring(index01+2, index02);
//         index01 = emailElement.indexOf('data-legacy-thread-id', index02);
//         index01 = emailElement.indexOf('\">', index01);
//         index02 = emailElement.indexOf('</span>', index01 + 8);
//         var subject = emailElement.substring(index01 + 2, index02);
//         index01 = emailElement.indexOf('title', index02);
//         index02 = emailElement.indexOf('\"', index01 + 8);
//         var time = emailElement.substring(index01 + 7, index02);
//           if(time == "Has attachment" || time == "Inbox"){
//             index01 =  emailElement.indexOf('title', index02);
//             index02 = emailElement.indexOf('\"', index01 + 8);
//             time = emailElement.substring(index01 + 7, index02);
//             if(time == "Has attachment" || time == "Inbox"){
//               index01 =  emailElement.indexOf('title', index02);
//               index02 = emailElement.indexOf('\"', index01 + 8);
//               time = emailElement.substring(index01 + 7, index02);
//             }
//           }
          
//           output += `<tr style="border-bottom: 1px solid #ddd;">` +
//           `<td style="width:2%; border-right: 1px solid #ddd;">${Record}</td>` +
//           `<td style="width:29%; border-right: 1px solid #ddd;">${senderEmail}</td>` +
//           `<td style="width:18%; border-right: 1px solid #ddd;">${senderName}</td>` +
//           `<td style="width:28%; border-right: 1px solid #ddd;">${subject}</td>` +
//           `<td style="width:15%; border-right: 1px solid #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${time}</td>` +
//           `<td style="width:12%;">${messageId}</td>` +
//           '</tr>';
//           Record += 1;
//           vcount += 1;
//         }
//       }
//       });
  
//       output += '</table>';
//     return output;
//  }




