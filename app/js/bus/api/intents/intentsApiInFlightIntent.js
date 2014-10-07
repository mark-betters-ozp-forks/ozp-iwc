/**
 * @submodule bus.api.Value
 */

/**
 * The capability value for an intent. adheres to the ozp-intents-type-capabilities-v1+json content type.
 * @class IntentsApiTypeValue
 * @namespace ozpIwc
 * @extends ozpIwc.CommonApiValue
 * @constructor
 *
 * @param {Object} config
 *@param {Object} config.entity
 * @param {String} config.entity.definitions the list of definitions in this intent capability.
 */
ozpIwc.IntentsApiInFlightIntent = ozpIwc.util.extend(ozpIwc.CommonApiValue, function (config) {
    config=config || {};
    config.contentType="application/vnd.ozp-iwc-intent-in-flight-v1+json";
    config.allowedContentTypes=[config.contentType];

    ozpIwc.CommonApiValue.apply(this, arguments);
    
    this.invokePacket=config.invokePacket,
    this.permissions=config.invokePacket.permissions;
    this.entity={
        'intent': {
            'type': config.type,
            'action': config.action,
        },
        'contentType' : config.contentType,
        'entity': config.entity,
        'state' : "new", // new, choosing, running, error, complete
        'status' : "ok", // noHandlerRegistered, noHandlerChosen
        'handlerChoices': config.handlerChoices || [],
        'handlerChosen': {
            'resource' : null, // e.g. "intents.api/text/plain/12345"
            'reason' : null // how the handler was chosen: "user", "pref", "onlyOne"
        },
        'handler': {
            'resource': null, // e.g. "names.api/address/45678"
            'address': null   // e.g. "45678"
        },
        'reply': {
            'contentType': null,
            'entity': null
        }

    };
});
