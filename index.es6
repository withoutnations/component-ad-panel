import React from 'react';

/* global window: false */
/* global document: false */
// <div id='gpt_resp_mpu_inline_ad'></div>

export default class AnimatedPanel extends React.Component {


  constructor() {
    super();
    this.showElementWhenInView = this.showElementWhenInView.bind(this);
  }

  componentDidMount() {
    this.generateAd();
    window.addEventListener('scroll', this.showElementWhenInView);
    window.addEventListener('resize', this.showElementWhenInView);
    this.showElementWhenInView();
  }


  componentWillUnmount() {
    this.cleanupEventListeners();
  }

  isElementInViewport(elm) {
    const rect = React.findDOMNode(elm).getBoundingClientRect();
    return rect.bottom > 0 &&
      rect.right > 0 &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight);
  }

  showElementWhenInView() {
    const containerElement = this.refs.container;
    if (this.isElementInViewport(containerElement) === true) {
      const targetContainerElement = React.findDOMNode(containerElement);
      targetContainerElement.style.opacity = 1;
      targetContainerElement.style.transform = 'translateY(0px)';
      targetContainerElement.style.webkitTransform = 'translateY(0px)';
      this.cleanupEventListeners();
    }
  }

  cleanupEventListeners() {
    window.removeEventListener('scroll', this.showElementWhenInView);
    window.removeEventListener('resize', this.showElementWhenInView);
  }

  generateAd() {
    if (window.googletag) {
      window.googletag.cmd.push(() => {
        window.googletag.display('gpt_resp_mpu_inline_ad');
      });
    }
  }

  render() {
    return (
      <div ref="container" className="AnimatedPanel--container">
        <span ref="title" className="AnimatedPanel--title">Advertisement</span>
        <div ref="panel" className="AnimatedPanel--panel">
          <div ref="panelInner" className="AnimatedPanel--panel-inner">
            <img src="http://lorempixel.com/g/1024/768/cats"/>
          </div>
        </div>
      </div>
    );
  }
}
