const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-btn');
const phishingMailsBtn = document.getElementById('phishing-mails-btn');
const phishingSubmenu = document.getElementById('phishing-submenu');
const contentTitle = document.getElementById('main-title');
const dataOutput = document.getElementById('data-output');





// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'spamTables') {
//       const buttonContainer = document.querySelector('.button-container');
//       const mailServiceList = document.querySelector('#email-services');

//       // Hide containers if they exist
//       if (buttonContainer) buttonContainer.style.display = 'none';
//       if (mailServiceList) mailServiceList.style.display = 'none';

//       const data = request.data;
//       fetchedDataForActivity(data);
//     }
//   });


function fetchedDataForActivity(Dataentry){
    console.log(Dataentry);
}

// Dummy JSON data for different sections
const dummyData = {
    allMails: [
        {senderMail: 'john.doe@company.com', subject: 'Urgent: Account Verification Needed'},
        {senderMail: 'finance@service.com', subject: 'Payment Receipt - Please Review'},
        {senderMail: 'support@banking.com', subject: 'Account Suspended - Immediate Action Required'},
        {senderMail: 'hr@company.com', subject: 'Important: Employee Benefits Update'},
        {senderMail: 'newsletter@technews.com', subject: 'Monthly Tech Updates - October'},
        {senderMail: 'alerts@security.com', subject: 'Suspicious Login Detected on Your Account'},
        {senderMail: 'marketing@onlineshop.com', subject: 'Exclusive Offer: 50% Off on Selected Items'},
        {senderMail: 'contact@subscription.com', subject: 'Your Subscription is About to Expire'},
        {senderMail: 'noreply@bank.com', subject: 'Notice of Overdue Payment'},
        {senderMail: 'itadmin@company.com', subject: 'Action Required: Password Expiration Notice'},
        {senderMail: 'ceo@company.com', subject: 'Re: Upcoming Meeting with Board'},
        {senderMail: 'no-reply@freelanceplatform.com', subject: 'Project Approval Notification'},
        {senderMail: 'services@travelagency.com', subject: 'Flight Booking Confirmation'},
        {senderMail: 'support@isp.com', subject: 'Internet Outage Update'},
        {senderMail: 'news@dailyreport.com', subject: 'Today’s Headlines: Market Update'}
    ],
    withAdmin: [
        {senderMail: 'newsletter@technews.com', subject: 'Monthly Tech Updates - October'},
        {senderMail: 'alerts@security.com', subject: 'Suspicious Login Detected on Your Account'},
        {senderMail: 'marketing@onlineshop.com', subject: 'Exclusive Offer: 50% Off on Selected Items'},
        {senderMail: 'contact@subscription.com', subject: 'Your Subscription is About to Expire'},
        {senderMail: 'noreply@bank.com', subject: 'Notice of Overdue Payment'},
        {senderMail: 'itadmin@company.com', subject: 'Action Required: Password Expiration Notice'},
        {senderMail: 'ceo@company.com', subject: 'Re: Upcoming Meeting with Board'},
        {senderMail: 'no-reply@freelanceplatform.com', subject: 'Project Approval Notification'},
        {senderMail: 'services@travelagency.com', subject: 'Flight Booking Confirmation'},
        {senderMail: 'support@isp.com', subject: 'Internet Outage Update'},
    ],
    details: [{allocated_to: 'neeraj@ekvayu.com', allocated_date:"22/03/2024", allocated_till : "22/03/2025"}],
    activity: "No activity data available at the moment."
};

// Toggle Sidebar
toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');
});

// Toggle phishing mails submenu
phishingMailsBtn.addEventListener('click', function () {
    phishingSubmenu.style.display = phishingSubmenu.style.display === 'block' ? 'none' : 'block';
    activateButton(phishingMailsBtn);
});

// Update JSON Data in Output

// Update JSON Data in Output
// Update JSON Data in Output
function updateOutput(data, section) {
    let outputHTML = '';

    if (section === 'activity') {
        outputHTML = `<p style="font-size: 14px; margin: 5px 0;">${data}</p>`;
    } else if (section === 'allMails') {
        data.forEach(item => {
            outputHTML += `
                <div style="border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin: 5px 0; background-color: #fafafa;">
                    <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #007bff;">Sender:</strong> ${item.senderMail}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #007bff;">Subject:</strong> ${item.subject}</p>
                </div>
            `;
        });
    }
    else if (section === 'withAdmin') {
        data.forEach(item => {
            outputHTML += `
                <div style="border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin: 5px 0; background-color: #fafafa;">
                    <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #007bff;">Sender:</strong> ${item.senderMail}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #007bff;">Subject:</strong> ${item.subject}</p>
                </div>
            `;
        });
    }
    else if (section === 'details') {
        data.forEach(item => {
            outputHTML += `
                <div style="border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin: 5px 0; background-color: #fafafa;">
                    <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #007bff;">Allocated To:</strong> ${item.allocated_to}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #007bff;">Valid From:</strong> ${item.allocated_date}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #007bff;">Valid Till:</strong> ${item.allocated_till}</p>
                </div>
            `;
        });
    }
    else {
        data.forEach(item => {
            outputHTML += `<p style="font-size: 14px; margin: 5px 0;"><strong>ID:</strong> ${item.id} - <strong>Subject:</strong> ${item.subject} - <strong>Status:</strong> ${item.status}</p>`;
        });
    }
    dataOutput.innerHTML = outputHTML;
}


// function updateOutput(data, section) {
//     let outputHTML = '';
    
//     if (section === 'details' || section === 'activity') {
//         outputHTML = `<p>${data}</p>`;
//     } else {
//         data.forEach(item => {
//             outputHTML += `<p><strong>ID:</strong> ${item.id} - <strong>Subject:</strong> ${item.subject} - <strong>Status:</strong> ${item.status}</p>`;
//         });
//     }
//     dataOutput.innerHTML = outputHTML;
// }

// Activate button
function activateButton(button) {
    const activeButton = document.querySelector('.menu-item.active, .submenu-item.active');
    if (activeButton) {
        activeButton.classList.remove('active');
    }
    button.classList.add('active');
}

// Load initial data (All mails)
document.getElementById('all-mails').addEventListener('click', function () {
    contentTitle.innerText = 'Phishing mails (All)';
    updateOutput(dummyData.allMails, 'allMails');
    activateButton(this);
});

// Load "With Admin" data
document.getElementById('with-admin').addEventListener('click', function () {
    contentTitle.innerText = 'Phishing mails (With Admin)';
    updateOutput(dummyData.withAdmin, 'withAdmin');
    activateButton(this);
});

// Load Details
document.getElementById('details-btn').addEventListener('click', function () {
    contentTitle.innerText = 'Details';
    updateOutput(dummyData.details, 'details');
    activateButton(this);
});

// Load Activity
document.getElementById('activity-btn').addEventListener('click', function () {
    contentTitle.innerText = 'Activity';
    updateOutput(dummyData.activity, 'activity');
    activateButton(this);
});
