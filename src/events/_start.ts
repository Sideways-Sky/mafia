import { SyncServer } from 'api-sync/server.js'
import { syncApi } from '../syncApi'

export default async () => {
	SyncServer.defineApi(syncApi)
}
