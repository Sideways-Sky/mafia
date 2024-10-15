import { DiscordContextProvider, useDiscordSdk } from '../hooks/useDiscordSdk'
import { Activity } from './Activity'
import './App.css'
import { useEffect } from 'react'
import { LoaderCircle } from 'lucide-react'
import { createApiClient } from 'api-sync/client.js'
import { SyncApi } from '../syncApi'

const { ApiContextProvider, useApi } = createApiClient<SyncApi>()
export { useApi }

function LoadingScreen({ description }: { description?: string }) {
	return (
		<div className="flex min-h-screen min-w-80 flex-col place-items-center justify-center">
			<img src="/rocket.png" className="my-4 h-24 duration-300 hover:drop-shadow-[0_0_2em_#646cff]" alt="Discord" />
			<h1 className="my-4 flex items-center gap-2 text-5xl font-bold">
				Loading...
				<LoaderCircle className="animate-spin" size={48} />
			</h1>
			<h3 className="my-4 font-bold">{description}</h3>
		</div>
	)
}

function WaitForEverything(props: { children: React.ReactNode; loadingScreen?: React.ReactNode }) {
	const { authenticated, discordSdk, session } = useDiscordSdk()

	if (!authenticated || !session || !discordSdk.channelId) {
		return <>{props.loadingScreen}</>
	}

	return <>{props.children}</>
}

export default function App() {
	useEffect(() => {
		const root = window.document.documentElement
		root.classList.remove('light', 'dark')
		const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
		root.classList.add(systemTheme)
	}, [])
	return (
		<DiscordContextProvider
			authenticate
			scope={['identify', 'guilds']}
			loadingScreen={<LoadingScreen description="Authenticating..." />}
		>
			<ApiContextProvider loadingScreen={<LoadingScreen description="Syncing..." />}>
				<WaitForEverything loadingScreen={<LoadingScreen description="Waiting for everything..." />}>
					<Activity />
				</WaitForEverything>
			</ApiContextProvider>
		</DiscordContextProvider>
	)
}
