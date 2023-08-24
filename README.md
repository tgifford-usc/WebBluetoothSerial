# WebBluetoothSerial
A web component for communicating with serial protocol over bluetooth between a web interface (for example on a mobile phone) and a bluetooth enabled microcontroller (such as a micro:bit)
Works on Windows and Android. Works on some Macintosh computers (those that support Bluetooth Low Energy).  **Does not work on iOS devices.**

This repository contains both the component itself (in the subdirectory components/SerialComponent) and an example of using it in a simple web interface, with a Connect/Disconnect button, a Textbox for sending messages to the microbit, and a texbox for receiving messages from the microbit.

The component also has a test interface, with this functionality. The example hides this test interface, but you can show the test interface by changing the display style of the custom-serial tag.
