package de.infinitymade.luminofit;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.text.TextUtils;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;

/**
 * Native services exposed to the web app as window.LuminoNative.
 * assets/bridge.js wraps these into the standard Web Speech / Vibration APIs.
 */
final class NativeBridge {

    private final MainActivity activity;
    private final WebView webView;
    private final Handler main = new Handler(Looper.getMainLooper());

    private SpeechRecognizer recognizer;
    private String pendingLang;
    private boolean pendingInterim;

    private TextToSpeech tts;
    private boolean ttsReady;
    private boolean ttsInitDone;
    private final List<Runnable> ttsQueue = new ArrayList<>();

    NativeBridge(MainActivity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        tts = new TextToSpeech(activity, status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            ttsInitDone = true;
            if (ttsReady) {
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { ttsEvent(id, "start"); }
                    @Override public void onDone(String id) { ttsEvent(id, "end"); }
                    @Override public void onError(String id) { ttsEvent(id, "error"); }
                    @Override public void onStop(String id, boolean interrupted) { ttsEvent(id, "end"); }
                });
            }
            for (Runnable r : ttsQueue) r.run();
            ttsQueue.clear();
        });
    }

    // ── Speech-to-text ────────────────────────────────────────────────

    @JavascriptInterface
    public void startRecognition(String lang, boolean interim) {
        main.post(() -> {
            if (!activity.hasPermission(Manifest.permission.RECORD_AUDIO)) {
                activity.requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, granted -> {
                    if (granted) beginRecognition(lang, interim);
                    else {
                        recognitionEvent("error", "not-allowed", false);
                        recognitionEvent("end", null, false);
                    }
                });
                return;
            }
            beginRecognition(lang, interim);
        });
    }

    @JavascriptInterface
    public void stopRecognition() {
        main.post(() -> {
            if (recognizer != null) recognizer.stopListening();
        });
    }

    @JavascriptInterface
    public void abortRecognition() {
        main.post(() -> {
            if (recognizer != null) {
                recognizer.cancel();
                recognitionEvent("end", null, false);
            }
        });
    }

    private void beginRecognition(String lang, boolean interim) {
        if (!SpeechRecognizer.isRecognitionAvailable(activity)) {
            recognitionEvent("error", "service-not-allowed", false);
            recognitionEvent("end", null, false);
            return;
        }
        if (recognizer != null) recognizer.destroy();
        recognizer = SpeechRecognizer.createSpeechRecognizer(activity);
        recognizer.setRecognitionListener(new RecognitionListener() {
            private boolean ended;

            @Override public void onReadyForSpeech(Bundle params) {
                recognitionEvent("start", null, false);
                recognitionEvent("audiostart", null, false);
            }
            @Override public void onBeginningOfSpeech() { recognitionEvent("speechstart", null, false); }
            @Override public void onRmsChanged(float rmsdB) { }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onEndOfSpeech() { recognitionEvent("speechend", null, false); }
            @Override public void onEvent(int eventType, Bundle params) { }

            @Override public void onPartialResults(Bundle partial) {
                String text = firstResult(partial);
                if (!TextUtils.isEmpty(text)) recognitionEvent("result", text, false);
            }

            @Override public void onResults(Bundle results) {
                String text = firstResult(results);
                if (!TextUtils.isEmpty(text)) recognitionEvent("result", text, true);
                end();
            }

            @Override public void onError(int error) {
                recognitionEvent("error", errorName(error), false);
                end();
            }

            private void end() {
                if (ended) return;
                ended = true;
                recognitionEvent("end", null, false);
            }
        });

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, interim);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        if (!TextUtils.isEmpty(lang)) {
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
        }
        recognizer.startListening(intent);
    }

    private static String firstResult(Bundle bundle) {
        if (bundle == null) return null;
        ArrayList<String> list = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return list == null || list.isEmpty() ? null : list.get(0);
    }

    private static String errorName(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "no-speech";
            case SpeechRecognizer.ERROR_AUDIO:
                return "audio-capture";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "not-allowed";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
            case SpeechRecognizer.ERROR_SERVER:
                return "network";
            case SpeechRecognizer.ERROR_CLIENT:
                return "aborted";
            default:
                return "service-not-allowed";
        }
    }

    private void recognitionEvent(String type, String text, boolean isFinal) {
        String js = "window.__luminoRecognition&&window.__luminoRecognition("
                + JSONObject.quote(type) + "," + JSONObject.quote(text == null ? "" : text) + "," + isFinal + ")";
        main.post(() -> webView.evaluateJavascript(js, null));
    }

    // ── Text-to-speech ────────────────────────────────────────────────

    @JavascriptInterface
    public String getVoices() {
        JSONArray out = new JSONArray();
        try {
            if (ttsReady && tts.getAvailableLanguages() != null) {
                Set<String> tags = new TreeSet<>();
                for (Locale l : tts.getAvailableLanguages()) tags.add(l.toLanguageTag());
                for (String t : tags) out.put(t);
            }
        } catch (RuntimeException ignored) {
            // Some TTS engines throw here; fall back to the device locale.
        }
        if (out.length() == 0) {
            out.put("tr-TR");
            out.put(Locale.getDefault().toLanguageTag());
        }
        return out.toString();
    }

    @JavascriptInterface
    public void speak(String id, String text, String lang, double rate, double pitch) {
        main.post(() -> {
            Runnable r = () -> {
                if (!ttsReady) {
                    ttsEvent(id, "error");
                    return;
                }
                if (!TextUtils.isEmpty(lang)) tts.setLanguage(Locale.forLanguageTag(lang));
                tts.setSpeechRate((float) rate);
                tts.setPitch((float) pitch);
                tts.speak(text, TextToSpeech.QUEUE_ADD, null, id);
            };
            if (ttsInitDone) r.run();
            else ttsQueue.add(r);
        });
    }

    @JavascriptInterface
    public void stopSpeaking() {
        main.post(() -> {
            if (ttsReady) tts.stop();
        });
    }

    private void ttsEvent(String id, String type) {
        String js = "window.__luminoTts&&window.__luminoTts(" + JSONObject.quote(id) + "," + JSONObject.quote(type) + ")";
        main.post(() -> webView.evaluateJavascript(js, null));
    }

    // ── Vibration ─────────────────────────────────────────────────────

    @JavascriptInterface
    public void vibrate(String patternJson) {
        try {
            JSONArray arr = new JSONArray(patternJson);
            Vibrator v = activity.getSystemService(Vibrator.class);
            if (v == null || !v.hasVibrator()) return;
            if (arr.length() == 0 || (arr.length() == 1 && arr.getLong(0) <= 0)) {
                v.cancel();
                return;
            }
            if (arr.length() == 1) {
                v.vibrate(VibrationEffect.createOneShot(arr.getLong(0), VibrationEffect.DEFAULT_AMPLITUDE));
                return;
            }
            // Web patterns start with "vibrate"; Android waveforms start with "off".
            long[] timings = new long[arr.length() + 1];
            for (int i = 0; i < arr.length(); i++) timings[i + 1] = Math.max(0, arr.getLong(i));
            v.vibrate(VibrationEffect.createWaveform(timings, -1));
        } catch (Exception ignored) {
            // Malformed pattern from the page; nothing to do.
        }
    }

    void destroy() {
        if (recognizer != null) recognizer.destroy();
        if (tts != null) tts.shutdown();
    }
}
