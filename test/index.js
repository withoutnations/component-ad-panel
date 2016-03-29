/* globals window: false */
import 'babel-polyfill';
import AdPanel from '../src';
import React from 'react';
import chai from 'chai';
import chaiEnzyme from 'chai-enzyme';
import chaiSpies from 'chai-spies';
import { mount } from 'enzyme';
chai.use(chaiEnzyme()).use(chaiSpies).should();
function getSpyCall(spy, callNum = 0) {
  return spy.__spy.calls[callNum]; // eslint-disable-line id-match, no-underscore-dangle
}

function createFakeGoogleTag() {
  const slotApi = {
    addService: chai.spy(() => slotApi),
    defineSizeMapping: chai.spy(() => slotApi),
    setTargeting: chai.spy(() => slotApi),
  };
  const pubadsApi = {
    enableSingleRequest: chai.spy(() => null),
    collapseEmptyDivs: chai.spy(() => null),
    addEventListener: chai.spy(),
  };
  const mapping = {};
  const sizeMappingApi = {
    addSize: chai.spy(() => sizeMappingApi),
    build: chai.spy(() => mapping),
  };
  return {
    cmd: [],
    display: chai.spy(() => null),
    defineSlot: chai.spy(() => slotApi),
    pubads: chai.spy(() => pubadsApi),
    enableServices: chai.spy(),
    sizeMapping: chai.spy(() => sizeMappingApi),
  };
}

describe('AdPanel', () => {
  let googleTag = null;
  beforeEach(() => {
    googleTag = createFakeGoogleTag();
    AdPanel.prototype.getOrCreateGoogleTag = chai.spy(() => googleTag);
  });

  it('renders a React element', () => {
    React.isValidElement(<AdPanel />).should.equal(true);
  });

  describe('Rendering', () => {
    let rendered = null;
    beforeEach(() => {
      rendered = mount(<AdPanel />);
    });

    it('renders a top level empty div if state.adFailed=true', () => {
      rendered.setState({ adFailed: true });
      rendered.find('div').should.be.blank();
    });

    it('ad is generated once mounted', () => {
      rendered.setState({ tagId: true });
      rendered.should.have.state('adGenerated', true);
      googleTag.cmd.should.have.lengthOf(1)
        .and.have.property(0).that.is.a('function');
    });

    describe('after ad generation', () => {

      it('ad is generated once mounted', () => {
        rendered.setState({ tagId: true });
        rendered.should.have.state('adGenerated', true);
        googleTag.cmd.should.have.lengthOf(1)
          .and.have.property(0).that.is.a('function');
      });

    });

  });

  describe('lifecycle methods', () => {
    let instance = null;
    beforeEach(() => {
      instance = new AdPanel({ adTag: 'test-ad-tag' });
      instance.refs = {};
      instance.state = {};
      instance.generateAd = chai.spy('generateAd');
      instance.isElementInViewport = chai.spy('isElementInViewport');
    });

    describe('componentDidMount', () => {

      beforeEach(() => {
        // Remove actual loadElementWhenInView function
        instance.loadElementWhenInView = chai.spy('loadElementWhenInView');
      });

      it('calls generateAd', () => {
        instance.state = { tagId: true };
        instance.componentDidMount();
        instance.generateAd
          .should.have.been.called.exactly(1);
      });

      it('adds loadElementWhenInView() to scroll event listener', () => {
        chai.spy.on(window, 'addEventListener');

        instance.componentDidMount();

        window.addEventListener
          .should.have.been.called.with('scroll', instance.loadElementWhenInView);

        Reflect.deleteProperty(window, 'addEventListener');
      });

      it('adds loadElementWhenInView() to resize event listener', () => {
        chai.spy.on(window, 'addEventListener');

        instance.componentDidMount();

        window.addEventListener
          .should.have.been.called.with('resize', instance.loadElementWhenInView);

        Reflect.deleteProperty(window, 'addEventListener');
      });

      it('calls loadElementWhenInView', () => {
        chai.spy.on(instance, 'loadElementWhenInView');
        instance.componentDidMount();

        instance.loadElementWhenInView
          .should.have.been.called();
      });

    });

    describe('generateAd', () => {
      beforeEach(() => {
        // These tests actually want to call generateAd
        instance.generateAd = chai.spy(AdPanel.prototype.generateAd);
        instance.setState = chai.spy();
        instance.props.sizeMapping = [
          [ { width: 800, height: 600 }, [ [ 300, 250 ] ] ],
          [ [ 640, 480 ], [ ] ],
        ];
        instance.props.targeting = [
          [ 'foo', 'bar' ],
          [ 'baz', 'qux' ],
        ];
        googleTag = createFakeGoogleTag();
        AdPanel.prototype.getOrCreateGoogleTag = chai.spy(() => googleTag);
      });

      it('uses the googletag API to add sizes and targeting options', () => {
        instance.generateAd();
        instance.setState.should.have.been.called.with({ adGenerated: true });
        googleTag.cmd.should.have.lengthOf(1);
        googleTag.cmd.forEach((callback) => callback());
        const sizeMapping = googleTag.sizeMapping();
        sizeMapping.addSize.should.have.been.called.with([ 800, 600 ], [ [ 300, 250 ] ]);
        sizeMapping.build.should.have.been.called();
        const adSlot = googleTag.defineSlot();
        adSlot.defineSizeMapping.should.have.been.called.with(sizeMapping.build());
        adSlot.setTargeting.should.have.been.called.with('foo', 'bar');
        adSlot.setTargeting.should.have.been.called.with('baz', 'qux');
        const pubAds = googleTag.pubads();
        pubAds.enableSingleRequest.should.have.been.called();
        pubAds.collapseEmptyDivs.should.have.been.called();
      });

      describe('slotRenderEnded listener', () => {
        beforeEach(() => {
          instance.generateAd();
          googleTag.cmd.should.have.lengthOf(1);
          googleTag.cmd.forEach((callback) => callback());
          chai.spy.on(instance, 'unlistenSlotRenderEnded');
          chai.spy.on(instance, 'cleanupEventListeners');
        });

        it('is attached', () => {
          const pubAds = googleTag.pubads();
          pubAds.addEventListener.should.have.been.called(1).with('slotRenderEnded');
        });

        it('calls setState({ adFailed: true }) and cleanupEventListeners if it receives an event ' +
          'from DFP telling it that there is no ad for the zone', () => {
          const pubAds = googleTag.pubads();
          googleTag.cmd.should.have.lengthOf(1);
          googleTag.cmd.forEach((callback) => callback());
          pubAds.addEventListener.should.have.been.called.at.least(1);
          getSpyCall(pubAds.addEventListener, 0)[1]({ slot: instance.adSlot, isEmpty: true });
          instance.setState.should.have.been.called.with({ adFailed: true });
          instance.cleanupEventListeners.should.have.been.called();
        });

        it('only calls unlistenSlotRenderEnded if DFP tells it the ad is okay', () => {
          const pubAds = googleTag.pubads();
          pubAds.addEventListener.should.have.been.called();
          getSpyCall(pubAds.addEventListener, 0)[1]({ slot: instance.adSlot, isEmpty: false });
          instance.setState.should.not.have.been.called.with({ adFailed: true });
          instance.cleanupEventListeners.should.not.have.been.called();
          instance.unlistenSlotRenderEnded.should.have.been.called();
        });

        it('does nothing if the slot is wrong', () => {
          const pubAds = googleTag.pubads();
          pubAds.addEventListener.should.have.been.called.at.least(1);
          getSpyCall(pubAds.addEventListener, 0)[1]({ slot: { wrong: 'slot' }, isEmpty: false });
          instance.setState.should.not.have.been.called.with({ adFailed: true });
          instance.cleanupEventListeners.should.not.have.been.called();
          instance.unlistenSlotRenderEnded.should.not.have.been.called();
        });

        describe('unlistenSlotRenderEnded', () => {
          beforeEach(() => {
            instance.unlistenSlotRenderEnded();
          });

          it('disables the slotRenderEnded listener', () => {
            const pubAds = googleTag.pubads();
            pubAds.addEventListener.should.have.been.called.at.least(1);
            getSpyCall(pubAds.addEventListener, 0)[1]({ slot: instance.adSlot, isEmpty: false });
            instance.setState.should.not.have.been.called.with({ adFailed: true });
            instance.cleanupEventListeners.should.not.have.been.called();
          });

        });

      });
    });

    describe('cleanupEventListeners', () => {
      it('removes loadElementWhenInView() from the scroll event', () => {
        chai.spy.on(window, 'removeEventListener');

        instance.cleanupEventListeners();

        window.removeEventListener
          .should.have.been.called.with('scroll', instance.loadElementWhenInView);

        Reflect.deleteProperty(window, 'removeEventListener');
      });

      it('removes loadElementWhenInView() from resize event listener', () => {
        chai.spy.on(window, 'removeEventListener');

        instance.cleanupEventListeners();

        window.removeEventListener
          .should.have.been.called.exactly(2);
        window.removeEventListener
          .should.have.been.called.with('resize', instance.loadElementWhenInView);

        Reflect.deleteProperty(window, 'removeEventListener');
      });

    });

    describe('componentWillUnmount', () => {

      it('calls cleanupEventListeners', () => {
        chai.spy.on(instance, 'cleanupEventListeners');

        instance.componentWillUnmount();

        instance.cleanupEventListeners
          .should.have.been.called();
      });

    });

    describe('loadElementWhenInView', () => {

      beforeEach(() => {
        instance.isElementInViewport = chai.spy('isElementInViewport');
        instance.generateAd = chai.spy('generateAd');
        instance.cleanupEventListeners = chai.spy('cleanupEventListeners');
        instance.getContainerDomElement = chai.spy(() => ({ className: '' }));
      });

      it('calls isElementInViewport', () => {
        instance.refs.container = { fake: 'element' };
        instance.loadElementWhenInView();
        instance.isElementInViewport.should.have.been.called.with(instance.refs.container);
      });

      describe('When the component is not near the view at all', () => {

        beforeEach(() => {
          instance.isElementInViewport = () => false;
        });

        it('calls nothing', () => {
          instance.loadElementWhenInView();
          instance.generateAd.should.not.have.been.called();
          instance.cleanupEventListeners.should.not.have.been.called();
          instance.getContainerDomElement.should.not.have.been.called();
        });

      });

      describe('When the component is near the view, but not inside', () => {

        beforeEach(() => {
          instance.isElementInViewport = (...args) => {
            args.length.should.be.at.least(1).and.at.most(2);
            return args.length === 2;
          };
        });

        it('Doesn\'t call cleanupEventListeners, because we still need to listen to the scroll event', () => {
          instance.loadElementWhenInView();
          instance.cleanupEventListeners.should.not.have.been.called();
        });

        it('Calls generateAd()', () => {
          instance.loadElementWhenInView();
          instance.generateAd.should.have.been.called();
        });

        it('If the ad was already generated, calls nothing', () => {
          instance.state.adGenerated = true;
          instance.loadElementWhenInView();
          instance.generateAd.should.not.have.been.called();
        });

      });
      describe('When the component is inside the viewport', () => {
        let fakeElement = null;
        beforeEach(() => {
          instance.isElementInViewport = () => true;
          instance.getContainerDomElement = chai.spy(() => fakeElement);
          fakeElement = { className: '' };
        });

        it('Calls generateAd() and cleanupEventListeners()', () => {
          instance.loadElementWhenInView();
          instance.generateAd.should.have.been.called();
          instance.cleanupEventListeners.should.have.been.called();
        });

        it('Adds the ad-panel--visible class to the container element', () => {
          instance.loadElementWhenInView();
          instance.getContainerDomElement.should.have.been.called();
          fakeElement.className.should.equal(' ad-panel--visible');
        });

      });

    });

  });

});
