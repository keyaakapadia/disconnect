/*
 * basic2.js — page loader helpers for Book 2
 */

var PAGE_PREFIX = "stem_";
var PAGE_EXT = ".png";
var PAGE_FOLDER = "imgs/";
var TOTAL_PAGES = 32;

function getPagePathVariants(page) {
  return [
    PAGE_FOLDER + PAGE_PREFIX + page + PAGE_EXT,
    PAGE_FOLDER + PAGE_PREFIX + (page < 10 ? "0" + page : page) + PAGE_EXT
  ];
}

function addPage(page, book) {
  var element = $('<div />', {});

  if (book.turn('addPage', element, page)) {
    element.html('<div class="gradient"></div><div class="loader"></div>');
    loadPage(page, element);
  }
}

function loadPage(page, pageElement) {
  var img = $('<img />');
  var paths = getPagePathVariants(page);
  var currentIndex = 0;

  img.mousedown(function (e) {
    e.preventDefault();
  });

  img.on('load', function () {
    $(this).css({ width: '100%', height: '100%' });
    $(this).appendTo(pageElement);
    pageElement.find('.loader').remove();
  });

  img.on('error', function () {
    currentIndex++;
    if (currentIndex < paths.length) {
      img.attr('src', paths[currentIndex]);
    } else {
      pageElement.find('.loader').remove();
      pageElement.html(
        '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f1e8;color:#222;font-family:Arial,sans-serif;font-size:14px;text-align:center;padding:20px;">' +
        'Could not load image for page ' + page +
        '</div>'
      );
    }
  });

  img.attr('src', paths[currentIndex]);
}

function addPagesAutomated(book) {
  for (var i = 1; i <= TOTAL_PAGES; i++) {
    addPage(i, book);
  }
}

function isChrome() {
  return navigator.userAgent.indexOf('Chrome') !== -1;
}