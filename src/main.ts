import { InstanceBase, InstanceStatus, TelnetHelper, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdatePresets } from './presets.js'

const partNumber = '60-1026-81'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: Record<string, never>
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()
	telnet: TelnetHelper | null = null
	heartbeat: ReturnType<typeof setTimeout> | undefined = undefined
	reconnectTimeout: ReturnType<typeof setTimeout> | undefined = undefined

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		this.updateStatus(InstanceStatus.Ok)

		this.updateActions() // export actions
		this.updatePresets() // export Presets
		this.updateVariableDefinitions() // export variable definitions

		this.updateStatus(InstanceStatus.Connecting)
		this.initConnection()
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		this.disconnect()
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config

		this.disconnect()
		this.updateStatus(InstanceStatus.Connecting)
		this.initConnection()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	private initConnection(): void {
		this.telnet = new TelnetHelper(this.config.host, this.config.port)

		this.telnet.on('connect', () => {
			this.log('info', 'Connected!')

			this.updateStatus(InstanceStatus.Ok)

			if (this.telnet) {
				// Set interface to verbose mode
				this.telnet.send('\x1B3CV\r')

				// Ask for the model number
				// This allows us to validate that the user has connected to the right device
				this.telnet.send('N\n')

				// Query all the contact inputs
				this.telnet.send('1]2]3]4]\n')
			}

			this.setupHeartbeat()
		})

		this.telnet.on('data', (data) => {
			this.log('debug', `Received: ${data.toString()}`)

			this.parseResponse(data.toString())
		})

		this.telnet.on('error', (err) => {
			this.log('error', `Telnet Error: ${err}`)

			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)

			this.disconnect()
			this.scheduleReconnect()
		})

		this.telnet.on('end', () => {
			this.log('warn', 'Connection closed')

			this.updateStatus(InstanceStatus.Disconnected)

			this.disconnect()
			this.scheduleReconnect()
		})
	}

	private disconnect(): void {
		clearInterval(this.heartbeat)

		if (this.telnet) {
			this.telnet.removeAllListeners()
			this.telnet.destroy()
			this.telnet = null
		}
	}

	private setupHeartbeat() {
		// Heartbeat to keep connection alive
		clearInterval(this.heartbeat)

		this.heartbeat = setInterval(() => {
			this.telnet?.send('N\n') // Should respond with model number
		}, 10000)
	}

	private scheduleReconnect(): void {
		clearTimeout(this.reconnectTimeout)

		this.reconnectTimeout = setTimeout(() => {
			this.log('info', 'Attempting to reconnect...')
			this.initConnection()
		}, 5000)
	}

	private parseResponse(response: string): void {
		// Part number
		const partNumberRegex: RegExp = /Pno([^\r\n]+)\r\n/g
		const partNumberMatches = partNumberRegex.exec(response)

		if (partNumberMatches) {
			if (partNumberMatches[1] != partNumber) {
				this.log('warn', 'Part number does not match!')
				this.updateStatus(
					InstanceStatus.ConnectionFailure,
					'Part number does not match! Are you connecting to the correct device?',
				)

				this.disconnect()
				this.scheduleReconnect()
			}
		}

		// Input values
		const contactInputRegex: RegExp = /Cpn(\d) Sio(\d)\r\n/g
		const contactInputMatches = [...response.matchAll(contactInputRegex)]

		const contactInputValues = contactInputMatches.map((match) => [`input${parseInt(match[1])}`, match[2] === '1'])
		this.setVariableValues(Object.fromEntries(contactInputValues))
	}
}
