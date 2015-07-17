'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

/* global window: false */
/* global document: false */
// <div id='gpt_resp_mpu_inline_ad'></div>

var AnimatedPanel = (function (_React$Component) {
  _inherits(AnimatedPanel, _React$Component);

  function AnimatedPanel() {
    _classCallCheck(this, AnimatedPanel);

    _React$Component.call(this);
    this.showElementWhenInView = this.showElementWhenInView.bind(this);
  }

  AnimatedPanel.prototype.componentDidMount = function componentDidMount() {
    this.generateAd();
    window.addEventListener('scroll', this.showElementWhenInView);
    window.addEventListener('resize', this.showElementWhenInView);
    this.showElementWhenInView();
  };

  AnimatedPanel.prototype.componentWillUnmount = function componentWillUnmount() {
    this.cleanupEventListeners();
  };

  AnimatedPanel.prototype.isElementInViewport = function isElementInViewport(elm) {
    var rect = _react2['default'].findDOMNode(elm).getBoundingClientRect();
    return rect.bottom > 0 && rect.right > 0 && rect.left < (window.innerWidth || document.documentElement.clientWidth) && rect.top < (window.innerHeight || document.documentElement.clientHeight);
  };

  AnimatedPanel.prototype.showElementWhenInView = function showElementWhenInView() {
    var containerElement = this.refs.container;
    if (this.isElementInViewport(containerElement) === true) {
      var targetContainerElement = _react2['default'].findDOMNode(containerElement);
      targetContainerElement.style.opacity = 1;
      targetContainerElement.style.transform = 'translateY(0px)';
      targetContainerElement.style.webkitTransform = 'translateY(0px)';
      this.cleanupEventListeners();
    }
  };

  AnimatedPanel.prototype.cleanupEventListeners = function cleanupEventListeners() {
    window.removeEventListener('scroll', this.showElementWhenInView);
    window.removeEventListener('resize', this.showElementWhenInView);
  };

  AnimatedPanel.prototype.generateAd = function generateAd() {
    if (window.googletag) {
      window.googletag.cmd.push(function () {
        window.googletag.display('gpt_resp_mpu_inline_ad');
      });
    }
  };

  AnimatedPanel.prototype.render = function render() {
    return _react2['default'].createElement(
      'div',
      { ref: 'container', className: 'AnimatedPanel--container' },
      _react2['default'].createElement(
        'span',
        { ref: 'title', className: 'AnimatedPanel--title' },
        'Advertisement'
      ),
      _react2['default'].createElement(
        'div',
        { ref: 'panel', className: 'AnimatedPanel--panel' },
        _react2['default'].createElement(
          'div',
          { ref: 'panelInner', className: 'AnimatedPanel--panel-inner' },
          _react2['default'].createElement('img', { src: 'http://lorempixel.com/g/1024/768/cats' })
        )
      )
    );
  };

  return AnimatedPanel;
})(_react2['default'].Component);

exports['default'] = AnimatedPanel;
module.exports = exports['default'];

