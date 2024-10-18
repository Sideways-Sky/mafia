import type { Action, Alignment, Role, RoleAndDistribution, SRole, Vote } from './types.ts'

export const AllPlayers = ['Ben', 'Dan', 'Eric']

type GameEvents = {
	playerAssignment: (player: string, role: SRole) => void
	voteResult: (result: string) => void
	nightResult: (result: string[]) => void
	sendPlayerInfo: (player: string, info: string) => void
	end: (winners: string[]) => void
}

export class Player {
	role: Role
	statuses: {
		name: string
		appliedOnRound: number
	}[]
	local?: object
	game: Game

	constructor(role: Role, game: Game) {
		this.game = game
		this.role = role
		this.statuses = []
	}

	public isDead(thisRound?: boolean) {
		if (thisRound) {
			return !!this.statuses.find((status) => status.name === 'Dead' && status.appliedOnRound === this.game.round)
		}
		return !!this.statuses.find((status) => status.name === 'Dead')
	}

	public kill() {
		this.statuses.push({ name: 'Dead', appliedOnRound: this.game.round })
	}
}

export class Game {
	players: Record<string, Player>
	alignments: Alignment[]
	round: number = 0
	phase: 'day' | 'night' = 'night'
	private events: GameEvents

	constructor(players: string[], roles: RoleAndDistribution[], events: GameEvents) {
		this.events = events
		this.players = this.createPlayersWithRoles(players, roles)
		this.alignments = this.getAlignments(roles)
	}

	private getAlignments(roles: Role[]) {
		const alignments: Alignment[] = []
		for (const role of roles) {
			if (role.alignment) {
				if (!alignments.find((alignment) => alignment.name === role.alignment!.name)) {
					alignments.push(role.alignment)
				}
			}
		}
		return alignments
	}

	private createPlayersWithRoles(allPlayers: string[], roles: RoleAndDistribution[]) {
		const NonAssignedPlayers = [...allPlayers]
		const AssignedPlayers: Record<string, Player> = {}

		const assignRandomPlayer = (Role: RoleAndDistribution) => {
			const player = NonAssignedPlayers.splice(Math.floor(Math.random() * NonAssignedPlayers.length), 1)[0]
			if (!player) return
			const { distribution: _, ...role } = Role
			AssignedPlayers[player] = new Player(role, this)
		}

		for (const i in roles) {
			if (roles[i].distribution.minPlayers && roles[i].distribution.minPlayers > allPlayers.length) {
				continue
			}
			let playersWithThisRole = 0
			//Min run
			if (roles[i].distribution.min) {
				while (playersWithThisRole < roles[i].distribution.min) {
					assignRandomPlayer(roles[i])
					playersWithThisRole += 1
				}
			}

			//Percentage run
			while (playersWithThisRole / allPlayers.length < roles[i].distribution.percentage) {
				assignRandomPlayer(roles[i])
				playersWithThisRole += 1
				if (roles[i].distribution.max && playersWithThisRole >= roles[i].distribution.max) {
					break
				}
			}
		}

		for (const i in NonAssignedPlayers) {
			console.log('Unassigned Player! :', NonAssignedPlayers[i])
		}
		for (const player in AssignedPlayers) {
			this.events.playerAssignment(player, {
				name: AssignedPlayers[player].role.name,
				actions: AssignedPlayers[player].role.actions.map((action) => action.name),
				alignment: AssignedPlayers[player].role.alignment
					? {
							name: AssignedPlayers[player].role.alignment.name,
							members: Object.keys(AssignedPlayers).filter(
								(m) => AssignedPlayers[m].role.alignment?.name === AssignedPlayers[player].role.alignment?.name
							)
						}
					: undefined
			})
		}

		return AssignedPlayers
	}

	private checkWin() {
		const wins: string[] = []
		let end = false
		this.alignments.forEach((alignment) => {
			if (alignment.hasWon(this)) {
				wins.push(alignment.name)
				if (!alignment.isSideWin) {
					end = true
				}
			}
		})

		if (end) {
			this.events.end(wins)
		}
	}

	public day(votes: Vote[]) {
		if (this.phase !== 'day') {
			return
		}
		votes = votes.filter((vote) => vote.voter in this.players && vote.voted in this.players)
		const votesTotals: Record<string, number> = {}

		votes.forEach((vote) => {
			const votes = this.players[vote.voter].role.voteWeight || 1
			if (votesTotals[vote.voted]) {
				votesTotals[vote.voted] += votes
			} else {
				votesTotals[vote.voted] = votes
			}
		})

		let ties: string[] = []
		const highestVoted = Object.keys(votesTotals).reduce((prev, curr) => {
			if (votesTotals[prev] > votesTotals[curr]) {
				ties = []
				return prev
			}
			if (votesTotals[prev] === votesTotals[curr]) {
				ties.push(prev)
			}
			return curr
		})

		if (ties.length > 0) {
			this.events.voteResult('Tied: ' + ties.concat(highestVoted).join(', '))
		} else {
			this.events.voteResult(highestVoted)

			this.players[highestVoted].kill()

			this.checkWin()
		}

		this.phase = 'night'
	}

	public night(actions: Action[]) {
		if (this.phase !== 'night') {
			return
		}
		for (const player in this.players) {
			this.players[player].role.actions.forEach((action, i) => {
				if (action.passive) {
					actions.push({ player, index: i, target: '' })
				}
			})
		}
		actions = actions
			.filter(
				(action) =>
					action.player in this.players &&
					(action.target in this.players || action.target === '') &&
					this.players[action.player].role.actions.length > action.index
			)
			.sort(
				(a, b) =>
					this.players[a.player].role.actions[a.index].priority - this.players[b.player].role.actions[b.index].priority
			)
		actions.forEach((action) => {
			this.players[action.player].role.actions[action.index].run(this, action)
		})

		const results: string[] = []

		for (const player in this.players) {
			this.players[player].statuses.forEach((status) => {
				if (status.appliedOnRound !== this.round) {
					return
				}
				results.push(player + ': ' + status.name)
			})
		}

		this.events.nightResult(results)

		this.checkWin()

		this.round++
		this.phase = 'day'
	}

	public sendInfo(player: string, info: string) {
		this.events.sendPlayerInfo(player, info)
	}
}
