/* Local reference behavior: never submit to the original company's backend. */
document.addEventListener('submit',function(event){
 event.preventDefault();event.stopImmediatePropagation();
 alert('Local reference copy: this form is a visual demonstration. No message was sent.');
},true);
