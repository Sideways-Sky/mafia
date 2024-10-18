import type { Game } from './index.ts'

export type Role = {
	name: string
	actions: ActionDef[]
	voteWeight?: number
	alignment?: Alignment
}
export type SRole = {
	// serialized role
	name: string
	actions: string[]
	alignment?: {
		name: string
		members: string[]
	}
}
export type RoleAndDistribution = {
	distribution: {
		min?: number
		max?: number
		percentage: number
		minPlayers?: number // Min players needed to be in game for this role to be considered
	}
} & Role
export type Action = {
	player: string
	index: number
	target: string
	target2?: string
}
export type Vote = {
	voter: string
	voted: string
}
export type ActionDef = {
	name: string
	run: (game: Game, action: Action) => void
	priority: number
	passive?: boolean
}
export type Alignment = {
	name: string
	hasWon: (game: Game) => boolean
	isSideWin?: boolean
	seeMembers?: boolean
}
