// bluetooth constants
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

// Allows the micro:bit to transmit a byte array
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

// Allows a connected client to send a byte array
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";


// This is our custom web component, which implements Serial port access over bluetooth
class CustomSerial extends HTMLElement {

    // A utility function for creating a new html element with given id and class
    static newElement(tag, id, clsName) {
        const elem = document.createElement(tag);
        elem.className = clsName;
        elem.id = id;
        return elem;
    }

    // A static function for sanitizing command strings to strip out newlines and carriage returns,
    // then add a single newline at the end.
    static sanitizeString(str) {
      return str.replace(/[\n\r]/g, "") + "\n";
    }

    constructor() {
        // Always call super first in constructor
        super();
        
        // class variables
        this.keepReading = true;
        this.delimiterChar = 0x0A;
        this.tokenBuffer = new Uint8Array();

        // get access to the DOM tree for this element
        const shadow = this.attachShadow({mode: 'open'});
        
        // Apply customMidi external stylesheet to the shadow dom
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'components/SerialComponent/SerialComponent.css');

        // Attach the created elements to the shadow dom
        shadow.appendChild(linkElem);

        // create a top level full width strip to hold the component
        this.mainStrip = CustomSerial.newElement('div', 'customSerialMainStrip', 'custom-serial main-strip');
        shadow.appendChild(this.mainStrip);

        // expand/collapse component
        this.titlePanel = CustomSerial.newElement('div', 'customSerialTitlePanel', 'title-panel-collapsed horizontal-panel');
        this.mainStrip.appendChild(this.titlePanel);

        this.expandCollapseButton = CustomSerial.newElement('button', 'customMidiExpandCollapseButton', 'expand-collapse-button collapsed');
        this.expandCollapseButton.innerHTML = "+";
        this.expandCollapseButton.addEventListener('click', (event) => {
            if (this.mainPanel.style.display === 'none') {
                this.mainPanel.style.display = 'flex';
                this.expandCollapseButton.innerHTML = "-";
                this.expandCollapseButton.classList.remove('collapsed');
                this.expandCollapseButton.classList.add('expanded');
                this.titlePanel.classList.remove('title-panel-collapsed');
                this.titlePanel.classList.add('title-panel-expanded');
            } else {
                this.mainPanel.style.display = 'none';
                this.expandCollapseButton.innerHTML = "+";
                this.expandCollapseButton.classList.remove('expanded');
                this.expandCollapseButton.classList.add('collapsed');
                this.titlePanel.classList.remove('title-panel-expanded');
                this.titlePanel.classList.add('title-panel-collapsed');
            }
        });
        this.titlePanel.appendChild(this.expandCollapseButton);

        this.mainLabel = CustomSerial.newElement('div', 'customSerialMainLabel', 'custom-serial-label');
        this.mainLabel.innerHTML = "Bluetooth";
        this.titlePanel.appendChild(this.mainLabel);


        // Create a top level panel
        this.mainPanel = CustomSerial.newElement('div', 'customSerialMainPanel', 'custom-serial main-panel horizontal-panel');
        this.mainPanel.style.display = 'none';
        this.mainStrip.appendChild(this.mainPanel);
        
        // ---------- Bluetooth connection ----------- //
        
        // Toggle button to connect/disconnect to paired devices
        this.btConnectButton = CustomSerial.newElement('button', 'customSerialBTConnectButton', 'port-toggle toggled-off');
        this.btConnectButton.innerHTML = "Connect";
        this.mainPanel.appendChild(this.btConnectButton);

        this.btConnectButton.addEventListener('click', async (event) => {
            if (!this.isConnected()) {            
                console.log("Requesting Bluetooth Permission ...");
                let microbitDevice = await navigator.bluetooth.requestDevice({
                    filters: [{ namePrefix: "BBC micro:bit" }],
                    optionalServices: [UART_SERVICE_UUID]
                });
                let connectionOpener = this.openConnection.bind(this);
                connectionOpener(microbitDevice);
            
            } else {
                let connectionCloser = this.closeConnection.bind(this);
                connectionCloser();
            }
        });
        
        // button and text box for sending arbitrary strings to the attached device
        this.sendPanel = CustomSerial.newElement('div', 'customSerialSendPanel', 'horizontal-panel custom-serial-panel');
        this.mainPanel.appendChild(this.sendPanel);
              
        this.sendSerialButton = CustomSerial.newElement('button', 'customSerialSendButton', 'serial-send-button');
        this.sendSerialButton.innerHTML = "Tx";
        this.sendPanel.appendChild(this.sendSerialButton);
        
        this.sendSerialTextBox = CustomSerial.newElement('input', 'customSerialSendTextBox', 'serial-send-textbox');
        this.sendSerialTextBox.type = 'text';
        this.sendSerialTextBox.value = 'Hello';
        this.sendPanel.appendChild(this.sendSerialTextBox);

        this.sendSerialButton.addEventListener('click', (event) => {
            this.sendStringViaBluetooth(this.sendSerialTextBox.value);
        });

        // Text area for receiving serial data, and button for forwarding to MIDI
        this.receivePanel = CustomSerial.newElement('div', 'customSerialReceivePanel', 'horizontal-panel custom-serial-panel');
        this.mainPanel.appendChild(this.receivePanel);
        
        this.receivePanelLabel = CustomSerial.newElement('div', 'customSerialReceiveLabel', 'custom-serial-label');
        this.receivePanelLabel.innerHTML = "Rx";
        this.receivePanel.appendChild(this.receivePanelLabel);

        this.serialReadoutElement = CustomSerial.newElement('div', 'customSerialReadout', 'custom-serial-readout');
        this.receivePanel.appendChild(this.serialReadoutElement);
    }


    // Bluetooth functions
    isConnected() {
        return (this.uBitBTDevice) ? true : false;
    }
    

    async toggleConnection(microbitDevice) {
        if (!this.isConnected()) {
            await this.openConnection(microbitDevice);
        } else {
            this.closeConnection();
        }
    }
    

    async openConnection(microbitDevice) {
        try {
            this.uBitBTDevice = microbitDevice;
            console.log("Connecting to GATT Server...");
            const server = await this.uBitBTDevice.gatt.connect();
        
            console.log("Getting Service...");
            const service = await server.getPrimaryService(UART_SERVICE_UUID);
        
            console.log("Getting Characteristics...");
            const txCharacteristic = await service.getCharacteristic(
                UART_TX_CHARACTERISTIC_UUID
            );
            txCharacteristic.startNotifications();
            txCharacteristic.addEventListener(
                "characteristicvaluechanged",
                this.onTxCharacteristicValueChanged.bind(this)
            );
            this.rxCharacteristic = await service.getCharacteristic(
                UART_RX_CHARACTERISTIC_UUID
            );
            
            // Successfully connected to Bluetooth, so change status of button
            this.btConnectButton.innerHTML = "Disconnect";
            this.btConnectButton.classList.remove('toggled-off');
            this.btConnectButton.classList.add('toggled-on');
            
        } catch (error) {
            this.uBitBTDevice = null;
            this.rxCharacteristic = null;
            console.log(error);
        }
    }


    closeConnection() {
        try {
            this.disconnectBluetooth();
            this.uBitBTDevice = null;
            this.rxCharacteristic = null;
            this.btConnectButton.innerHTML = "Connect";
            this.btConnectButton.classList.remove('toggled-on');
            this.btConnectButton.classList.add('toggled-off');
            
        } catch (e) {
            console.warn(`Error disconnecting from bluetooth: ${e}`);
        } 
    }
    

    disconnectBluetooth() {
        if (!this.uBitBTDevice) { return; }
      
        if (this.uBitBTDevice.gatt.connected) {
          this.uBitBTDevice.gatt.disconnect();
          console.log("Disconnected from Bluetooth");
        }
    }
        
    sendStringViaBluetooth(str) {
        if (this.uBitBTDevice && this.rxCharacteristic) {
            try {
                let encoder = new TextEncoder();
                this.rxCharacteristic.writeValue(encoder.encode(str + "\n"));
            } catch (error) {
                console.log(error);
            }
        }   
    }

    onTxCharacteristicValueChanged(event) {
        let receivedData = [];
        for (var i = 0; i < event.target.value.byteLength; i++) {
            receivedData[i] = event.target.value.getUint8(i);
        }
        const receivedString = String.fromCharCode.apply(null, receivedData);
        const val = receivedString.trim();
        this.dispatchMessage(val);
    }
    

    // Decode tokens as UTF8 strings and forward to message dispatcher
    handleToken = function(arr) {
        const stringValue = new TextDecoder().decode(arr);
        const val = stringValue.trim();
        this.dispatchMessage(val);
    }


    dispatchMessage = function(val) {
        if (this.customHandler) {
            this.customHandler(val);
        }
        
        if (this.serialReadoutElement) {
            this.serialReadoutElement.innerHTML = val;
        }
    }


    expandTokenBuffer(arr) {
        let expandedBuffer = new Uint8Array(this.tokenBuffer.length + arr.length);
        expandedBuffer.set(this.tokenBuffer);
        expandedBuffer.set(arr, this.tokenBuffer.length);
        this.tokenBuffer = expandedBuffer;
    }
    
  
    serialInputProcessor(arr) {
        if (arr && arr.length) {            
            let ind = arr.indexOf(this.delimiterChar);
            if (ind >= 0) {
                if (ind > 0) {
                    let part = arr.slice(0, ind);
                    this.expandTokenBuffer(part);
                }    
                try {
                    this.handleToken(this.tokenBuffer);
                } catch(e) {
                    console.log(`Malformed token ${this.tokenBuffer}: ${e}`);
                }
                this.tokenBuffer = new Uint8Array(); 
                this.serialInputProcessor(arr.subarray(ind+1));
            } else {
                this.expandTokenBuffer(arr);
            }
        }
    }
    
    
    async readSerialInput() {
        while (this.connectedPort.readable && this.keepReading) {
            this.reader = this.connectedPort.readable.getReader();
            try {
              while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                  // reader has been canceled.
                  break;
                }
                if (this.logFileWriter) {
                    const stringValue = new TextDecoder().decode(value);
                    this.logFileWriter.write(stringValue);
                }        
                this.serialInputProcessor(value);
              }
            } catch (error) {
              console.warn(`Error parsing serial input: ${error}`);
            } finally {
              this.reader.releaseLock();
            }
        }
    
        await this.connectedPort.close();
    }
    
    
    // write data to the serial port
    async writeToSerial(str) {
        if (this.connectedPort) {
            const arr = new TextEncoder().encode(str);
            const writer = this.connectedPort.writable.getWriter();
            await writer.write(arr);
    
            // Allow the serial port to be closed later.
            writer.releaseLock();
        }
    }

}

customElements.define('custom-serial', CustomSerial);
