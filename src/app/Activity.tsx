import { useEffect } from 'react'
import { useDiscordSdk } from '../hooks/useDiscordSdk'
import { useApi } from './App'

export const Activity = () => {
	const { authenticated, discordSdk, status, session } = useDiscordSdk()
	const api = useApi()
	const users = api.user.$.useSync(discordSdk.channelId!)

	useEffect(() => {
		if (!authenticated || !session || !discordSdk.channelId) {
			return
		}

		const SyncUser = users?.find((user) => user.id === session.user.id)
		if (!SyncUser) {
			api.confirmJoin(
				{
					id: session.user.id,
					username: session.user.username,
					avatar: session.user.avatar ?? undefined
				},
				discordSdk.channelId
			)
		}
	}, [authenticated, session, users])

	return (
		<div className="m-0 flex min-h-screen min-w-80 flex-col place-items-center justify-center">
			<img src="/rocket.png" className="my-4 h-24 duration-300 hover:drop-shadow-[0_0_2em_#646cff]" alt="Discord" />
			<h1 className="my-4 text-5xl font-bold">Hello, World</h1>
			<h3 className="my-4 font-bold">{discordSdk.channelId ? `#${discordSdk.channelId}` : status}</h3>
			<ul className="flex gap-4">
				{users?.map((user) => (
					<li key={user.id} className="flex flex-col items-center gap-2 p-2">
						{user.avatar && (
							<img
								src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
								className="h-8 w-8 rounded-full"
							/>
						)}
						{user.username}
					</li>
				))}
			</ul>
			<small className="my-4">
				Powered by <strong>Robo.js</strong>
			</small>
		</div>
	)
}
