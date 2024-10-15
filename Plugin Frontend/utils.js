// Define the utility functions as global functions attached to the window object

window.isGmailHomePage = function(url) {
    const gmailInboxRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash)\/[a-zA-Z0-9]+$/;
    return !gmailInboxRegex.test(url);
  };
  
  window.isGmailMailOpened = function(url) {
    const gmailEmailRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash)\/[a-zA-Z0-9]+\/?$/;
    return gmailEmailRegex.test(url);
  };
  
  window.isGmailPage = function(url) {
    return url.includes("https://mail.google.com/mail");
  };
  
  window.isOutlookPage = function(url) {
    return url.includes("https://outlook.live.com/mail");
  };
  


//  const isGmailHomePage = function(url) {
//     const gmailInboxRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash)\/[a-zA-Z0-9]+$/;
//     return !gmailInboxRegex.test(url);
//   };
  
//  const isGmailMailOpened = function(url) {
//     const gmailEmailRegex = /^https:\/\/mail\.google\.com\/mail\/u\/\d+\/#(inbox|starred|snoozed|sent|drafts|important|scheduled|all|spam|trash)\/[a-zA-Z0-9]+\/?$/;
//     return gmailEmailRegex.test(url);
//   };
  
//  const isGmailPage = function(url) {
//     return url.includes("https://mail.google.com/mail");
//   };
  
//  const isOutlookPage = function(url) {
//     return url.includes("https://outlook.live.com/mail");
//   };