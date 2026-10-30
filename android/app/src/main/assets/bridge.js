// Injected by the Lumino Fit Android app before the page's own scripts run.
// Android WebView has no working Web Speech API, so SpeechRecognition and
// speechSynthesis are re-implemented on top of the native Android services
// exposed as window.LuminoNative.
(function () {
  if (window.__luminoBridge || !window.LuminoNative) return;
  window.__luminoBridge = true;
  var N = window.LuminoNative;

  function Emitter() {}
  Emitter.prototype.addEventListener = function (type, fn) {
    (this._l || (this._l = {}))[type] = (this._l[type] || []).concat(fn);
  };
  Emitter.prototype.removeEventListener = function (type, fn) {
    if (!this._l || !this._l[type]) return;
    this._l[type] = this._l[type].filter(function (f) { return f !== fn; });
  };
  Emitter.prototype._emit = function (type, ev) {
    ev = ev || {};
    ev.type = type;
    ev.target = this;
    var h = this["on" + type];
    try { if (typeof h === "function") h.call(this, ev); } catch (e) { console.error(e); }
    var ls = (this._l && this._l[type]) || [];
    for (var i = 0; i < ls.length; i++) {
      try { ls[i].call(this, ev); } catch (e) { console.error(e); }
    }
  };

  // ── Speech-to-text ────────────────────────────────────────────────
  var activeRec = null;

  function Recognition() {
    this.lang = "";
    this.continuous = false;
    this.interimResults = false;
    this.maxAlternatives = 1;
  }
  Recognition.prototype = Object.create(Emitter.prototype);
  Recognition.prototype.constructor = Recognition;
  Recognition.prototype.start = function () {
    if (activeRec && activeRec !== this) activeRec.abort();
    activeRec = this;
    N.startRecognition(this.lang || document.documentElement.lang || "", !!this.interimResults);
  };
  Recognition.prototype.stop = function () {
    if (activeRec === this) N.stopRecognition();
  };
  Recognition.prototype.abort = function () {
    if (activeRec === this) N.abortRecognition();
  };

  window.SpeechRecognition = Recognition;
  window.webkitSpeechRecognition = Recognition;

  window.__luminoRecognition = function (type, text, isFinal) {
    var rec = activeRec;
    if (!rec) return;
    if (type === "result") {
      var alt = { transcript: text, confidence: isFinal ? 0.9 : 0 };
      var result = [alt];
      result.isFinal = !!isFinal;
      result.item = function (i) { return result[i]; };
      var results = [result];
      results.item = function (i) { return results[i]; };
      rec._emit("result", { resultIndex: 0, results: results });
    } else if (type === "error") {
      rec._emit("error", { error: text, message: text });
    } else {
      rec._emit(type);
      if (type === "end" && activeRec === rec) activeRec = null;
    }
  };

  // ── Text-to-speech ────────────────────────────────────────────────
  var utterances = {};
  var nextId = 1;

  function Utterance(text) {
    this.text = text || "";
    this.lang = "";
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  }
  Utterance.prototype = Object.create(Emitter.prototype);
  Utterance.prototype.constructor = Utterance;

  var voices = [];
  try {
    voices = JSON.parse(N.getVoices()).map(function (lang, i) {
      return { name: "Android " + lang, lang: lang, voiceURI: "android:" + lang, localService: true, default: i === 0 };
    });
  } catch (e) {}

  var synth = new Emitter();
  synth.speaking = false;
  synth.pending = false;
  synth.paused = false;
  synth.getVoices = function () { return voices.slice(); };
  synth.speak = function (u) {
    var id = String(nextId++);
    utterances[id] = u;
    synth.pending = true;
    var lang = u.lang || (u.voice && u.voice.lang) || document.documentElement.lang || "";
    N.speak(id, String(u.text || ""), lang, Number(u.rate) || 1, Number(u.pitch) || 1);
  };
  // Interrupted utterances get their "end" event from the native onStop callback.
  synth.cancel = function () {
    N.stopSpeaking();
  };
  synth.pause = function () {};
  synth.resume = function () {};

  window.__luminoTts = function (id, type) {
    var u = utterances[id];
    if (type === "start") synth.speaking = true;
    if (type !== "start") {
      delete utterances[id];
      if (!Object.keys(utterances).length) { synth.speaking = false; synth.pending = false; }
    }
    if (u) u._emit(type === "error" ? "error" : type, type === "error" ? { error: "synthesis-failed" } : { utterance: u });
  };

  window.SpeechSynthesisUtterance = Utterance;
  try {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, get: function () { return synth; } });
  } catch (e) {
    window.speechSynthesis = synth;
  }

  // ── Vibration (WebView ignores navigator.vibrate) ─────────────────
  try {
    navigator.vibrate = function (pattern) {
      N.vibrate(JSON.stringify(Array.isArray(pattern) ? pattern : [Number(pattern) || 0]));
      return true;
    };
  } catch (e) {}
})();
