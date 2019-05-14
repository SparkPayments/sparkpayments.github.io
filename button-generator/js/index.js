var _slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;
    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();
var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
var ButtonGen = function () {
  function ButtonGen(config) {
    _classCallCheck(this, ButtonGen);
    var
      defaults = config || new Map([
        ["color", "white"],
        ["border-radius", "5"],
        ["font", "Helvetica, Arial, sans-serif"],
        ["font-size", "16"],
        ["alignment", "center"],
        ["text", "Click Here"],
        ["href", "#"],
        ["background-color", "#2b3138"]
      ]);
    this.fields = [];
    this.initSpectrum();
    this.loadDefaults(defaults);
    this.bindEvents();
    this.generate();
  }
  _createClass(ButtonGen, [{
    key: "spectrumConfigGen",
    value: function spectrumConfigGen(
      color) {
      var _this = this;
      return {
        color: color,
        showInput: true,
        preferredFormat: "hex",
        change: function change() {
          _this.generate();
        }
      };
    }
  }, {
    key: "initSpectrum",
    value: function initSpectrum() {
      var _this2 = this;
      var spectrumInputs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ["color", "background-color"];
      this.spectrumTargets = [];
      spectrumInputs.forEach(function (id) {
        _this2.spectrumTargets.push(id);
        $("#" + id).spectrum(_this2.spectrumConfigGen("black"));
      });
    }
  }, {
    key: "loadDefaults",
    value: function loadDefaults(
      config) {
      var _this3 = this;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;
      try {
        for (var _iterator = config.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
            key = _step$value[0],
            value = _step$value[1];
          var target = $("#" + key);
          target.on("change", function () {
            _this3.generate();
          });
          this.fields.push(target);
          if (this.spectrumTargets.includes(key)) {
            target.spectrum("set", value);
          } else {
            target.val(value);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: "generate",
    value: function generate() {
      var results = {};
      this.fields.forEach(function ($field) {
        results[$field.attr("id")] = $field.val();
      });
      var output = "<!--Button-->\n<center>\n <table align="
      center " cellspacing="
      0 " cellpadding="
      0 " width="
      100 % ">\n <
        tr > \n <
        td align = "" +
        results.alignment + ""
      style = "padding: 10px;" > \n <
        table border = "0"
      class = "mobile-button"
      cellspacing = "0"
      cellpadding = "0" > \n <
        tr > \n <
        td align = "" +
        results.alignment + ""
      bgcolor = "" + results["background-color"] + ""
      style = "background-color: " + results["background-color"] + "; margin: auto; max-width: 600px; -webkit-border-radius: " + results["border-radius"] + "px; -moz-border-radius: " + results["border-radius"] + "px; border-radius: " + results["border-radius"] + "px; padding: 15px 20px; "
      width = "100%" > \n
        <!--[if mso]> <![endif]-->\n
        <
        a href = "" +
        results.href + ""
      target = "_blank"
      style = "" + results["font-size"] + "px; font-family: " + results["font"] + "; color: " + results.color + "; font-weight:normal; text-align:center; background-color: " + results["background-color"] + "; text-decoration: none; border: none; -webkit-border-radius: " + results["border-radius"] + "px; -moz-border-radius: " + results["border-radius"] + "px; border-radius: " + results["border-radius"] + "px; display: inline-block;" > \n <
        span style = "font-size: " +
        results["font-size"] + "px; font-family: " + results["font"] + "; color: " + results.color + "; font-weight:normal; line-height:1.5em; text-align:center;" > " + results.text + " < /span>\n <
        /a>\n
        <!--[if mso]> <![endif]-->\n
        <
        /td>\n <
        /tr>\n <
        /table>\n <
        /td>\n <
        /tr>\n </table > \n < /center>";
      $(".button-container").html(output);
      $(".html-output").val(output);
    }
  }, {
    key: "bindEvents",
    value: function bindEvents() {
      var _this4 = this;
      $("#generate").on("click", function () {
        _this4.generate();
      });
    }
  }]);
  return ButtonGen;
}();
new ButtonGen();
