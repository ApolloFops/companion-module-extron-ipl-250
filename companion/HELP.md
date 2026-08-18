# Extron IPL 250

This module connects to the Extron IPL 250 IP Link Control Processor. For now, this module largely
just supports controlling the relay outputs and getting feedback from the contact inputs, but I'm
happy to add more functionality if requested (this is just all that we needed for my application,
and I don't really have a way to test/debug RS-232 or IR with the hardware I have).

## Configuration

- Enter the IP address for your Extron device in the module settings

## Actions

- **Set Relay** - Sets the relay at the selected port to the selected value.
- **Pulse Relay** - Pulses the relay at the selected port for the amount of time entered. This will
  toggle the relay twice, so if it starts off, it will go off->on->off, or if it starts on, it will
  go on->off->on.
- **Toggle Relay** - Toggles the relay at the selected port.
- **Send Command** - Allows for sending custom commands to the unit for functionality that isn't
  supported by the module. Some things, including commands that require an escape character in them,
  can not be used with this.

## Feedback

This module does not provide any feedback.

## Variables

- **input{1-4}** - Values from the contact inputs
