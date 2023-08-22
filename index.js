// ---------- Serial Component API --------- //

// In order to do custom message handling, uncomment this code, and replace console.log with your own handling code
const theSerialComponent = document.querySelector('custom-serial');
if (theSerialComponent) {
  theSerialComponent.customHandler = function(message) {
    // do whatever you want with the 'message'
    console.log(message);  
  }
}


// This will let you send a string from your web interface back to the microbit
// It adds a "newline" character at the end of the string, so that the microbit
// program can tell the command is complete
function sendStringToMicrobit(str) {
  const serialComponent = document.querySelector('custom-serial');
  if (serialComponent) {
    serialComponent.writeToSerial(`${str}\n`);
  }
}


// ----- put any additional javascript you need for your interface here ----- //



