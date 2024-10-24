document.getElementById('licenseId').addEventListener('input', async function() {
    const licenseId = this.value.trim();    
    
    if (licenseId.length === 64) {
        console.log("Hitting backend for data'''''''")
        try {
            const response = await fetch('http://127.0.0.1:8000/plugin/verify-license/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ licenseId })
            });
            if (response.ok) {
                const data = await response.json();
                // document.getElementById('name').value = data.name;
                console.log(data)
                document.getElementById('email').value = data.data.email;
                // document.getElementById('mobile').value = data.mobile;
                // <!-- document.getElementById('ipAddress').value = data.ipAddress;
                // document.getElementById('deviceId').value = data.deviceId; -->

                document.getElementById('errorDisplay').textContent = '';
            } else {
                console.error('Failed to fetch data');
                document.getElementById('errorDisplay').textContent = 'License ID is not correct';
            }
        } catch (error) {
            console.error('Error:', error);   
            document.getElementById('errorDisplay').textContent = 'Error fetching data. Please try again later.';
        }
    }
});


document.getElementById('submit').addEventListener('click',async function() {   
    console.log("Hitting submit button")
    const licenseId = document.getElementById('licenseId').value;
    const pluginId = document.getElementById('pluginId').value;
    const name = document.getElementById('name').value 
    const email = document.getElementById('email').value 
    const mobile =document.getElementById('mobile').value 
    const ipAddress =document.getElementById('ipAddress').value 
    const browser =document.getElementById('browser').value 

    const errorDisplay = document.getElementById('errorDisplay');
    errorDisplay.textContent = '';  // Clear previous errors

     // Mobile number validation pattern (example: must be 10 digits)
     const mobilePattern = /^\d{10}$/;

     // Validate fields
     if (licenseId.length < 10) {
        errorDisplay.textContent = 'Invalid License ID';
        return;
    }
    if (!name ||  !mobile) {
        errorDisplay.textContent = 'Please fill in all the required fields';
        return;
    }
    if (!mobilePattern.test(mobile)) {
        errorDisplay.textContent = 'Invalid Mobile Number';
        return;
    }

        
        try {
            const response = await fetch('http://127.0.0.1:8000/plugin/register-plugin/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ licenseId, pluginId,name,email,mobile,ipAddress,browser})
            });
            
            if (response) {
                const data = await response.json();
                console.log('Server response:', data);
                alert('Form submitted successfully');
                // Store registration status with retries
            const storeRegistrationStatus = (retryCount = 3) => {
                chrome.storage.local.set({ registration: true }, function() {
                    if (chrome.runtime.lastError) {
                        console.error('Error storing registration status:', chrome.runtime.lastError);
                        if (retryCount > 0) {
                            console.log('Retrying to store registration status...');
                            storeRegistrationStatus(retryCount - 1);
                        } else {
                            alert('Failed to store registration status after multiple attempts.');
                        }
                    } else {
                        console.log('Registration status stored');
                        // Send a message to the background script to reload the page
                        chrome.runtime.sendMessage({ action: 'reloadPage' }, function(response) {
                            if (response.success) {
                                window.close(); // Close the popup
                            } else {
                                console.error('Failed to reload the page');
                            }
                        });
                    }
                });
            };

            storeRegistrationStatus();

            } else {
                console.error('Failed to submit form');
                alert('Failed to submit form');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error submitting form');
        }
});


document.getElementById('reset').addEventListener('click',function() {
    console.log("Hitting reset button")
    
    document.getElementById('licenseId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('mobile').value = '';
    
});