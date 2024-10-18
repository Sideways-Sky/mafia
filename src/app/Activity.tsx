import { useEffect } from 'react'
import { useDiscordSdk } from '../hooks/useDiscordSdk'
import { useApi } from './App'
import { cn } from './lib/utils'

export const Activity = () => {
	const { discordSdk, status, session } = useDiscordSdk()
	const api = useApi()
	const room = api.room.$.useSync(discordSdk.channelId!)
	const gameEvents = api.gameEvents.$.useSync(discordSdk.channelId!)
	const playerRole = api.playerRole.$.useSync(session?.user.id)

	useEffect(() => {
		if (!session || !discordSdk.channelId) {
			return
		}

		const user = room?.users.find((user) => user.id === session.user.id)
		if (!user) {
			api.confirmJoin(
				{
					id: session.user.id,
					username: session.user.username,
					avatar: session.user.avatar ?? undefined
				},
				discordSdk.channelId
			)
		}
	}, [session])

	return (
		<div className="m-0 flex min-h-screen min-w-80 flex-col place-items-center justify-center">
			<h3 className="my-4 font-bold">{discordSdk.channelId ? `#${discordSdk.channelId}` : status}</h3>
			<ul className="flex gap-4">
				{room?.users.map((user) => (
					<li key={user.id} className={cn('flex flex-col items-center gap-2 p-2', user.left && 'opacity-50')}>
						{user.avatar && (
							<img
								src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
								className="h-8 w-8 rounded-full"
							/>
						)}
						{user.username}
						{room?.gameStatus === 'in-progress-day' && (
							<button
								onClick={() => api.gameVote(user.id)}
								className={cn(
									'rounded-full bg-blue-500 px-2 py-1 text-white',
									user.id === session?.user.id && 'bg-red-500'
								)}
							>
								Vote
							</button>
						)}
						{room?.gameStatus === 'in-progress-night' &&
							playerRole?.actions.map((action, i) => (
								<button onClick={() => api.gameAction(user.id, i)} key={i} className="rounded-full px-2 py-1">
									{action}
								</button>
							))}
					</li>
				))}
			</ul>
			{room?.gameStatus === 'pending' && <button onClick={() => api.gameStart()}>Start Game</button>}
			<ul className="flex flex-col gap-4">{gameEvents?.map((event) => <li>{event}</li>)}</ul>
			{playerRole?.name}
		</div>
	)
}
