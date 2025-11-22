import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: "root" })
export class TtsService {
    private readonly http = inject(HttpClient);
    private readonly workerUrl = "https://tts.drdreo.workers.dev";
    private currentAudio: HTMLAudioElement | null = null;
    private readonly audioCache = signal(new Map<string, Blob>());

    isReading = signal(false);

    stopSynthesizedSpeech(): void {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
            this.isReading.set(false);
        }
    }

    async synthesizeSpeech(text: string): Promise<void> {
        // If already reading, stop it
        if (this.isReading()) {
            this.stopSynthesizedSpeech();
            return;
        }

        let audioBlob: Blob;

        // Check if we have this text cached
        const cachedAudio = this.audioCache().get(text);
        if (cachedAudio) {
            audioBlob = cachedAudio;
        } else {
            // Make the API request
            const requestBody = {
                audioConfig: {
                    audioEncoding: "LINEAR16",
                    pitch: 0,
                    speakingRate: 1
                },
                input: {
                    text: text
                },
                voice: {
                    languageCode: "en-GB",
                    name: "en-GB-Chirp3-HD-Achernar"
                }
            };

            const response = await firstValueFrom(
                this.http.post<{ audioContent: string }>(this.workerUrl, requestBody)
            );

            if (!response?.audioContent) {
                return;
            }

            // Decode the Base64 audio data
            const audioContent = response.audioContent;
            const binaryString = window.atob(audioContent);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create a Blob and cache it
            audioBlob = new Blob([bytes.buffer], { type: "audio/wav" }); // LINEAR16 is a WAV format
            this.audioCache.update(cache => {
                const newCache = new Map(cache);
                newCache.set(text, audioBlob);
                return newCache;
            });
        }

        // Create an Audio URL and play
        const audioUrl = URL.createObjectURL(audioBlob);
        this.currentAudio = new Audio(audioUrl);
        this.isReading.set(true);

        this.currentAudio.onended = () => {
            this.isReading.set(false);
            this.currentAudio = null;
            URL.revokeObjectURL(audioUrl); // Clean up the object URL
        };

        this.currentAudio.onerror = () => {
            this.isReading.set(false);
            this.currentAudio = null;
            URL.revokeObjectURL(audioUrl); // Clean up the object URL
        };

        await this.currentAudio.play();
    }

    nativeSpeech(text: string) {
        if (this.isReading()) {
            window.speechSynthesis.cancel();
            this.isReading.set(false);
            return;
        }

        this.isReading.set(true);
        const synth = window.speechSynthesis;
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.pitch = 1;
        utterThis.rate = 1;
        synth.speak(utterThis);

        utterThis.onend = () => {
            this.isReading.set(false);
        };
    }

    isAudioCached(text: string): boolean {
        return this.audioCache().has(text);
    }

    downloadCachedAudio(text: string, filename = "story-audio.wav"): void {
        const cachedAudio = this.audioCache().get(text);
        if (!cachedAudio) {
            return;
        }

        const audioUrl = URL.createObjectURL(cachedAudio);
        const link = document.createElement("a");
        link.href = audioUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(audioUrl);
    }
}
