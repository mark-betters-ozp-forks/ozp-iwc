var sibilant=sibilant || {};

/**
* @typedef sibilant.NetworkPacket
* @property {string} src_peer - The id of the peer who broadcast this packet.
* @property {string} sequence - A monotonically increasing, unique identifier for this packet.
* @property {object} data - The payload of this packet.
*/

/**
 * @event sibilant.Peer#receive
 * The peer has received a packet from other peers.
 * @property {sibilant.NetworkPacket} packet
 * @property {string} linkId
 */


/**
 * @event sibilant.Peer#preSend
 * A cancelable event that allows listeners to override the forwarding of 
 * a given packet to other peers.
 * @extends sibilant.CancelableEvent
 * @property {sibilant.NetworkPacket} packet
*/

/**
 * @event sibilant.Peer#send
 * Notifies that a packet is being sent to other peers.  Links should use this
 * event to forward packets to other peers. 
 * @property {sibilant.NetworkPacket} packet
 */

/**
 * @event sibilant.Peer#beforeShutdown
 * Fires when the peer is being explicitly or implicitly shut down.
 */

/**
 * The peer handles low-level broadcast communications between multiple browser contexts.
 * Links do the actual work of moving the packet to other browser contexts.  The links
 * call @{link sibilant.Peer#receive} when they need to deliver a packet to this peer and hook
 * the @{link event:sibilant.Peer#send} event in order to send packets.
 * @class
 */
sibilant.Peer=function() {
	
	// generate a random 4 byte id
	this.selfId=sibilant.util.generateId();
	
	// unique ids for all packets sent by this peer
	this.sequenceCounter=0;

	// track which packets are seen from each peer
	// key is the name of the peer
	// value is an array that contains the last 50 ids seen
	this.packetsSeen={};
	
	this.knownPeers={};
	
	this.events=new sibilant.Event();
	this.events.mixinOnOff(this);
		
	var self=this;
	
	// Shutdown handling
	this.unloadListener=function() {
		self.shutdown();
	};
	window.addEventListener('beforeunload',this.unloadListener);

};

/**
 * Helper to determine if we've seen this packet before
 * @param {sibilant.NetworkPacket} packet
 * @returns {boolean}
 */
sibilant.Peer.prototype.haveSeen=function(packet) {
	// don't forward our own packets
	if(packet.src_peer===this.selfId) {
		sibilant.metrics.counter('network.packets.droppedOwnPacket').inc();
		return true;
	}
	var seen=this.packetsSeen[packet.src_peer] || [];
	var id=packet.sequence;

	// abort if we've seen the packet before
	if(seen.indexOf(id) !== -1) {
		return true;
	}

	seen.push(id);
	this.packetsSeen[packet.src_peer]=seen;
	return false;
};

/**
 * Used by routers to broadcast a packet to network
 * @fires sibilant.Peer#preSend
 * @fires sibilant.Peer#send
 * @param {sibilant.NetworkPacket} packet
 */
sibilant.Peer.prototype.send= function(packet) {
	sibilant.metrics.counter('network.packets.sent').inc();
	var networkPacket={
			src_peer: this.selfId,
			sequence: this.sequenceCounter++,
			data: packet
	};
	// as long as none of the handers returned the boolean false, send it out
	var preSendEvent=new sibilant.CancelableEvent({'packet': networkPacket});

	this.events.trigger("preSend",preSendEvent);
	if(!preSendEvent.canceled) {
		this.events.trigger("send",{'packet':networkPacket});
	}
};

/**
 * Called by the links when a new packet is recieved.
 * @fires sibilant.Peer#receive
 * @param {string} linkId
 * @param {sibilant.NetworkPacket} packet
 * @returns {unresolved}
 */
sibilant.Peer.prototype.receive=function(linkId,packet) {
	// drop it if we've seen it before
	if(this.haveSeen(packet)) {
		sibilant.metrics.counter('network.packets.dropped').inc();
		return;
	}
	sibilant.metrics.counter('network.packets.received').inc();
	this.events.trigger("receive",{'packet':packet,'linkId': linkId});
};

 /**
	* Explicitly shuts down the peer.
	* @fires sibilant.Peer#send
	*/
sibilant.Peer.prototype.shutdown=function() {
	this.events.trigger("beforeShutdown");
	window.removeEventListener('beforeunload',unloadListener);
};

			