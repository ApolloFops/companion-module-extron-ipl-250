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

		this.updateStatus(InstanceStatus.Connecting)

		this.telnet.on('error', (err) => {
			console.error('Telnet Error:', err)

			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		})
		this.telnet.on('connect', () => {
			console.log('Connected!')

			this.updateStatus(InstanceStatus.Ok)

			if (this.telnet) {
				this.telnet.send('\x1B3CV\r')
			}
		})
		this.telnet.on('data', (data) => {
			console.log('Received:', data.toString())

			this.parseResponse(data.toString())
		})
		this.telnet.on('iac', (command, option) => console.log('IAC:', command, option))
		this.telnet.on('sb', (buffer) => console.log('Subnegotiation:', buffer))
	}

	private disconnect(): void {
		if (this.telnet) {
			this.telnet.removeAllListeners()
			this.telnet.destroy()
			this.telnet = null
		}

		this.updateStatus(InstanceStatus.Disconnected)
	}

	private parseResponse(response: string): void {
		// Input values
		const contactInputRegex: RegExp = /Cpn(\d) Sio(\d)\r\n/g
		const contactInputMatches = [...response.matchAll(contactInputRegex)]

		const contactInputValues = contactInputMatches.map((match) => [`input${parseInt(match[1])}`, match[2] === '1'])
		this.setVariableValues(Object.fromEntries(contactInputValues))
	}
}
