ozpIwc = ozpIwc || {};

ozpIwc.policyAuth = ozpIwc.policyAuth || {};

/**
 * The <Match> element SHALL identify a set of entities by matching attribute values in an <Attributes> element of the
 * request context with the embedded attribute value.
 *
 * The <Match> element is of MatchType complex type.
 *
 * @class Match
 * @namespace ozpIwc.policyAuth
 * @param config
 * @constructor
 */
ozpIwc.policyAuth.Match = ozpIwc.util.extend(ozpIwc.policyAuth.BaseElement,function(config) {

    /**
     * Specifies a matching function.  The value of this attribute MUST be of type xs:anyURI
     * @policy matchId
     * @type String
     * @default null
     */
    this.matchId = config.matchId;

    /**
     * Embedded attribute value
     * @policy attributeValue
     * @type *
     * @default null
     */
    this.attributeValue = config.attributeValue;

    /**
     * MAY be used to identify one or more attribute values in an <Attributes> element of the request context.
     * @policy attributeDesignator
     * @type *
     * @default null
     */
    this.attributeDesignator = config.attributeDesignator;

    /**
     * MAY be used to identify one or more attribute values in a <Content> element of the request context.
     * @policy attributeSelector
     * @type *
     * @default null
     */
    this.attributeSelector = config.attributeSelector;


});