import { Client } from 'discord.js'

export let dClient: Client
export const setDClient = (client: Client) => {
	dClient = client
}
