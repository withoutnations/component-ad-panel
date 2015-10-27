/* global window chai */
/* eslint-disable id-match */
import AdPanel from '..';
import React from 'react';

const addEventListener = window.addEventListener;
const removeEventListener = window.removeEventListener;
describe('AdPanel', () => {
  let instance = null;
  beforeEach(() => {
    instance = new AdPanel({});
    instance.refs = {};
    instance.state = {};
    instance.generateAd = chai.spy('generateAd');
    instance.showElementWhenInView = chai.spy('showElementWhenInView');
    if (typeof window !== 'undefined') {
      window.addEventListener = chai.spy('addEventListener', addEventListener);
      window.removeEventListener = chai.spy('removeEventListener', removeEventListener);
    }
  });

  describe('react component', () => {
    it('should exist', () => {
      AdPanel.should.be.a('function');
    });

    it('renders a component', () => {
      (<AdPanel/>).should.be.an('object');
    });

    it('is a react component', () => {
      (new AdPanel()).should.be.an.instanceOf(React.Component);
    });
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
    });

    it('adds loadElementWhenInView() to resize event listener', () => {
      chai.spy.on(window, 'addEventListener');

      instance.componentDidMount();

      window.addEventListener
        .should.have.been.called.with('resize', instance.loadElementWhenInView);
    });

    it('calls loadElementWhenInView', () => {
      chai.spy.on(instance, 'loadElementWhenInView');
      instance.componentDidMount();

      instance.loadElementWhenInView
        .should.have.been.called();
    });

  });

  describe('cleanupEventListeners', () => {
    it('removes loadElementWhenInView() from the scroll event', () => {
      chai.spy.on(window, 'removeEventListener');

      instance.cleanupEventListeners();

      window.removeEventListener
        .should.have.been.called.with('scroll', instance.loadElementWhenInView);
    });

    it('removes loadElementWhenInView() from resize event listener', () => {
      chai.spy.on(window, 'removeEventListener');

      instance.cleanupEventListeners();

      window.removeEventListener
        .should.have.been.called.exactly(2);
      window.removeEventListener
        .should.have.been.called.with('resize', instance.loadElementWhenInView);
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
    const originalFindDomNode = React.findDOMNode;
    beforeEach(() => {
      instance.isElementInViewport = chai.spy('isElementInViewport');
      instance.generateAd = chai.spy('generateAd');
      instance.cleanupEventListeners = chai.spy('cleanupEventListeners');
      React.findDOMNode = chai.spy('findDOMNode');
    });
    afterEach(() => {
      React.findDOMNode = originalFindDomNode;
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
        React.findDOMNode.should.not.have.been.called();
      });
    });
    describe('When the component is near the view, but not inside', () => {
      beforeEach(() => {
        instance.isElementInViewport = function () {
          if (arguments.length === 2) {
            // Called with margin
            return true;
          }
          if (arguments.length === 1) {
            return false;
          }
          false.should.equal(true);
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
        React.findDOMNode = chai.spy(() => fakeElement);
        fakeElement = { className: '' };
      });
      it('Calls generateAd() and cleanupEventListeners()', () => {
        instance.loadElementWhenInView();
        instance.generateAd.should.have.been.called();
        instance.cleanupEventListeners.should.have.been.called();
      });
      it('Adds the ad-panel--visible class to the container element', () => {
        instance.loadElementWhenInView();
        React.findDOMNode.should.have.been.called();
        fakeElement.className.should.equal(' ad-panel--visible');
      });
    });
  });

});
