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
    disableInitialLoad: chai.spy(() => null),
    enableSingleRequest: chai.spy(() => null),
    collapseEmptyDivs: chai.spy(() => null),
    addEventListener: chai.spy(),
    setTargeting: chai.spy(() => null),
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
  const originalGetOrCreateGoogleTag = AdPanel.getOrCreateGoogleTag;
  beforeEach(() => {
    googleTag = createFakeGoogleTag();
    AdPanel.getOrCreateGoogleTag = chai.spy(() => googleTag);
  });
  afterEach(() => {
    AdPanel.config({ });
    AdPanel.getOrCreateGoogleTag = originalGetOrCreateGoogleTag;
  });

  it('renders a React element', () => {
    React.isValidElement(<AdPanel adTag="foo" />).should.equal(true);
  });

  describe('Rendering', () => {
    let rendered = null;
    beforeEach(() => {
      rendered = mount(<AdPanel adTag="foo" />);
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

      it('calls generateAd', () => {
        instance.state = { tagId: true };
        instance.componentDidMount();
        instance.generateAd
          .should.have.been.called.exactly(1);
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
      });

      it('disable initial loading to allow for incremental loading of ads', () => {
        AdPanel.config(
          {
            sra: true,
            targeting: {
              etear: 'etear',
              subscriber: 'subscriber',
            },
          }
        );
        googleTag.cmd.forEach((callback) => callback());
        const pubAds = googleTag.pubads();
        pubAds.disableInitialLoad.should.have.been.called();
        pubAds.enableSingleRequest.should.have.been.called();
      });

      it('uses the googletag API to add sizes and targeting options', () => {
        AdPanel.config(
          {
            sra: true,
            targeting: {
              etear: 'etear',
              subscriber: 'subscriber',
            },
          }
        );
        instance.generateAd();
        instance.setState.should.have.been.called.with({ adGenerated: true });
        googleTag.cmd.should.have.lengthOf(2);
        googleTag.cmd.forEach((callback) => callback());
        const sizeMapping = googleTag.sizeMapping();
        sizeMapping.addSize.should.have.been.called.with([ 800, 600 ], [ [ 300, 250 ] ]);
        sizeMapping.build.should.have.been.called();
        const adSlot = googleTag.defineSlot();
        adSlot.defineSizeMapping.should.have.been.called.with(sizeMapping.build());
        adSlot.setTargeting.should.have.been.called.with('foo', 'bar');
        adSlot.setTargeting.should.have.been.called.with('baz', 'qux');
        const pubAds = googleTag.pubads();
        pubAds.setTargeting.should.have.been.called.exactly(2);
        pubAds.enableSingleRequest.should.have.been.called();
        pubAds.collapseEmptyDivs.should.have.been.called();
      });

      it('binds props.onImpressionViewable to impressionViewable if available', () => {
        const onImpressionViewable = instance.props.onImpressionViewable = chai.spy();
        instance.generateAd();
        googleTag.cmd.should.have.lengthOf(1);
        googleTag.cmd.forEach((callback) => callback());
        googleTag.pubads().addEventListener
          .should.have.been.called.at.least(1)
          .with('impressionViewable', onImpressionViewable);
      });

      it('binds props.onSlotVisibilityChanged to slotVisibilityChanged if available', () => {
        const onSlotVisibilityChanged = instance.props.onSlotVisibilityChanged = chai.spy();
        instance.generateAd();
        googleTag.cmd.should.have.lengthOf(1);
        googleTag.cmd.forEach((callback) => callback());
        googleTag.pubads().addEventListener
          .should.have.been.called.at.least(1)
          .with('slotVisibilityChanged', onSlotVisibilityChanged);
      });

      describe('slotRenderEnded listener', () => {
        let pubAds = null;
        let slotRenderEndedEventListener = null;
        let slotData = null;
        beforeEach(() => {
          instance.generateAd();
          googleTag.cmd.should.have.lengthOf(1);
          googleTag.cmd.forEach((callback) => callback());
          pubAds = googleTag.pubads();
          googleTag.cmd.should.have.lengthOf(1);
          googleTag.cmd.forEach((callback) => callback());
          chai.spy.on(instance, 'unlistenSlotRenderEnded');
          chai.spy.on(instance, 'cleanupEventListeners');
          slotRenderEndedEventListener = getSpyCall(pubAds.addEventListener, 0)[1];
          slotData = { slot: instance.adSlot, isEmpty: false };
        });

        it('is attached', () => {
          pubAds.addEventListener.should.have.been.with('slotRenderEnded');
        });

        it('calls props.onSlotRenderEnded if available', () => {
          const onSlotRenderEnded = instance.props.onSlotRenderEnded = chai.spy();
          slotRenderEndedEventListener(slotData);
          onSlotRenderEnded.should.have.been.with(slotData);
        });

        it('calls setState({ adFailed: true }) and cleanupEventListeners if it receives an event ' +
          'from DFP telling it that there is no ad for the zone', () => {
          slotData.isEmpty = true;
          slotRenderEndedEventListener(slotData);
          instance.setState.should.have.been.called.with({ adFailed: true });
          instance.cleanupEventListeners.should.have.been.called();
        });

        it('only calls unlistenSlotRenderEnded if DFP tells it the ad is okay', () => {
          slotRenderEndedEventListener(slotData);
          instance.unlistenSlotRenderEnded.should.have.been.called();
        });

        it('does nothing if the slot is wrong', () => {
          slotData.slot = { wrong: 'slot' };
          slotRenderEndedEventListener(slotData);
          instance.setState.should.not.have.been.called.with({ adFailed: true });
          instance.cleanupEventListeners.should.not.have.been.called();
          instance.unlistenSlotRenderEnded.should.not.have.been.called();
        });

        describe('unlistenSlotRenderEnded', () => {
          beforeEach(() => {
            instance.unlistenSlotRenderEnded();
          });

          it('disables the slotRenderEnded listener', () => {
            slotRenderEndedEventListener(slotData);
            instance.setState.should.not.have.been.called.with({ adFailed: true });
            instance.cleanupEventListeners.should.not.have.been.called();
          });

        });

      });
    });

    describe('componentWillUpdate', () => {
      beforeEach(() => {
        instance.adSlot = 'this-has-already-loaded';
        instance.destroySlot = chai.spy();
        instance.defineSlot = chai.spy();
        instance.props.adTag = 'fake-ad-tag';
        instance.props.sizes = [ [ 42, 42 ] ];
      });
      it('calls defineSlot', () => {
        instance.componentWillUpdate({ adTag: 'new-ad-tag' });
        instance.componentWillUpdate({ sizes: [ [ 10, 10 ] ] });
        instance.defineSlot.should.have.been.called.twice();
      });
      it('calls nothing if an irrelevant prop changed', () => {
        instance.componentWillUpdate({ className: 'dont care about me' });
        instance.defineSlot.should.not.have.been.called();
      });
      it('calls nothing if the prop didn\'t exist before', () => {
        Reflect.deleteProperty(instance.props, 'adTag');
        instance.componentWillUpdate({ adTag: 'brand-new-tag!' });
        instance.defineSlot.should.not.have.been.called();
      });
      it('does nothing if there is no adSlot', () => {
        instance.adSlot = null;
        instance.componentWillUpdate({ adTag: 'ad-tag!' });
        instance.defineSlot.should.not.have.been.called();
      });
    });

    describe('componentWillUnmount', () => {
      let previousGoogleTag = null;
      before(() => {
        previousGoogleTag = window.googletag;
      });
      after(() => {
        if (previousGoogleTag !== null) {
          window.googletag = previousGoogleTag;
        }
      });

      it('calls cleanupEventListeners and destroySlot', () => {
        // Get through the if (typeof window.googletag !== 'undefined') check
        window.googletag = 'fake';
        instance.cleanupEventListeners = chai.spy();

        instance.destroySlot = chai.spy();

        instance.componentWillUnmount();

        instance.cleanupEventListeners
          .should.have.been.called();

        instance.destroySlot
          .should.have.been.called();
      });

    });

  });

});
