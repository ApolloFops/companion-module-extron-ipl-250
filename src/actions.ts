import type ModuleInstance from './main.js'

export type ActionsSchema = {
	pulse_relay: {
		options: {
			port: number
			time: number
		}
	}
	set_relay: {
		options: {
			port: number
			value: boolean
		}
	}
	toggle_relay: {
		options: {
			port: number
		}
	}
	send_command: {
		options: {
			command: string
			line_ending: number
		}
	}
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		pulse_relay: {
			name: 'Pulse Relay',
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					default: 1,
					choices: [
						{ id: 1, label: 'Relay 1' },
						{ id: 2, label: 'Relay 2' },
						{ id: 3, label: 'Relay 3' },
						{ id: 4, label: 'Relay 4' },
					],
				},
				{
					id: 'time',
					type: 'number',
					label: 'Time',
					default: 0.5,
					min: 0.02,
					max: 1310.7,
					step: 0.02,
				},
			],
			callback: async (event) => {
				if (self.telnet) {
					self.telnet.send(`0${event.options.port}*3*${Math.round(event.options.time / 0.02)}O\n`)
				}
			},
		},
		set_relay: {
			name: 'Set Relay',
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					default: 1,
					choices: [
						{ id: 1, label: 'Relay 1' },
						{ id: 2, label: 'Relay 2' },
						{ id: 3, label: 'Relay 3' },
						{ id: 4, label: 'Relay 4' },
					],
				},
				{
					id: 'value',
					type: 'dropdown',
					label: 'Value',
					default: 0,
					choices: [
						{ id: 0, label: 'Off (Open)' },
						{ id: 1, label: 'On (Closed)' },
					],
				},
			],
			callback: async (event) => {
				if (self.telnet) {
					self.telnet.send(`0${event.options.port}*${event.options.value ? 1 : 0}O\n`)
				}
			},
		},
		toggle_relay: {
			name: 'Toggle Relay',
			options: [
				{
					id: 'port',
					type: 'dropdown',
					label: 'Port',
					default: 1,
					choices: [
						{ id: 1, label: 'Relay 1' },
						{ id: 2, label: 'Relay 2' },
						{ id: 3, label: 'Relay 3' },
						{ id: 4, label: 'Relay 4' },
					],
				},
			],
			callback: async (event) => {
				if (self.telnet) {
					self.telnet.send(`0${event.options.port}*2O\n`)
				}
			},
		},
		send_command: {
			name: 'Send Command',
			options: [
				{
					id: 'command',
					type: 'textinput',
					label: 'Command',
				},
				{
					id: 'line_ending',
					type: 'dropdown',
					label: 'Line Ending',
					default: 0,
					choices: [
						{ id: 0, label: 'Carriage Return (CR)' },
						{ id: 1, label: 'Line Feed (LF)' },
						{ id: 2, label: 'Carriage Return, Line Feed (CRLF)' },
					],
				},
			],
			callback: async (event) => {
				let command: string = event.options.command

				switch (event.options.line_ending) {
					case 0:
						command += '\r'
						break
					case 1:
						command += '\n'
						break
					case 2:
						command += '\r\n'
						break
				}

				if (self.telnet) {
					self.telnet.send(command)
				}
			},
		},
	})
}
