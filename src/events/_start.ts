// @ts-check
import { ready } from '@robojs/server'
import { SyncServer } from '../sync/server/server'
import { Client } from 'discord.js'
import { setDClient } from '../dClient'

export default async (client: Client) => {
	await ready()
	SyncServer.start()
	setDClient(client)
}
