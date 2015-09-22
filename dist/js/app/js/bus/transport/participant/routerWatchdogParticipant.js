var ozpIwc = ozpIwc || {};

/**
 * @module ozpIwc
 */

ozpIwc.RouterWatchdog = (function (ozpIwc) {
    /**
     * @class RouterWatchdog
     * @extends ozpIwc.transport.participant.Internal
     * @namespace ozpIwc
     */
    var RouterWatchdog = ozpIwc.util.extend(ozpIwc.transport.participant.Client, function (config) {
        ozpIwc.transport.participant.Client.apply(this, arguments);
        this.internal = true;

        /**
         * The type of the participant.
         * @property participantType
         * @type String
         */
        this.participantType = "routerWatchdog";

        /**
         * Frequency of heartbeats
         * @property heartbeatFrequency
         * @type Number
         * @defualt 10000
         */
        this.heartbeatFrequency = config.heartbeatFrequency || 10000;

        /**
         * Fired when connected to the router.
         * @event #connectedToRouter
         */
        this.on("connectedToRouter", this.setupWatches, this);

        var self = this;
        this.on("beforeunload", function () {
            self.leaveEventChannel();
        });
    });

    /**
     * Removes this participant from the $bus.multicast multicast group.
     *
     * @method leaveEventChannel
     */
    RouterWatchdog.prototype.leaveEventChannel = function () {
        // handle anything before leaving.
        if (this.router) {

            this.send({
                dst: "$bus.multicast",
                action: "disconnect",
                entity: {
                    address: this.address,
                    participantType: this.participantType,
                    namesResource: this.namesResource
                }
            });

            this.send({
                dst: "$bus.multicast",
                action: "disconnect",
                entity: {
                    address: this.router.selfId,
                    namesResource: "/router/" + this.router.selfId
                }
            });
            //TODO not implemented
            //this.router.unregisterMulticast(this, ["$bus.multicast"]);
            return true;
        } else {
            return false;
        }

    };
    /**
     * Sets up the watchdog for all participants connected to the router. Reports heartbeats based on
     * {{#crossLink "ozpIwc.RouterWatchdogParticipant/heartbeatFrequency:property"}}{{/crossLink}}
     * @method setupWatches
     */
    RouterWatchdog.prototype.setupWatches = function () {
        this.name = this.router.selfId;
        var self = this;
        var heartbeat = function () {
            var packets = [];
            var p = self.names().messageBuilder.set("/router/" + self.router.selfId, {
                contentType: "application/vnd.ozp-iwc-router-v1+json",
                entity: {
                    'address': self.router.selfId,
                    'participants': self.router.getParticipantCount(),
                    'time': ozpIwc.util.now()
                },
                respondOn: "none"
            });
            packets.push(p);

            for (var k in self.router.participants) {
                var participant = self.router.participants[k];
                participant.heartBeatStatus.time = ozpIwc.util.now();
                if (participant instanceof ozpIwc.transport.participant.Multicast) {
                    /*jshint loopfunc:true*/
                    participant.members.forEach(function (member) {
                        p = self.names().messageBuilder.set(participant.namesResource + "/" + member.address, {
                            'entity': member.heartBeatStatus,
                            'contentType': participant.heartBeatContentType,
                            'respondOn': "none"
                        });
                        packets.push(p);
                    });
                } else {

                    packets.push({
                        packet: participant.heartbeat(),
                        callback: undefined,
                        res: function () {},
                        rej: function () {}
                    });
                }
            }

            // Send all heartbeats at once
            self.names().bulkSend(packets);

        };

        /**
         * The timer for the heartBeat
         * @property timer
         * @type window.setInterval
         */
        this.timer = window.setInterval(heartbeat, this.heartbeatFrequency);
        heartbeat();
    };

    /**
     * Removes the watchdog.
     * @method shutdown
     */
    RouterWatchdog.prototype.shutdown = function () {
        window.clearInterval(this.timer);
    };

    return RouterWatchdog;
}(ozpIwc));
