import AdPanel from '..';
import React from 'react';

describe('AdPanel', () => {

  it('should exist', () => {
    AdPanel.should.be.a('function');
  });

  it('renders a component', () => {
    (<AdPanel/>).should.be.an('object');
  });

  it('is a react component', () => {
    (new AdPanel()).should.be.an.instanceOf(React.Component);
  });

  describe('componentDidMount', () => {

    it('calls generateAd', () => {
      // console.log(chai.spy);
      chai.spy.on(AdPanel.prototype, 'generateAd');

      const element = React.createElement(AdPanel);
      element.type.prototype.componentDidMount.call(element);

      element.type.prototype.generateAd
        .should.have.been.called();
    });

    it('adds loadElementWhenInView() to scroll event listener', () => {
      chai.spy.on(Object.getPrototypeOf(window), 'addEventListener');

      const element = React.createElement(AdPanel);
      element.componentDidMount();

      window.addEventListener
        .should.have.been.called.with('scroll', element.loadElementWhenInView);
    });

    it('adds loadElementWhenInView() to resize event listener', () => {
      chai.spy.on(Object.getPrototypeOf(window), 'addEventListener');

      const element = React.createElement(AdPanel);
      element.componentDidMount();

      window.addEventListener
        .should.have.been.called.with('resize', element.loadElementWhenInView);
    });

    it('calls loadElementWhenInView', () => {
      const element = React.createElement(AdPanel);
      chai.spy.on(element, 'loadElementWhenInView');
      element.componentDidMount();

      element.loadElementWhenInView
        .should.have.been.called();
    });

  });

  describe('cleanupEventListeners', () => {

    it('removes loadElementWhenInView() to scroll event listener', () => {
      chai.spy.on(Object.getPrototypeOf(window), 'removeEventListener');

      const element = React.createElement(AdPanel);
      element.cleanupEventListeners();

      window.removeEventListener
        .should.have.been.called.with('scroll', element.loadElementWhenInView);
    });

    it('removes loadElementWhenInView() to resize event listener', () => {
      chai.spy.on(Object.getPrototypeOf(window), 'removeEventListener');

      const element = React.createElement(AdPanel);
      element.cleanupEventListeners();

      window.removeEventListener
        .should.have.been.called.with('resize', element.loadElementWhenInView);
    });

  });

  describe('componentWillUnmount', () => {

    it('call cleanupEventListeners', () => {
      chai.spy.on(AdPanel.prototype, 'cleanupEventListeners');

      const element = new AdPanel({});
      element.componentWillUnmount();

      element.cleanupEventListeners
        .should.have.been.called();
    });

  });

  describe('loadElementWhenInView', () => {


  });

});
