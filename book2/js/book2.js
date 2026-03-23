(function () {

  var BOOK_ID = "book2";
  var TOTAL_PAGES = 32;
  var PAGE_PAUSE = 1000;
  var PAGE_PREFIX = "stem_";
  var INDEX_PATH = "../index.html";

  var flipbook = null;
  var bgVideo = null;

  var originalPageWidth = 0;
  var originalPageHeight = 0;

  var autoFlipActive = false;
  var autoFlipTimer = null;
  var internalTurn = false;
  var exitingBook = false;

  var flipSound = new Audio("start-flip.mp3");
  var endSound = new Audio("end-flip.mp3");
  flipSound.preload = "auto";
  endSound.preload = "auto";

  function shuffle(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function playFlipSound() {
    try {
      flipSound.pause();
      flipSound.currentTime = 0;
      flipSound.play().catch(function () {});
    } catch (e) {}
  }

  function playEndSound() {
    try {
      endSound.pause();
      endSound.currentTime = 0;
      endSound.play().catch(function () {});
    } catch (e) {}
  }

  function stopAutoFlip() {
    autoFlipActive = false;
    if (autoFlipTimer) {
      clearTimeout(autoFlipTimer);
      autoFlipTimer = null;
    }
  }

  function autoFlipStep() {
    if (!autoFlipActive || !flipbook || exitingBook) return;

    var currentPage = flipbook.turn("page");
    var lastPage = flipbook.turn("pages");

    if (currentPage >= lastPage) {
      goBackToTable();
      return;
    }

    autoFlipTimer = setTimeout(function () {
      if (!autoFlipActive || exitingBook) return;

      internalTurn = true;
      playFlipSound();
      flipbook.turn("next");
      internalTurn = false;

      var newPage = flipbook.turn("page");

      if (newPage >= lastPage) {
        autoFlipTimer = setTimeout(function () {
          goBackToTable();
        }, PAGE_PAUSE);
      } else {
        autoFlipStep();
      }
    }, PAGE_PAUSE);
  }

  function startAutoFlip() {
    if (!flipbook || autoFlipActive || exitingBook) return;
    autoFlipActive = true;
    autoFlipStep();
  }

  function getScaledBookSize() {
    var viewportW = window.innerWidth;
    var viewportH = window.innerHeight;

    var fullBookW = originalPageWidth * 2;
    var fullBookH = originalPageHeight;

    var maxW = Math.max(320, viewportW - 140);
    var maxH = Math.max(320, viewportH - 110);

    var scale = Math.min(maxW / fullBookW, maxH / fullBookH, 1);

    return {
      width: Math.round(fullBookW * scale),
      height: Math.round(fullBookH * scale)
    };
  }

  function fitBook() {
    if (!flipbook || !originalPageWidth || !originalPageHeight) return;

    var size = getScaledBookSize();

    $("#book-shell").css({
      width: size.width + "px",
      height: size.height + "px"
    });

    flipbook.turn("size", size.width, size.height);
  }

  function getPagePathVariants(page) {
    return [
      "imgs/" + PAGE_PREFIX + page + ".png",
      "imgs/" + PAGE_PREFIX + (page < 10 ? "0" + page : page) + ".png"
    ];
  }

  function loadImageWithFallback(img, paths, index, onSuccess, onFailure) {
    if (index >= paths.length) {
      onFailure();
      return;
    }

    img.onload = function () {
      onSuccess(paths[index]);
    };

    img.onerror = function () {
      loadImageWithFallback(img, paths, index + 1, onSuccess, onFailure);
    };

    img.src = paths[index];
  }

  function buildPages(callback) {
    var firstImage = new Image();
    var firstPaths = getPagePathVariants(1);

    loadImageWithFallback(
      firstImage,
      firstPaths,
      0,
      function () {
        originalPageWidth = firstImage.naturalWidth;
        originalPageHeight = firstImage.naturalHeight;

        var holder = document.getElementById("flipbook");
        holder.innerHTML = "";

        for (var i = 1; i <= TOTAL_PAGES; i++) {
          var page = document.createElement("div");
          page.className = "page";

          var img = document.createElement("img");
          img.alt = "Page " + i;
          img.draggable = false;

          (function (imageElement, pageNumber) {
            var paths = getPagePathVariants(pageNumber);
            var tempImage = new Image();

            loadImageWithFallback(
              tempImage,
              paths,
              0,
              function (workingPath) {
                imageElement.src = workingPath;
              },
              function () {
                imageElement.alt = "Missing page " + pageNumber;
              }
            );
          })(img, i);

          page.appendChild(img);
          holder.appendChild(page);
        }

        callback();
      },
      function () {
        alert("Could not load imgs/stem_1.png or imgs/stem_01.png");
      }
    );
  }

  function goBackToTable() {
    if (exitingBook) return;

    exitingBook = true;
    stopAutoFlip();
    playEndSound();

    document.body.classList.add("exiting");
    sessionStorage.setItem("returningBook", BOOK_ID);

    setTimeout(function () {
      window.location.href = INDEX_PATH;
    }, 1000);
  }

  function initBook() {
    flipbook = $("#flipbook");

    var sz = getScaledBookSize();

    flipbook.turn({
      width: sz.width,
      height: sz.height,
      autoCenter: true,
      gradients: true,
      acceleration: true,
      elevation: 50,
      duration: 1200
    });

    flipbook.bind("turning", function () {
      if (autoFlipActive && !internalTurn) {
        stopAutoFlip();
      }
    });

    flipbook.bind("turned", function (e, page) {
      fitBook();

      var lastPage = flipbook.turn("pages");
      if (page >= lastPage && !autoFlipActive) {
        setTimeout(function () {
          if (!autoFlipActive && flipbook.turn("page") >= lastPage) {
            goBackToTable();
          }
        }, 900);
      }
    });

    $(window).bind("mousewheel", function (event, delta) {
      if (!flipbook || exitingBook) return;

      stopAutoFlip();

      if (delta > 0) {
        playFlipSound();
        flipbook.turn("previous");
      } else {
        playFlipSound();
        flipbook.turn("next");
      }

      event.preventDefault();
    });

    fitBook();

    setTimeout(function () {
      document.body.classList.add("ready");
    }, 120);
  }

  function initKeyboard() {
    document.addEventListener("keydown", function (e) {
      if (!flipbook || exitingBook) return;

      if (e.code === "Space") {
        e.preventDefault();
        autoFlipActive ? stopAutoFlip() : startAutoFlip();
      }

      if (e.keyCode === 37) {
        e.preventDefault();
        stopAutoFlip();
        playFlipSound();
        flipbook.turn("previous");
      }

      if (e.keyCode === 39) {
        e.preventDefault();
        stopAutoFlip();
        playFlipSound();
        flipbook.turn("next");
      }

      if (e.key === "Escape") {
        e.preventDefault();
        goBackToTable();
      }
    });
  }

  function initBackgroundVideo() {
    bgVideo = document.getElementById("bg-video");
    if (!bgVideo) return;

    var sources = [];
    for (var i = 1; i <= 14; i++) {
      sources.push("vids/" + i + ".mp4");
    }

    var shuffled = shuffle(sources);
    var index = 0;

    function playCurrent() {
      bgVideo.src = shuffled[index];
      bgVideo.muted = true;
      bgVideo.defaultMuted = true;
      bgVideo.volume = 0;
      bgVideo.playsInline = true;

      bgVideo.addEventListener("loadedmetadata", function onMeta() {
        bgVideo.removeEventListener("loadedmetadata", onMeta);

        var duration = bgVideo.duration;
        if (duration && duration > 5) {
          bgVideo.currentTime = Math.random() * (duration - 5);
        }

        var promise = bgVideo.play();
        if (promise && promise.catch) {
          promise.catch(function () {});
        }
      });
    }

    bgVideo.addEventListener("ended", function () {
      index++;
      if (index >= shuffled.length) {
        shuffled = shuffle(sources);
        index = 0;
      }
      playCurrent();
    });

    playCurrent();
  }

  function init() {
    initBackgroundVideo();
    initKeyboard();
    buildPages(function () {
      initBook();
    });
    window.addEventListener("resize", fitBook);
  }

  $(document).ready(init);

})();