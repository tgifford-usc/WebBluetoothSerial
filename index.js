// ---------- Serial Component API --------- //
const theSerialComponent = document.querySelector('custom-serial');

// Check whether bluetooth is connected
function bluetoothIsConnected() {
    if (theSerialComponent) {
      return theSerialComponent.isConnected();
    } else {
      return false;
    }
}

// Connecting and disconnecting (without having to press the connect button)
async function toggleBluetoothConnection() {
  if (theSerialComponent) {
    theSerialComponent.toggleConnection();
  }
}

// Explicitly connecting and disconnecting
async function openBluetoothConnection() {
  if (theSerialComponent) {
    theSerialComponent.openConnection();
  }
}

function closeBluetoothConnection() {
  if (theSerialComponent) {
    theSerialComponent.closeConnection();
  }
}


// Receiving messages in web interface from microbit. Replace console.log with your own handling code
if (theSerialComponent) {
  theSerialComponent.customHandler = function(message) {
    // do whatever you want with the 'message'
    console.log(message);  
  }
}

// Sending messages from web interface to microbit.
function sendStringToMicrobit(str) {
  const serialComponent = document.querySelector('custom-serial');
  if (serialComponent) {
    serialComponent.writeToSerial(`${str}\n`);
  }
}


// ----- put any additional javascript you need for your interface here ----- //

const connectButton = document.getElementById("connectButton");
connectButton.addEventListener('click', async (event) => {
  await toggleBluetoothConnection();
  if (bluetoothIsConnected()) {
    connectButton.innerHTML = "Disconnect";
  } else {
    connectButton.innerHTML = "Connect";
  }
});

