(function (factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = function (root, jQuery) {
      if (jQuery === undefined) {
        if (typeof window !== 'undefined') {
          jQuery = require('jquery');
        } else {
          jQuery = require('jquery')(root);
        }
      }
      factory(jQuery);
      return jQuery;
    };
  } else {
    factory(jQuery);
  }
}(function ($) {

  var $window = $(window),
    $document = $(document),
    PLUGIN_NAME = 'sparky',
    STATES = {
      CLOSING: 'closing',
      CLOSED: 'closed',
      OPENING: 'opening',
      OPENED: 'opened',
      DESTROYED: 'destroyed'
    };

  function whichAnimationEvent() {
    var t,
      el = document.createElement('fakeelement'),
      animations = {
        'animation': 'animationend',
        'OAnimation': 'oAnimationEnd',
        'MozAnimation': 'animationend',
        'WebkitAnimation': 'webkitAnimationEnd'
      };
    for (t in animations) {
      if (el.style[t] !== undefined) {
        return animations[t];
      }
    }
  }

  function isIE(version) {
    if (version === 9) {
      return navigator.appVersion.indexOf('MSIE 9.') !== -1;
    } else {
      userAgent = navigator.userAgent;
      return userAgent.indexOf('MSIE ') > -1 || userAgent.indexOf('Trident/') > -1;
    }
  }

  function clearValue(value) {
    var separators = /%|px|em|cm|vh|vw/;
    return parseInt(String(value).split(separators)[0]);
  }

  var animationEvent = whichAnimationEvent(),
    isMobile = (/Mobi/.test(navigator.userAgent)) ? true : false;

  window.$sparky = {};
  window.$sparky.history = false;

  var sparky = function (element, options) {
    this.init(element, options);
  };

  sparky.prototype = {

    constructor: sparky,

    init: function (element, options) {

      var that = this;
      this.$element = $(element);
      this.id = this.$element[0].id;
      this.classes = (this.$element.attr('class') !== undefined) ? this.$element.attr('class') : '';
      this.content = this.$element.html();
      this.state = STATES.CLOSED;
      this.options = options;
      this.width = 0;
      this.headerHeight = 0;
      this.modalHeight = 0;
      this.$overlay = $('<div class="' + PLUGIN_NAME + '-overlay" style="background-color:rgba(0, 0, 0, 0.4)"></div>');
      this.$element.attr('aria-hidden', 'true');
      this.$element.attr('aria-labelledby', this.id);
      this.$element.attr('role', 'dialog');

      if (!this.$element.hasClass('sparky')) {
        this.$element.addClass('sparky');
      }

      $.each(this.options, function (index, val) {
        var attr = that.$element.attr('data-' + PLUGIN_NAME + '-' + index);
        try {
          if (typeof attr !== typeof undefined) {

            if (attr === '' || attr == 'true') {
              options[index] = true;
            } else if (attr == 'false') {
              options[index] = false;
            } else if (typeof val == 'function') {
              options[index] = new Function(attr);
            } else {
              options[index] = attr;
            }
          }
        } catch (exc) {}
      });

      this.$element.appendTo('body');
      this.$element.html('<div class="' + PLUGIN_NAME + '-wrap"><div class="' + PLUGIN_NAME + '-content"><iframe class="' + PLUGIN_NAME + '-iframe"></iframe>' + this.content + "</div></div>");
      this.$element.find('.' + PLUGIN_NAME + '-iframe').css('height', 550);
      this.$wrap = this.$element.find('.' + PLUGIN_NAME + '-wrap');
      this.$element.css('z-index', 999);
      this.$overlay.css('z-index', 997);
      this.$element.css('border-radius', 7);
      this.$element.find('.' + PLUGIN_NAME + '-content').css('padding', 0);

      this.createHeader();
      this.recalcWidth();
      this.recalcVerticalPos();

    },

    createHeader: function () {
      this.$header = $('<div class="' + PLUGIN_NAME + '-header"><h2 class="' + PLUGIN_NAME + '-header-title">Pay with Spark</h2><div class="' + PLUGIN_NAME + '-header-buttons"></div></div>');
      this.$header.find('.' + PLUGIN_NAME + '-header-buttons').append('<a href="javascript:void(0)" class="' + PLUGIN_NAME + '-button ' + PLUGIN_NAME + '-button-close" data-' + PLUGIN_NAME + '-close></a>');
      this.$header.addClass(PLUGIN_NAME + '-noSubtitle');
      this.$header.css('background', "#000");
      this.$element.css('overflow', 'hidden').prepend(this.$header);
    },

    toggle: function () {
      if (this.state == STATES.OPENED) {
        this.close();
      }
      if (this.state == STATES.CLOSED) {
        this.open();
      }
    },

    open: function (param) {

      var that = this;

      try {
        if (param !== undefined && param.preventClose === false) {
          $.each($('.' + PLUGIN_NAME), function (index, modal) {
            if ($(modal).data().sparky !== undefined) {
              var state = $(modal).sparky('getState');

              if (state == 'opened' || state == 'opening') {
                $(modal).sparky('close');
              }
            }
          });
        }
      } catch (e) { /*console.warn(exc);*/ }

      function opened() {

        // console.info('[ '+PLUGIN_NAME+' | '+that.id+' ] Opened.');

        that.state = STATES.OPENED;
        that.$element.trigger(STATES.OPENED);

        if (that.options.onOpened && (typeof (that.options.onOpened) === "function" || typeof (that.options.onOpened) === "object")) {
          that.options.onOpened(that);
        }
      }

      function bindEvents() {

        // Close when button pressed
        that.$element.off('click', '[data-' + PLUGIN_NAME + '-close]').on('click', '[data-' + PLUGIN_NAME + '-close]', function (e) {
          e.preventDefault();

          var transition = $(e.currentTarget).attr('data-' + PLUGIN_NAME + '-transitionOut');

          if (transition !== undefined) {
            that.close({
              transition: transition
            });
          } else {
            that.close();
          }
        });
      }

      if (this.state == STATES.CLOSED) {

        bindEvents();

        this.state = STATES.OPENING;
        this.$element.trigger(STATES.OPENING);
        this.$element.attr('aria-hidden', 'false');
        this.$element.find('.' + PLUGIN_NAME + '-content').addClass(PLUGIN_NAME + '-content-loader');
        this.$element.find('.' + PLUGIN_NAME + '-iframe').on('load', function () {
          $(this).parent().removeClass(PLUGIN_NAME + '-content-loader');
        });

        var href = null;
        try {
          href = $(param.currentTarget).attr('href') !== '' ? $(param.currentTarget).attr('href') : null;
        } catch (e) { /* console.warn(exc); */ }

        if ((this.options.url !== null) && (href === null || href === undefined)) {
          href = this.options.url;
        }
        if ((this.options.address !== null) && (href === null || href === undefined)) {
          if ((this.options.amount !== null)) {
            let amount = encodeURI(this.options.amount)
            href = `https://get-spark.com/app/#/sale/${amount}?address=${this.options.address}`;
          } else {
            href = `https://get-spark.com/app/#/donate?address=${this.options.address}`;
          }
        }
        if (href === null || href === undefined) {
          throw new Error('Failed to create URL');
        }
        this.$element.find('.' + PLUGIN_NAME + '-iframe').attr('src', href);


        if (isMobile) {
          $('html').addClass(PLUGIN_NAME + '-isOverflow');
          if (isMobile) {
            $('body').css('overflow', 'hidden');
          }
        }

        (function open() {

          that.$overlay.appendTo('body');

          if (that.options.transitionInOverlay) {
            that.$overlay.addClass(that.options.transitionInOverlay);
          }

          var transitionIn = that.options.transitionIn;

          if (typeof param == 'object') {

            if (param.transition !== undefined || param.transitionIn !== undefined) {
              transitionIn = param.transition || param.transitionIn;
            }
          }

          if (transitionIn !== '' && animationEvent !== undefined) {

            that.$element.addClass('transitionIn ' + transitionIn).show();
            that.$wrap.one(animationEvent, function () {

              that.$element.removeClass(transitionIn + ' transitionIn');
              that.$overlay.removeClass(that.options.transitionInOverlay);

              opened();
            });

          } else {

            that.$element.show();
            opened();
          }

        })();

        // close on overlay click
        this.$overlay.click(function () {
          that.close();
        });

        this.$element.find(':input:not(button):enabled:visible:first').focus(); // Focus on the first field

        (function updateTimer() {
          that.recalcLayout();
          that.timer = setTimeout(updateTimer, 300);
        })();

        // Close when the Escape key is pressed
        $document.on('keydown.' + PLUGIN_NAME, function (e) {
          if (that.options.closeOnEscape && e.keyCode === 27) {
            that.close();
          }
        });
      }
    },

    close: function (param) {

      var that = this;

      function closed() {
        that.state = STATES.CLOSED;
        that.$element.trigger(STATES.CLOSED);
        that.$element.find('.' + PLUGIN_NAME + '-iframe').attr('src', '');

        if (isMobile) {
          $('html').removeClass(PLUGIN_NAME + '-isOverflow');
          if (isMobile) {
            $('body').css('overflow', 'auto');
          }
        }

        if ($('.' + PLUGIN_NAME + ':visible').length === 0) {
          $('html').removeClass(PLUGIN_NAME + '-isAttached');
        }
      }

      if (this.state == STATES.OPENED || this.state == STATES.OPENING) {

        $document.off('keydown.' + PLUGIN_NAME);

        this.state = STATES.CLOSING;
        this.$element.trigger(STATES.CLOSING);
        this.$element.attr('aria-hidden', 'true');

        clearTimeout(this.timer);
        clearTimeout(this.timerTimeout);

        var transitionOut = this.options.transitionOut;

        if (typeof param == 'object') {
          if (param.transition !== undefined || param.transitionOut !== undefined) {
            transitionOut = param.transition || param.transitionOut;
          }
        }

        if ((transitionOut === false || transitionOut === '') || animationEvent === undefined) {

          this.$element.hide();
          this.$overlay.remove();
          closed();

        } else {

          this.$element.attr('class', [
            this.classes,
            PLUGIN_NAME,
            transitionOut
          ].join(' '));

          this.$overlay.attr('class', PLUGIN_NAME + '-overlay ' + this.options.transitionOutOverlay);

          this.$element.one(animationEvent, function () {

            if (that.$element.hasClass(transitionOut)) {
              that.$element.removeClass(transitionOut + ' transitionOut').hide();
            }
            that.$overlay.removeClass(that.options.transitionOutOverlay).remove();
            closed();
          });
        }
      }
    },

    destroy: function () {
      var e = $.Event('destroy');

      this.$element.trigger(e);

      $document.off('keydown.' + PLUGIN_NAME);

      clearTimeout(this.timer);
      clearTimeout(this.timerTimeout);

      this.$element.find('.' + PLUGIN_NAME + '-iframe').remove();
      this.$element.html(this.$element.find('.' + PLUGIN_NAME + '-content').html());

      this.$element.off('click', '[data-' + PLUGIN_NAME + '-close]');

      this.$element
        .off('.' + PLUGIN_NAME)
        .removeData(PLUGIN_NAME)
        .attr('style', '');

      this.$overlay.remove();
      this.$element.trigger(STATES.DESTROYED);
      this.$element = null;
    },

    getState: function () {
      return this.state;
    },

    startLoading: function () {
      if (!this.$element.find('.' + PLUGIN_NAME + '-loader').length) {
        this.$element.append('<div class="' + PLUGIN_NAME + '-loader fadeIn"></div>');
      }
      this.$element.find('.' + PLUGIN_NAME + '-loader').css({
        top: this.headerHeight,
        borderRadius: 7
      });
    },

    stopLoading: function () {
      var $loader = this.$element.find('.' + PLUGIN_NAME + '-loader');
      if (!$loader.length) {
        this.$element.prepend('<div class="' + PLUGIN_NAME + '-loader fadeIn"></div>');
        $loader = this.$element.find('.' + PLUGIN_NAME + '-loader').css('border-radius', 7);
      }
      $loader.removeClass('fadeIn').addClass('fadeOut');
      setTimeout(function () {
        $loader.remove();
      }, 600);
    },

    recalcWidth: function () {
      var that = this;
      this.$element.css('max-width', 375);

      if (isIE()) {
        var modalWidth = 375;
        if (modalWidth.toString().split('%').length > 1) {
          modalWidth = that.$element.outerWidth();
        }
        that.$element.css({
          left: '50%',
          marginLeft: -(modalWidth / 2)
        });
      }
    },

    recalcVerticalPos: function (first) {
      if (first === false) {
        this.$element.css({
          marginTop: '',
          borderRadius: 7
        });
      }

      if (first === false) {
        this.$element.css({
          marginBottom: '',
          borderRadius: 7
        });
      }
    },

    recalcLayout: function () {

      var that = this,
        windowHeight = $window.height(),
        modalHeight = this.$element.outerHeight(),
        modalWidth = this.$element.outerWidth(),
        contentHeight = this.$element.find('.' + PLUGIN_NAME + '-content')[0].scrollHeight,
        outerHeight = contentHeight + this.headerHeight,
        wrapperHeight = this.$element.innerHeight() - this.headerHeight,
        modalMargin = parseInt(-((this.$element.innerHeight() + 1) / 2)) + 'px',
        scrollTop = this.$wrap.scrollTop(),
        borderSize = 0;

      if (isIE()) {
        if (modalWidth >= $window.width()) {
          this.$element.css({
            left: '0',
            marginLeft: ''
          });
        } else {
          this.$element.css({
            left: '50%',
            marginLeft: -(modalWidth / 2)
          });
        }
      }

      if (this.$element.find('.' + PLUGIN_NAME + '-header').length && this.$element.find('.' + PLUGIN_NAME + '-header').is(':visible')) {
        this.headerHeight = parseInt(this.$element.find('.' + PLUGIN_NAME + '-header').innerHeight());
        this.$element.css('overflow', 'hidden');
      } else {
        this.headerHeight = 0;
        this.$element.css('overflow', '');
      }

      if (this.$element.find('.' + PLUGIN_NAME + '-loader').length) {
        this.$element.find('.' + PLUGIN_NAME + '-loader').css('top', this.headerHeight);
      }

      if (modalHeight !== this.modalHeight) {
        this.modalHeight = modalHeight;
      }

      if (this.state == STATES.OPENED || this.state == STATES.OPENING) {
        // If the height of the window is smaller than the modal with iframe
        if (windowHeight < (550 + this.headerHeight + borderSize)) {
          this.$element.find('.' + PLUGIN_NAME + '-iframe').css('height', windowHeight - (this.headerHeight + borderSize));
        } else {
          this.$element.find('.' + PLUGIN_NAME + '-iframe').css('height', 550);
        }

        if (modalHeight == windowHeight) {
          this.$element.addClass('isAttached');
        } else {
          this.$element.removeClass('isAttached');
        }
        // If the modal is larger than the height of the window..
        if (outerHeight > windowHeight) {
          if (contentHeight < $window.height()) {
            this.$element.addClass('isAttachedBottom');
          }
          if (contentHeight < $window.height()) {
            this.$element.addClass('isAttachedTop');
          }
          if ($('.' + PLUGIN_NAME + ':visible').length === 1) {
            $('html').addClass(PLUGIN_NAME + '-isAttached');
          }
          this.$element.css('height', windowHeight);

        } else {
          this.$element.css('height', contentHeight + (this.headerHeight + borderSize));
          this.$element.removeClass('isAttachedTop isAttachedBottom');
          if ($('.' + PLUGIN_NAME + ':visible').length === 1) {
            $('html').removeClass(PLUGIN_NAME + '-isAttached');
          }
        }

        (function applyScroll() {
          if (contentHeight > wrapperHeight && outerHeight > windowHeight) {
            that.$element.addClass('hasScroll');
            that.$wrap.css('height', modalHeight - (that.headerHeight + borderSize));
          } else {
            that.$element.removeClass('hasScroll');
            that.$wrap.css('height', 'auto');
          }
        })();

        (function applyShadow() {
          if (wrapperHeight + scrollTop < (contentHeight - 30)) {
            that.$element.addClass('hasShadow');
          } else {
            that.$element.removeClass('hasShadow');
          }
        })();

      }
    }
  };

  $document.off('click', '[data-' + PLUGIN_NAME + '-open]').on('click', '[data-' + PLUGIN_NAME + '-open]', function (e) {
    e.preventDefault();

    var modal = $('.' + PLUGIN_NAME + ':visible');
    var openModal = $(e.currentTarget).attr('data-' + PLUGIN_NAME + '-open');
    var preventClose = $(e.currentTarget).attr('data-' + PLUGIN_NAME + '-preventClose');
    var transitionIn = $(e.currentTarget).attr('data-' + PLUGIN_NAME + '-transitionIn');
    var transitionOut = $(e.currentTarget).attr('data-' + PLUGIN_NAME + '-transitionOut');
    var zindex = $(e.currentTarget).attr('data-' + PLUGIN_NAME + '-zindex');

    if (zindex !== undefined)
      $(openModal).sparky('setZindex', zindex);

    if (preventClose === undefined) {
      if (transitionOut !== undefined) {
        modal.sparky('close', {
          transition: transitionOut
        });
      } else {
        modal.sparky('close');
      }
    }

    setTimeout(function () {
      if (transitionIn !== undefined) {
        $(openModal).sparky('open', {
          transition: transitionIn
        });
      } else {
        $(openModal).sparky('open');
      }
    }, 200);
  });

  $.fn[PLUGIN_NAME] = function (option, args) {
    if (!$(this).length && typeof option == 'object') {

      var newEL = {
        $el: document.createElement('div'),
        id: this.selector.split('#'),
        class: this.selector.split('.')
      };

      if (newEL.id.length > 1) {
        try {
          newEL.$el = document.createElement(id[0]);
        } catch (exc) {}

        newEL.$el.id = this.selector.split('#')[1].trim();

      } else if (newEL.class.length > 1) {
        try {
          newEL.$el = document.createElement(newEL.class[0]);
        } catch (exc) {}

        for (var x = 1; x < newEL.class.length; x++) {
          newEL.$el.classList.add(newEL.class[x].trim());
        }
      }
      document.body.appendChild(newEL.$el);

      this.push($(this.selector));
    }
    var objs = this;

    for (var i = 0; i < objs.length; i++) {

      var $this = $(objs[i]);
      var data = $this.data(PLUGIN_NAME);
      var options = $.extend({}, $.fn[PLUGIN_NAME].defaults, $this.data(), typeof option == 'object' && option);

      if (!data && (!option || typeof option == 'object')) {

        $this.data(PLUGIN_NAME, (data = new sparky($this, options)));
      } else if (typeof option == 'string' && typeof data != 'undefined') {

        return data[option].apply(data, [].concat(args));
      }
    }

    return this;
  };

  $.fn[PLUGIN_NAME].defaults = {
    url: null,
    address: null,
    amount: null,
    transitionIn: 'bounceInDown', // comingIn, bounceInDown, bounceInUp, fadeInDown, fadeInUp, fadeInLeft, fadeInRight, flipInX
    transitionOut: 'comingOut', // comingOut, bounceOutDown, bounceOutUp, fadeOutDown, fadeOutUp, , fadeOutLeft, fadeOutRight, flipOutX
    transitionInOverlay: 'fadeIn',
    transitionOutOverlay: 'fadeOut',
  };

  $.fn[PLUGIN_NAME].Constructor = sparky;

  return $.fn.sparky;

}));

$(function () {
  $("#modal-spark").sparky();
})
