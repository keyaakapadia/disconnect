(function () {
  var body = document.body;
  var books = document.querySelectorAll(".table-book");
  var returningBook = sessionStorage.getItem("returningBook");
  var isNavigating = false;
  var topZ = 10;

  // Snap layouts
  var layouts = [
    [
      { left: "22%", top: "52%", rotate: -18 },
      { left: "50%", top: "48%", rotate:  -4 },
      { left: "74%", top: "53%", rotate:  16 }
    ],
    [
      { left: "22%", top: "50%", rotate: -3 },
      { left: "50%", top: "50%", rotate:  1 },
      { left: "78%", top: "50%", rotate: -2 }
    ],
    [
      { left: "50%", top: "50%", rotate: -14 },
      { left: "50%", top: "50%", rotate:   4 },
      { left: "50%", top: "50%", rotate:  10 }
    ],
    [
      { left: "28%", top: "56%", rotate: -22 },
      { left: "52%", top: "44%", rotate:  -6 },
      { left: "70%", top: "54%", rotate:  18 }
    ]
  ];

  var currentLayout = Math.floor(Math.random() * layouts.length);

  function applyLayout(idx, animate) {
    var layout = layouts[idx];
    books.forEach(function (book, i) {
      var pose = layout[i];
      book.dataset.rotate = pose.rotate;
      if (animate) {
        book.classList.add("snapping");
        setTimeout(function () { book.classList.remove("snapping"); }, 600);
      }
      book.style.left      = pose.left;
      book.style.top       = pose.top;
      book.style.zIndex    = i + 1;
      book.style.transform = "translate(-50%, -50%) rotate(" + pose.rotate + "deg)";
    });
    currentLayout = idx;
  }

  applyLayout(currentLayout, false);

  books.forEach(function (book) {
    var startX, startY, startLeft, startTop;
    var dragging    = false;
    var didDrag     = false; // true from first move until next clean mousedown
    var readyToOpen = false; // only true after a clean press with no drag

    function getPos(e) {
      return e.touches
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };
    }

    function onDown(e) {
      if (isNavigating) return;

      topZ++;
      book.style.zIndex = topZ;

      var pos   = getPos(e);
      startX    = pos.x;
      startY    = pos.y;

      var rect  = book.getBoundingClientRect();
      startLeft = rect.left + rect.width  / 2;
      startTop  = rect.top  + rect.height / 2;

      dragging    = true;
      didDrag     = false;   // reset on every fresh press
      readyToOpen = true;    // assume clean until proven otherwise

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend",  onUp);

      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();

      var pos = getPos(e);
      var dx  = pos.x - startX;
      var dy  = pos.y - startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        didDrag     = true;
        readyToOpen = false; // moved — can no longer open this press
        book.classList.add("is-dragging");
      }

      if (!didDrag) return;

      var newLeft = startLeft + dx;
      var newTop  = startTop  + dy;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var w  = book.offsetWidth;
      var h  = book.offsetHeight;
      newLeft = Math.max(w * 0.1, Math.min(vw - w * 0.1, newLeft));
      newTop  = Math.max(h * 0.1, Math.min(vh - h * 0.1, newTop));

      var tilt = Math.max(-10, Math.min(10, dx * 0.03));
      book.style.left      = (newLeft / vw * 100) + "%";
      book.style.top       = (newTop  / vh * 100) + "%";
      book.style.transform = "translate(-50%, -50%) rotate(" + (initRot + tilt) + "deg)";
    }

    var initRot;

    function onUp() {
      if (!dragging) return;
      dragging = false;

      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend",  onUp);

      book.classList.remove("is-dragging");

      if (didDrag) {
        readyToOpen = false;
        var next = (currentLayout + 1) % layouts.length;
        applyLayout(next, true);
      }
    }

    // reset initRot on mousedown
    book.addEventListener("mousedown", function (e) {
      initRot = parseFloat(book.dataset.rotate) || 0;
      onDown(e);
    });
    book.addEventListener("touchstart", function (e) {
      initRot = parseFloat(book.dataset.rotate) || 0;
      onDown(e);
    }, { passive: false });

    // Click — only opens if this exact press had zero movement
    book.addEventListener("click", function (e) {
      if (!readyToOpen) return;
      if (isNavigating) return;
      isNavigating = true;

      sessionStorage.setItem("openingBook", book.getAttribute("data-book"));
      body.classList.add("is-leaving");

      setTimeout(function () {
        window.location.href = book.getAttribute("href");
      }, 850);
    });

    // Hover parallax
    book.addEventListener("mousemove", function (e) {
      if (dragging) return;
      var rect = book.getBoundingClientRect();
      var dx = (e.clientX - (rect.left + rect.width  / 2)) / rect.width;
      var dy = (e.clientY - (rect.top  + rect.height / 2)) / rect.height;
      var rot = parseFloat(book.dataset.rotate) || 0;
      book.style.transform =
        "translate(calc(-50% + " + (dx * 6) + "px), calc(-50% + " + (dy * 6) + "px))" +
        " rotate(" + rot + "deg)" +
        " rotateX(" + (dy * -5) + "deg) rotateY(" + (dx * 5) + "deg)" +
        " scale(1.03)";
    });

    book.addEventListener("mouseleave", function () {
      if (dragging) return;
      var rot = parseFloat(book.dataset.rotate) || 0;
      book.style.transform = "translate(-50%, -50%) rotate(" + rot + "deg)";
    });
  });

  // Return animation
  if (returningBook) {
    body.classList.add("returned");
    var match = document.querySelector('.table-book[data-book="' + returningBook + '"]');
    if (match) match.classList.add("return-focus");
    setTimeout(function () { sessionStorage.removeItem("returningBook"); }, 1400);
  }


})();