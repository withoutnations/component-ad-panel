import React from 'react';
import ReactDOM from 'react-dom';

/* global window: false */
/* global document: false */
export default class AdPanel extends React.Component {

  static get propTypes() {
    return {
      animated: React.PropTypes.bool,
      adTag: React.PropTypes.string,
      lazyLoad: React.PropTypes.bool,
      lazyLoadMargin: React.PropTypes.number,
      sizes: React.PropTypes.arrayOf(React.PropTypes.array),
      sizeMapping: React.PropTypes.arrayOf(React.PropTypes.array),
      targeting: React.PropTypes.arrayOf(
        React.PropTypes.arrayOf(
          React.PropTypes.string
        )
      ),
      reserveHeight: React.PropTypes.number,
      styled: React.PropTypes.bool,
      googletag: React.PropTypes.object,  // Testing hook
    };
  }

  static get defaultProps() {
    return {
      animated: true,
      lazyLoad: true,
      lazyLoadMargin: 350,
      sizes: [ [ 60, 60 ], [ 70, 70 ], [ 300, 250 ], [ 1024, 768 ] ],
      sizeMapping: [
        [[980, 200], [[1024, 768]]],
        [[0, 0], [[300, 250]]],
      ],
      targeting: [],
      styled: true,
    };
  }

  constructor(...args) {
    super(...args);
    this.loadElementWhenInView = this.loadElementWhenInView.bind(this);
  }

  componentWillMount() {
    this.setState({
      tagId: `googlead-${(Math.random() * 1e17) .toString(16)}`,
      adGenerated: false,
    });
  }

  componentDidMount() {
    if (this.state && this.state.tagId) {
      this.getOrCreateGoogleTag();
    }
    if (!this.props.lazyLoad && this.state && this.state.tagId && !this.state.adGenerated) {
      this.generateAd();
    }
    window.addEventListener('scroll', this.loadElementWhenInView);
    window.addEventListener('resize', this.loadElementWhenInView);
    this.loadElementWhenInView();
  }

  componentWillUnmount() {
    this.cleanupEventListeners();
  }

  getOrCreateGoogleTag() {
    /* global window document */
    if (this.props.googletag) {
      return this.props.googletag;
    } else if (typeof window !== 'undefined' && window.document &&
        !window.googletag) {
      window.googletag = { cmd: [] };
      const gads = document.createElement('script');
      gads.async = true;
      gads.type = 'text/javascript';
      const useSsl = window.location.protocol === 'https:';
      gads.src = `${useSsl ? 'https:' : 'http:'}//www.googletagservices.com/tag/js/gpt.js`;
      document.head.appendChild(gads);
      return window.googletag;
    } else if (typeof window !== 'undefined' && window.googletag) {
      return window.googletag;
    }
  }

  isElementInViewport(elm, margin = 0) {
    const rect = ReactDOM.findDOMNode(elm).getBoundingClientRect();
    return rect.bottom > -margin &&
      rect.right > -margin &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth) + margin &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight) + margin;
  }

  getContainerDOMElement() {
    return ReactDOM.findDOMNode(this.refs.container);
  }

  loadElementWhenInView() {
    const containerElement = this.refs.container;
    if (!this.state.adGenerated &&
        this.isElementInViewport(containerElement, this.props.lazyLoadMargin)) {
      this.generateAd();
    }
    if (this.isElementInViewport(containerElement) === true) {
      const targetContainerElement = this.getContainerDOMElement();
      targetContainerElement.className += ' ad-panel--visible';
      this.cleanupEventListeners();
    }
  }

  cleanupEventListeners() {
    window.removeEventListener('scroll', this.loadElementWhenInView);
    window.removeEventListener('resize', this.loadElementWhenInView);
  }

  buildSizeMapping() {
    let mapping = this.props.sizeMapping || [];
    const googleTag = this.getOrCreateGoogleTag();
    if (!googleTag.sizeMapping) {
      throw new Error('buildSizeMapping() must be called inside a googletag.cmd.push()\'ed function!');
    }
    const sizeMappingBuilder = googleTag.sizeMapping();
    return mapping.reduce((builder, [viewportSize, adSizes]) => {
      return builder.addSize(viewportSize, adSizes)
    }, sizeMappingBuilder).build();
  }

  generateAd() {
    this.setState({ adGenerated: true });
    const googleTag = this.getOrCreateGoogleTag();
    if (this.props.adTag) {
      googleTag.cmd.push(() => {
        const sizeMapping = this.buildSizeMapping();
        let slot = googleTag.defineSlot(
          this.props.adTag,
          this.props.sizes,
          this.state.tagId)
          .addService(googleTag.pubads())
          .defineSizeMapping(sizeMapping);

        for (const [ key, value ] of this.props.targeting) {
          slot.setTargeting(key, value)
        }
        googleTag.pubads().enableSingleRequest();
        googleTag.pubads().collapseEmptyDivs();
        googleTag.enableServices();
        googleTag.display(this.state.tagId);
      });
    } else {
      const adToHide = ReactDOM.findDOMNode(this.refs.container);
      adToHide.style.display = 'none';
    }
  }

  render() {
    let tag = [];
    if (this.state && this.state.tagId) {
      let adStyle = {};
      if (this.props.reserveHeight) {
        adStyle = { minHeight: this.props.reserveHeight };
      }
      tag = (<div className="ad-panel__googlead" id={this.state.tagId} style={adStyle}></div>);
    }
    let rootClassNames = [ 'ad-panel__container' ];
    let title = [];
    if (this.props.styled) {
      rootClassNames = rootClassNames.concat([ 'ad-panel__container--styled' ]);
      title = (<span ref="title" className="ad-panel__title">Advertisement</span>);
    }
    if (this.props.animated) {
      rootClassNames = rootClassNames.concat([ 'ad-panel__animated' ]);
    }
    const aria = {
      role: 'complementary',
      itemScope: 'https://schema.org/WPAdBlock',
    };
    return (
      <div ref="container" className={rootClassNames.join(' ')} {...aria}>
        {title}
        {tag}
      </div>
    );
  }
}
