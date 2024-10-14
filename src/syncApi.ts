import { Api, defineApi, SyncState } from 'api-sync/server.js'

type User = {
	id: string
	username: string
	avatar?: string
}

const users = new SyncState<User[]>()

export const syncApi = {
	confirmJoin: (sessionId, user: User, channelId: string) => {
		console.log('Confirm Joined', user, channelId)
		users.update((prev) => {
			if (!prev) {
				return [user]
			}
			if (prev.find((u) => u.id === user.id)) {
				console.log('User already joined', user.username)
				return prev
			}
			return [...prev, user]
		}, channelId)
	},
	user: users
} satisfies Api

defineApi(syncApi)

export type SyncApi = typeof syncApi
