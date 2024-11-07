module.exports = {
	BROADCAST_EVAL: 0,
	BROADCAST_EVAL_RESULT: 1,
	BROADCAST_EVENT: 2,
	FETCH_CLIENT_VALUE: 3,
	SHARD_READY: 4,
	PERFORMANCE_METRICS: 5,
	LOG: 6,
	HEARTBEAT: 7,
	HEARTBEAT_ACK: 8,
	REGISTER_COMMANDS: 9,
	
	SHUTDOWN: 99,

	// IPC error codes
	IPC_UNKNOWN_TYPE: 100,
	IPC_INVALID_PAYLOAD: 101,
	IPC_UNKNOWN_REQUEST_ID: 102,
	IPC_UNKNOWN_ERROR: 199,

	// Hot reload detection
	HOT_RELOAD: 200,
	// type and file are defined in the data object
	// rename is a combination of delete and create
}