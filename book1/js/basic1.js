/*
 * basic1.js — page loader helpers for Book 1
 */

var PAGE_PREFIX  = "leaf_";
var PAGE_EXT     = ".png";
var PAGE_FOLDER  = "imgs/";
var TOTAL_PAGES  = 32;

function addPage(page, book) {
  var element = $('<div />', {});

  if (book.turn('addPage', element, page)) {
    element.html('<div class="gradient"></div><div class="loader"></div>');
    loadPage(page, element);
  }
}

function loadPage(page, pageElement) {
  var img = $('<img />');

  img.mousedown(function (e) {
    e.preventDefault();
  });

  img.on('load', function () {
    $(this).css({ width: '100%', height: '100%' });
    $(this).appendTo(pageElement);
    pageElement.find('.loader').remove();
  });

  img.attr('src', PAGE_FOLDER + PAGE_PREFIX + (page < 10 ? "0" + page : page) + PAGE_EXT);
}

function addPagesAutomated(book) {
  for (var i = 1; i <= TOTAL_PAGES; i++) {
    addPage(i, book);
  }
}

function isChrome() {
  return navigator.userAgent.indexOf('Chrome') !== -1;
}