import { InstanceBase, InstanceStatus, TelnetHelper, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
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
		this.updateFeedbacks() // export feedbacks
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

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
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
				this.telnet.send('\x1B3CV\r')
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
		// Input values
		const contactInputRegex: RegExp = /Cpn(\d) Sio(\d)\r\n/g
		const contactInputMatches = [...response.matchAll(contactInputRegex)]

		const contactInputValues = contactInputMatches.map((match) => [`input${parseInt(match[1])}`, match[2] === '1'])
		this.setVariableValues(Object.fromEntries(contactInputValues))
	}
}
