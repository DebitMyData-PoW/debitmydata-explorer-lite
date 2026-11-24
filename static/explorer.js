// DebitMyData block explorer: the light / dark theme (applied before the page is drawn; the
// choice is kept in this site's own "dmd-theme-chain" cookie), dates and amounts shown in a
// readable form, and the phone-friendly details. The pages work without it.
(function () {
  "use strict";
  var KEY = "dmd-theme-chain";
  var root = document.documentElement;
  var theme = null;
  try {
    var saved = document.cookie.match(/(?:^|;\s*)dmd-theme-chain=(light|dark)/);
    theme = saved ? saved[1] : localStorage.getItem(KEY);
  } catch (e) {}
  if (theme !== "light" && theme !== "dark") theme = "light";
  root.setAttribute("data-theme", theme);

  function isDark() {
    return root.getAttribute("data-theme") === "dark";
  }
  function label() {
    var button = document.getElementById("theme-toggle");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark() ? "#0b0a0f" : "#ffffff");
    if (!button) return;
    button.setAttribute("aria-label", isDark() ? "Switch to the light theme" : "Switch to the dark theme");
    button.title = isDark() ? "Light theme" : "Dark theme";
  }
  function save(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (e) {}
    var secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = KEY + "=" + value + "; path=/; max-age=31536000; samesite=lax" + secure;
  }
  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || !target.closest || !target.closest("#theme-toggle")) return;
    var value = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", value);
    save(value);
    label();
  });

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  document.addEventListener("DOMContentLoaded", function () {
    label();
    // <time data-unix="1700000000">: the visitor's local date and time
    var times = document.querySelectorAll("time[data-unix]");
    for (var i = 0; i < times.length; i++) {
      var seconds = Number(times[i].getAttribute("data-unix"));
      if (!seconds) continue;
      var d = new Date(seconds * 1000);
      times[i].setAttribute("datetime", d.toISOString());
      times[i].textContent = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " +
        pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }
    // <span data-data="123456789">: an amount in data (the smallest unit), shown in DMD
    var amounts = document.querySelectorAll("[data-data]");
    for (var j = 0; j < amounts.length; j++) {
      var units = Number(amounts[j].getAttribute("data-data"));
      if (isNaN(units)) continue;
      amounts[j].textContent = (units / 1e8).toFixed(8) + " DMD";
    }
  });
})();
