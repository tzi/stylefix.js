(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.styleFix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function styleFix() {
  'use strict';

  var _fixerList = [];

  /* Initialization */
  function registerFixer(fixer) {
    _fixerList.push(fixer);
  }

  /* Process */
  function fix() {
    $('link[rel="stylesheet"]:not([data-inprogress])').forEach(fixLinkNode);
    $('style').forEach(fixStyleNode);
    $('[style]').forEach(fixStyleAttribute);
  }

  function fixLinkNode(linkNode) {
    try {
      // Ignore alternate stylesheets
      if (linkNode.rel !== 'stylesheet') {
        return;
      }
    } catch (e) {
      return;
    }

    var url = linkNode.href || linkNode.getAttribute('data-href');
    retrieveStylesheetContent(url, function(css) {
      css = translateRelativeUrl(css, url);
      css = fixText(css);
      createStyleNode(css, linkNode);
    });
    linkNode.setAttribute('data-inprogress', '');
  }

  function fixStyleNode(styleNode) {
    var disabled = styleNode.disabled;
    styleNode.textContent = fixText(styleNode.textContent, true, styleNode);
    styleNode.disabled = disabled;
  }

  function fixStyleAttribute(element) {
    var css = element.getAttribute('style');
    css = fixText(css, false, element);
    element.setAttribute('style', css);
  }

  function fixText(css, raw, element) {
    for (var i = 0; i < _fixerList.length; i++) {
      css = _fixerList[i](css, raw, element) || css;
    }
    return css;
  }

  /* Inlining remote stylesheet */
  function retrieveStylesheetContent(url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (!xhr.status || xhr.status < 400 || xhr.status > 600) {
          if (xhr.responseText) {
            callback(xhr.responseText);
          }
        }
      }
    };

    try {
      xhr.open('GET', url);
      xhr.send(null);
    } catch (e) {
      // Fallback to XDomainRequest if available
      if (typeof window.XDomainRequest != 'undefined') {
        xhr = new XDomainRequest();
        xhr.onerror = xhr.onprogress = function () {
        };
        xhr.onload = fix;
        xhr.open('GET', url);
        xhr.send(null);
      }
    }
  }

  function translateRelativeUrl(css, url) {
    var baseUrl = url.replace(/[^\/]+$/, '');

    // Convert relative URLs to absolute, if needed
    if (baseUrl) {

      css = css.replace(/url\(\s*?((?:"|')?)(.+?)\1\s*?\)/gi, function (context, quote, url) {
        return 'url("' + getAbsoluteUrlPrefix(url, baseUrl) + url + '")';
      });

      // Behavior URLs shoudn’t be converted (Issue prefixfree#19)
      // Base should be escaped before added to RegExp (Issue #81)
      var baseUrlEscaped = baseUrl.replace(/([\\\^\$*+[\]?{}.=!:(|)])/g, "\\$1");
      css = css.replace(new RegExp('\\b(behavior:\\s*?url\\(\'?"?)' + baseUrlEscaped, 'gi'), '$1');
    }

    return css;
  }

  function getAbsoluteUrlPrefix(url, baseUrl) {
    // Absolute & or hash-relative
    if (/^([a-z]{3,10}:|#)/i.test(url)) {
      return '';
    }
    // Scheme-relative
    else if (/^\/\//.test(url)) {
      // May contain sequences like /../ and /./ but those DO work
      return (/^[a-z]{3,10}:/.exec(baseUrl) || [''])[0];
    }
    // Domain-relative
    else if (/^\//.test(url)) {
      return (/^[a-z]{3,10}:\/\/[^\/]+/.exec(baseUrl) || [''])[0];
    }
    // Query-relative
    else if (/^\?/.test(url)) {
      return /^([^?]*)\??/.exec(baseUrl)[1];
    }
    // Path-relative
    else {
      return baseUrl;
    }
  }

  function createStyleNode(css, linkNode) {
    var style = document.createElement('style');
    style.textContent = css;
    style.media = linkNode.media;
    style.disabled = linkNode.disabled;
    style.setAttribute('data-href', linkNode.href);

    linkNode.parentNode.insertBefore(style, linkNode);
    linkNode.parentNode.removeChild(linkNode);

    style.media = linkNode.media; // Duplicate is intentional. See issue #31
  }

  /* Utils */
  function $(query) {
    return [].slice.call(document.querySelectorAll(query));
  }

  /* Public API */
  return {
    registerFixer: registerFixer,
    fix: fix,
    fixText: fixText
  };
}

module.exports = styleFix();

},{}]},{},[1])(1)
});