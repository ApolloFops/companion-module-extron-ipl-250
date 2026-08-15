import type ModuleInstance from './main.js'

export type VariablesSchema = {
	input1: boolean
	input2: boolean
	input3: boolean
	input4: boolean
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions({
		input1: { name: 'Contact Input 1' },
		input2: { name: 'Contact Input 2' },
		input3: { name: 'Contact Input 3' },
		input4: { name: 'Contact Input 4' },
	})
}
