/* Local reference behavior: never submit to the original company's backend. */
document.addEventListener('submit',function(event){
 event.preventDefault();event.stopImmediatePropagation();
 alert('Message delivery is not configured yet. Your enquiry has not been sent. Please try again once the contact service is connected.');
},true);
