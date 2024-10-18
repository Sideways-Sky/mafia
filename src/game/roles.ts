import type { Alignment, RoleAndDistribution } from './types.ts'

export const Alignments = {
	Mafia: {
		name: 'Mafia',
		hasWon: (game) => {
			let VillagePlayerCount = 0
			let MafiaPlayerCount = 0
			for (const player in game.players) {
				if (game.players[player].isDead()) {
					continue
				}
				if (game.players[player].role.alignment?.name === 'Mafia') {
					MafiaPlayerCount++
				} else {
					VillagePlayerCount++
				}
			}

			return MafiaPlayerCount >= VillagePlayerCount
		}
	},
	Village: {
		name: 'Village',
		hasWon: (game) => {
			for (const player in game.players) {
				if (game.players[player].isDead()) {
					continue
				}
				if (game.players[player].role.alignment?.name === 'Mafia') {
					return false
				}
			}
			return true
		}
	}
} satisfies Record<string, Alignment>

export const ClassicRoles: RoleAndDistribution[] = [
	{
		name: 'Godfather',
		distribution: {
			min: 1,
			max: 1,
			percentage: 0
		},
		actions: [
			{
				priority: 1,
				name: 'Kill',
				run: (game, { target }) => {
					game.players[target].kill()
				}
			}
		],
		alignment: Alignments.Mafia
	},

	{
		name: 'Mafia',
		distribution: {
			minPlayers: 6,
			percentage: 0.1
		},
		alignment: Alignments.Mafia,
		actions: []
	},

	{
		name: 'Doctor',
		distribution: {
			min: 1,
			max: 2,
			percentage: 0.1
		},
		actions: [
			{
				priority: 2,
				name: 'Save',
				run: (game, { target }) => {
					const i = game.players[target].statuses.findIndex(
						(status) => status.name === 'Dead' && status.appliedOnRound === game.round
					)
					if (i !== -1) {
						game.players[target].statuses.splice(i, 1)
					}
				}
			}
		],
		alignment: Alignments.Village
	},

	{
		name: 'Detective',
		distribution: {
			min: 1,
			max: 1,
			percentage: 0
		},
		actions: [
			{
				priority: 100,
				name: 'Investigate',
				run: (game, { target, player }) => {
					game.sendInfo(player, "Target's alignment is " + game.players[target].role.alignment?.name || 'Village')
				}
			}
		],
		alignment: Alignments.Village
	},

	{
		name: 'Villager',
		distribution: {
			percentage: 1
		},
		alignment: Alignments.Village,
		actions: []
	}
]
export const ClassicRolesMap = {
	Godfather: ClassicRoles[0],
	Mafia: ClassicRoles[1],
	Doctor: ClassicRoles[2],
	Detective: ClassicRoles[3],
	Villager: ClassicRoles[4]
}
// type FramerLocal = { target: string; name: string; alignment?: Alignment }
// export const CrazyRoles: RoleAndDistribution[] = [
//   ...ClassicRoles,
//   {
//     name: "Vigilante",
//     distribution: {
//       min: 1,
//       percentage: 0,
//     },
//     alignment: Alignments.Village,
//     actions: [
//       {
//         priority: 4,
//         run: (allPlayers, { target, player }, round) => {
//           if (isDead(allPlayers[player])) {
//             return
//           }
//           kill(allPlayers[target], round)
//           if (allPlayers[target].role.alignment?.name === "Village") {
//             kill(allPlayers[player], round)
//           }
//         },
//       },
//     ],
//   },
//   {
//     name: "Mayor",
//     distribution: {
//       min: 1,
//       max: 1,
//       percentage: 0,
//     },
//     alignment: Alignments.Village,
//     actions: [
//       {
//         priority: 79,
//         run: (allPlayers, { player }, round) => {
//           allPlayers[player].statuses.push({ name: "Mayor", appliedOnRound: round })
//           allPlayers[player].role.voteWeight = 2
//         },
//       },
//     ],
//   },
//   {
//     name: "Framer",
//     distribution: {
//       min: 1,
//       max: 1,
//       percentage: 0,
//     },
//     alignment: Alignments.Mafia,
//     actions: [
//       {
//         priority: 90,
//         run: (allPlayers, { target, player }) => {
//           allPlayers[player].local = { target, name: allPlayers[target].role.name, alignment: allPlayers[target].role.alignment } as FramerLocal
//           allPlayers[target].role.name = "Mafia"
//           allPlayers[target].role.alignment = Alignments.Mafia
//         },
//       },
//       {
//         priority: 200,
//         passive: true,
//         run: (allPlayers, { player }) => {
//           const local = allPlayers[player].local as FramerLocal
//           if (!local || !local.target) return
//           allPlayers[local.target].role.name = local.name
//           allPlayers[local.target].role.alignment = local.alignment
//           delete allPlayers[player].local
//         },
//       },
//     ],
//   },
// ]
