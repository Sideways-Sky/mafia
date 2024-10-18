import { Api, SyncState } from 'api-sync/server.js'
import { Game } from './game'
import { ClassicRoles } from './game/roles'
import { Action, SRole, Vote } from './game/types'

type User = {
	id: string
	username: string
	avatar?: string
	left?: boolean
}
// client
const room = new SyncState<{
	users: User[]
	gameStatus: 'pending' | 'in-progress-day' | 'in-progress-night' | 'ended'
}>()
const gameEvents = new SyncState<string[]>()
const playerInfo = new SyncState<string[]>()
const playerRole = new SyncState<SRole>()
// server
const usersMap: Record<
	string, //sessionId
	{
		userId: string
		channelId: string
	}
> = {}
const games: Record<
	string, //channelId
	{
		game: Game
		votes: Vote[]
		actions: Action[]
	}
> = {}

// function gameStep(channelId: string) {
// 	const game = games[channelId]
// 	if (!game) return
// 	if (game.game.phase === 'day') {
// 		game.game.day(game.votes)
// 	} else {
// 		game.game.night(game.actions)
// 	}
// 	gameLoop(channelId)
// }

// function gameLoop(channelId: string) {
// 	setTimeout(() => gameStep(channelId), 1000 * 60) // 1 minute
// }

export const syncApi = {
	confirmJoin: (sessionId, user: User, channelId: string) => {
		usersMap[sessionId] = { userId: user.id, channelId }
		room.update((prev) => {
			if (!prev) {
				return { users: [user], gameStatus: 'pending' }
			}
			if (prev.users.find((u) => u.id === user.id)) {
				console.log('User already joined', user.username)
				return { ...prev, users: prev.users.map((u) => (u.id === user.id ? user : u)) }
			}
			return { ...prev, users: [...prev.users, user] }
		}, channelId)
	},
	gameStart: (sessionId) => {
		const { channelId } = usersMap[sessionId]
		const gameRoom = room.get(channelId)
		if (!gameRoom) return
		if (!gameRoom.users) {
			console.log('No users in channel to start game')
			return
		}
		if (gameRoom.gameStatus !== 'pending') {
			console.log('Game already started')
			return
		}

		games[channelId] = {
			game: new Game(
				gameRoom.users.map((u) => u.id),
				ClassicRoles,
				{
					playerAssignment: (player, role) => {
						console.log(player, 'is', role.name)
						playerRole.update((prev) => {
							if (!prev) {
								return role
							}
							return prev
						}, player)
					},
					voteResult: (result) => {
						console.log('Vote Result:', result)
						gameEvents.update((prev) => {
							if (!prev) {
								return [result]
							}
							return prev.concat(result)
						}, channelId)
						room.update((prev) => {
							return { ...prev!, gameStatus: 'in-progress-night' }
						}, channelId)
						games[channelId].votes = []
					},
					sendPlayerInfo: (player, info) => {
						console.log('Player Info;', player + ': ' + info)
						playerInfo.update((prev) => {
							if (!prev) {
								return [info]
							}
							return prev.concat(info)
						}, player)
					},
					nightResult: (result) => {
						console.log('Night Result:', result)
						gameEvents.update((prev) => {
							if (!prev) {
								return result
							}
							return prev.concat(result)
						}, channelId)
						room.update((prev) => {
							return { ...prev!, gameStatus: 'in-progress-day' }
						}, channelId)
						games[channelId].actions = []
					},
					end: (winners) => {
						console.log('Winners:', winners)
						gameEvents.update((prev) => {
							if (!prev) {
								return winners
							}
							return prev.concat(winners)
						}, channelId)
						room.update((prev) => {
							return { ...prev!, gameStatus: 'ended' }
						}, channelId)
						delete games[channelId]
					}
				}
			),
			votes: [],
			actions: []
		}

		room.set(
			{
				users: gameRoom.users,
				gameStatus: games[channelId].game.phase === 'day' ? 'in-progress-day' : 'in-progress-night'
			},
			channelId
		)

		// gameLoop(channelId)
	},
	gameVote: (sessionId, vote: string) => {
		const { channelId, userId } = usersMap[sessionId]
		const game = games[channelId]
		if (!game) {
			console.log('No game in channel to vote')
			return
		}
		if (game.game.phase !== 'day') {
			console.log('Game is not in day phase')
			return
		}
		const i = game.votes.findIndex((v) => v.voter === userId)
		if (i !== -1) {
			game.votes[i].voted = vote
			return
		}
		game.votes.push({ voter: userId, voted: vote })
		if (game.votes.length === Object.keys(game.game.players).length) {
			game.game.day(game.votes)
		}
	},
	gameAction: (sessionId, target: string, index: number) => {
		const { channelId, userId } = usersMap[sessionId]
		const game = games[channelId]
		if (!game) {
			console.log('No game in channel to vote')
			return
		}
		if (game.game.phase !== 'night') {
			console.log('Game is not in night phase')
			return
		}
		const i = game.actions.findIndex((v) => v.player === userId && v.index === index)
		if (i !== -1) {
			game.actions[i].target = target
			return
		}
		game.actions.push({ player: userId, target, index })
		if (game.actions.length === Object.keys(game.game.players).length) {
			game.game.night(game.actions)
		}
	},
	room,
	gameEvents,
	playerInfo,
	playerRole,
	internal: {
		onLeave(sessionId) {
			if (!usersMap[sessionId]) return
			const { channelId } = usersMap[sessionId]

			room.update((prev) => {
				if (!prev) {
					return
				}
				if (prev.gameStatus !== 'pending') {
					prev.users = prev.users.map((u) => (u.id === usersMap[sessionId].userId ? { ...u, left: true } : u))
				} else {
					prev.users = prev.users.filter((u) => u.id !== usersMap[sessionId].userId)
				}
				if (prev.users.filter((u) => !u.left).length < 1) {
					console.log('Last user left; deleting room')
					if (games[channelId]) {
						delete games[channelId]
					}
					return
				}

				return prev
			}, channelId)
			delete usersMap[sessionId]
		}
	}
} satisfies Api

export type SyncApi = typeof syncApi
