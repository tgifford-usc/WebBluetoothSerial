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
async function openBluetoothConnection(microbitDevice) {
  if (theSerialComponent) {
    try {
      let connectionOpener = theSerialComponent.openConnection.bind(theSerialComponent);
      connectionOpener(microbitDevice);    
    } catch(error) {
      console.log(`Could not open Bluetooth connection: ${error}`);
    }
  }
}

function closeBluetoothConnection() {
  if (theSerialComponent) {
    try {
      let connectionCloser = theSerialComponent.closeConnection.bind(theSerialComponent);
      connectionCloser(microbitDevice);    
    } catch(error) {
      console.log(`Could not close Bluetooth connection: ${error}`);
    }
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


// ----- Example web interface with its own Connect/Disconnect toggle button ----- //
const connectButton = document.getElementById("connectButton");
connectButton.addEventListener('click', async (event) => {
  // check if bluetooth is connected. If so, close it. If not, open it.
  if (bluetoothIsConnected()) {
    closeBluetoothConnection();
  } else {
    console.log("Requesting Bluetooth Permission ...");
    let microbitDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "BBC micro:bit" }],
        optionalServices: [UART_SERVICE_UUID]
    });
    openBluetoothConnection(microbitDevice);
  }
  
  // check again whether bluetooth is now connected, and update the button accordingly
  if (bluetoothIsConnected()) {
    connectButton.innerHTML = "Disconnect";
  } else {
    connectButton.innerHTML = "Connect";
  }
});

