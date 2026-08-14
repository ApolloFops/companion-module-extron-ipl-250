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
	})
}
