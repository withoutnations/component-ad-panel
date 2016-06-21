/* global window: false */
/* global document: false */
import React from 'react';

function heightWidthPair(hwPair) {
  if (Array.isArray(hwPair) && hwPair.length === 0) {
    return hwPair;
  }
  if (
    typeof hwPair.width === 'number' &&
    typeof hwPair.height === 'number'
  ) {
    return [ hwPair.width, hwPair.height ];
  }
  if (
    typeof hwPair[0] === 'number' &&
    typeof hwPair[1] === 'number'
  ) {
    return hwPair;
  }
  throw new Error(`AdPanel: Invalid height/width pair ${ JSON.stringify(hwPair) }`);
}

function uniqueId() {
  const mathRandomToIntMultiplier = 1e17;
  const hex = 16;
  return (Math.random() * mathRandomToIntMultiplier).toString(hex);
}

let adPanelConfig = {};
const adDivs = [];
function displayAdsFn(googleTag) {
  if (!adDivs.length) {
    return;
  }
  googleTag.enableServices();
  adDivs.forEach((div) => {
    googleTag.display(div);
  });

  // Clean up
  adDivs.length = 0;
}

export default class AdPanel extends React.Component {
  static get defaultProps() {
    return {
      sizes: [],
      sizeMapping: [],
      targeting: [],
      styled: true,
    };
  }

  static config(options) {
    const googleTag = AdPanel.getOrCreateGoogleTag();
    adPanelConfig = options;

    googleTag.cmd.push(() => {
      const pubAds = googleTag.pubads();
      const targeting = adPanelConfig.targeting;
      // Set targeting
      pubAds.setTargeting('subs', targeting.subscriber);

      if (targeting.etear) {
        pubAds.setTargeting('etear', targeting.etear);
      }

      if (adPanelConfig.sra) {
        // enables Single Request Architecture (SRA)
        pubAds.enableSingleRequest();
      }

      // Collapses empty div elements on a page when there is no ad content to display.
      pubAds.collapseEmptyDivs();
    });
  }

  static displayAds() {
    const googleTag = AdPanel.getOrCreateGoogleTag();
    if (typeof googleTag.display === 'function') {
      displayAdsFn(googleTag);
    } else {
      googleTag.cmd.push(() => {
        displayAdsFn(googleTag);
      });
    }
  }

  static getOrCreateGoogleTag() {
    /* global window: false */
    if (typeof window === 'undefined' || typeof window.document === 'undefined') {
      return null;
    }
    if (window.googletag) {
      return window.googletag;
    }
    window.googletag = { cmd: [] };
    const gads = document.createElement('script');
    gads.async = true;
    gads.type = 'text/javascript';
    const useSsl = window.location.protocol === 'https:';
    gads.src = `${ useSsl ? 'https:' : 'http:' }//www.googletagservices.com/tag/js/gpt.js`;
    window.document.head.appendChild(gads);
    return window.googletag;
  }

  constructor(...args) {
    super(...args);
    this.unlistenSlotRenderEnded = () => null;
  }

  componentWillMount() {
    this.setState({
      tagId: `googlead-${ uniqueId() }`,
      adGenerated: false,
      adFailed: false,
    });
  }

  componentDidMount() {
    if (this.state && this.state.tagId) {
      this.generateAd();
    }
  }

  componentWillUpdate(nextProps) {
    if (this.adSlot) {
      /* eslint-disable arrow-body-style */
      const didChange = (prop) => {
        return (
          (prop in this.props) &&
          (prop in nextProps) &&
          JSON.stringify(this.props[prop]) !== JSON.stringify(nextProps[prop])
        );
      };
      /* eslint-enable arrow-body-style */
      const didAnyAdRelatedPropChange =
        didChange('adTag') ||
        didChange('targeting') ||
        didChange('sizes') ||
        didChange('sizeMapping');
      if (didAnyAdRelatedPropChange) {
        const googleTag = AdPanel.getOrCreateGoogleTag();
        this.destroySlot();
        this.defineSlot(googleTag);
      }
    }
  }

  componentWillUnmount() {
    this.cleanupEventListeners();
    this.destroySlot();
  }

  destroySlot() {
    // This is always synchronous.
    if (typeof window.googletag !== 'undefined' && this.adSlot) {
      window.googletag.destroySlots([ this.adSlot ]);
    }
    this.adSlot = null;
  }

  cleanupEventListeners() {
    this.unlistenSlotRenderEnded();
  }

  listenToSlotRenderEnded({ googleTag }) {
    if (!googleTag.pubads) {
      throw new Error('listenToSlotRenderEnded() must be called inside a googletag.cmd.push()\'ed function!');
    }
    if (!this.adSlot) {
      throw new Error('listenToSlotRenderEnded() must be called with this.adSlot available!');
    }

    const slot = this.adSlot;
    // the GPT API doesn't have a removeEventListener function
    let stopListening = false;
    googleTag.pubads().addEventListener('slotRenderEnded', (slotRenderEndedEvent) => {
      if (stopListening || slotRenderEndedEvent.slot !== slot) {
        return;
      }
      if (this.props.onSlotRenderEnded) {
        this.props.onSlotRenderEnded(slotRenderEndedEvent);
      }
      if (slotRenderEndedEvent.isEmpty) {
        this.setState({ adFailed: true });
        this.cleanupEventListeners();
        if (this.props.onFailure) {
          this.props.onFailure();
        }
        return;
      }
      this.unlistenSlotRenderEnded();
    });
    this.unlistenSlotRenderEnded = () => {
      stopListening = true;
      return null;
    };
  }

  buildSizeMapping() {
    const mapping = this.props.sizeMapping || [];
    const googleTag = AdPanel.getOrCreateGoogleTag();
    if (!googleTag.sizeMapping) {
      throw new Error('buildSizeMapping() must be called inside a googletag.cmd.push()\'ed function!');
    }
    const sizeMappingBuilder = googleTag.sizeMapping();
    return mapping.reduce((builder, [ viewportSize, adSizes ]) => (
      builder.addSize(heightWidthPair(viewportSize), adSizes.map(heightWidthPair))
    ), sizeMappingBuilder).build();
  }

  generateAd() {
    const googleTag = AdPanel.getOrCreateGoogleTag();
    if (typeof this.props.adTag === 'undefined') {
      return;
    }
    googleTag.cmd.push(() => {
      try {
        this.defineSlot(googleTag);
      } catch (errorFromDefineSlot) {
        // Google catches this and hides it from us
        if (typeof console !== 'undefined') {
          /* eslint-disable no-console */
          console.error(errorFromDefineSlot);
          /* eslint-enable no-console */
        }
      }
    });
    this.setState({ adGenerated: true });
  }

  defineSlot(googleTag) {
    const sizeMapping = this.buildSizeMapping();
    const { adTag, sizes } = this.props;
    const { tagId } = this.state;
    this.adSlot = googleTag.defineSlot(adTag, (sizes || []).map(heightWidthPair), tagId)
      .addService(googleTag.pubads())
      .defineSizeMapping(sizeMapping);
    for (const [ key, value ] of this.props.targeting) {
      this.adSlot.setTargeting(key, value);
    }
    const pubAds = googleTag.pubads();
    if (adPanelConfig.sra) {
      adDivs.push(tagId);
      if (typeof this.props.onSlotDefined === 'function') {
        this.props.onSlotDefined(tagId);
      }
    } else {
      googleTag.enableServices();
      googleTag.display(tagId);
    }

    this.listenToSlotRenderEnded({ googleTag });
    if (this.props.onImpressionViewable) {
      pubAds.addEventListener('impressionViewable', this.props.onImpressionViewable);
    }
    if (this.props.onSlotVisibilityChanged) {
      pubAds.addEventListener('slotVisibilityChanged', this.props.onSlotVisibilityChanged);
    }
  }

  render() {
    if (this.state && this.state.adFailed) {
      return (<div />);
    }
    let tag = [];
    if (this.state && this.state.tagId) {
      let adStyle = {};
      if (this.props.reserveHeight) {
        adStyle = { minHeight: this.props.reserveHeight };
      }
      tag = (
        <div
          className="ad-panel__googlead"
          id={this.state.tagId}
          style={adStyle}
          title="Advertisement"
        ></div>
      );
    }
    let rootClassNames = [ 'ad-panel__container' ];
    if (this.props.styled) {
      rootClassNames = rootClassNames.concat([ 'ad-panel__container--styled' ]);
    }
    if (this.props.block) {
      rootClassNames = rootClassNames.concat([ 'ad-panel__container--block' ]);
    }
    if (this.props.className) {
      rootClassNames = rootClassNames.concat([ this.props.className ]);
    }
    const aria = {
      role: 'complementary',
      itemScope: 'https://schema.org/WPAdBlock',
    };
    return (
      <div ref="container" className={rootClassNames.join(' ')} {...aria}>
        {tag}
      </div>
    );
  }
}

if (process.env.NODE_ENV !== 'production') {
  const sizeObject = React.PropTypes.oneOf(
    React.PropTypes.arrayOf(React.PropTypes.number),
    React.PropTypes.shape({
      width: React.PropTypes.number,
      height: React.PropTypes.number,
    })
  );
  AdPanel.propTypes = {
    adTag: React.PropTypes.string.isRequired,
    className: React.PropTypes.string,
    sizes: React.PropTypes.arrayOf(sizeObject),
    sizeMapping: React.PropTypes.arrayOf(
      React.PropTypes.arrayOf(
        sizeObject
      )
    ),
    onFailure: React.PropTypes.func,
    onSlotDefined: React.PropTypes.func,
    targeting: React.PropTypes.arrayOf(React.PropTypes.arrayOf(sizeObject)),
    reserveHeight: React.PropTypes.number,
    styled: React.PropTypes.bool,
    block: React.PropTypes.bool,
    onSlotRenderEnded: React.PropTypes.func,
    onSlotVisibilityChanged: React.PropTypes.func,
    onImpressionViewable: React.PropTypes.func,
  };
}
