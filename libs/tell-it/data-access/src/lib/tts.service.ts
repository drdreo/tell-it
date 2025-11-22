import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: "root" })
export class TtsService {
    private readonly http = inject(HttpClient);
    private readonly workerUrl = "https://tts.drdreo.workers.dev";
    private currentAudio: HTMLAudioElement | null = null;

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

        const response = await firstValueFrom(this.http.post<{ audioContent: string }>(this.workerUrl, requestBody));

        if (response?.audioContent) {
            // 2. Decode the Base64 audio data
            const audioContent = response.audioContent;
            const binaryString = window.atob(audioContent);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // 3. Create a Blob and an Audio URL
            const audioBlob = new Blob([bytes.buffer], { type: "audio/wav" }); // LINEAR16 is a WAV format
            const audioUrl = URL.createObjectURL(audioBlob);

            // 4. Play the audio
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
}
