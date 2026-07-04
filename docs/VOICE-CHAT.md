# Voice Chat — Nex Staff

## Mục tiêu

Thêm **voice input/output** vào RPG dialogue — user nói với Assistant/Staff như NPC trong game, không biến Nex Staff thành chat app thông thường.

**Nguyên tắc:**

- Voice **bổ sung** text dialogue, không thay thế hoàn toàn
- Một luồng agent duy nhất: STT → text → `POST /api/chat` (hiện tại) → TTS
- Giữ immersion: typewriter NPC lines + optional voice readback; push-to-talk mặc định
- Staff async workflow **không** đổi — voice chỉ áp dụng lớp Assistant dialogue sync

**Phases:** V1 (Phase 2) push-to-talk + TTS readback · V2 (Phase 3) streaming + chiptune SFX · V3 (TBD) duplex live session

---

## User stories

| ID     | Story                                                                                         | Acceptance criteria                                              |
| ------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| VC-01  | Là user, tôi giữ nút mic và nói brief task thay vì gõ                                        | STT → text hiện trong dialogue input → submit như keyboard       |
| VC-02  | Là user, tôi nghe Assistant đọc dialogue line sau typewriter                                  | TTS phát sau line complete; có thể tắt trong settings            |
| VC-03  | Là user, tôi chọn choice bằng giọng ("A", "Yes") khi menu hiện                               | STT map tới choice label/shortcut trong `player-choice`          |
| VC-04  | Là user, tôi thấy trạng thái mic rõ ràng (idle / listening / processing)                      | Pixel mic indicator; không ghi khi Assistant đang stream         |
| VC-05  | Là user, transcript vẫn lưu trong chat log như text message                                   | `chat` / `chat_message` persistence không đổi                    |

---

## Kiến trúc

Voice là **adapter layer** trên dialogue hiện có — không fork agent runtime.

```mermaid
flowchart TB
    subgraph client [Client — Dialogue Overlay]
        Mic[VoiceControl push-to-talk]
        STT[useVoiceInput]
        Engine[useDialogueEngine]
        TTS[useVoiceOutput]
        Chat[useChat + DefaultChatTransport]
    end

    subgraph api [Next.js API]
        Transcribe["POST /api/voice/transcribe"]
        Speak["POST /api/voice/speak"]
        ChatAPI["POST /api/chat"]
    end

    subgraph providers [Providers]
        GeminiSTT[Gemini / Google STT]
        GeminiTTS[Google TTS or Gemini]
    end

    Mic --> STT
    STT --> Transcribe
    Transcribe --> GeminiSTT
    STT --> Engine
    Engine --> Chat
    Chat --> ChatAPI
    ChatAPI --> Engine
    Engine --> TTS
    TTS --> Speak
    Speak --> GeminiTTS
```

### Luồng V1 (push-to-talk)

1. User giữ **mic** trong `player-input` hoặc `player-choice`
2. Browser ghi audio (WebM/Opus) → `POST /api/voice/transcribe` với `chatId`, `locale?`
3. Server trả `{ text, confidence? }` → điền `DialogueInput` hoặc auto-submit nếu user bật
4. `sendMessage` qua transport hiện tại → `/api/chat` (không đổi contract agent)
5. Khi NPC line typewriter xong → optional `POST /api/voice/speak` → phát audio qua `HTMLAudioElement`

### Tại sao không gửi audio thẳng vào `/api/chat`?

- Assistant tools, persistence, và `ToolLoopAgent` đã chuẩn hóa trên **UIMessage text**
- Tách STT/TTS giữ boundary rõ, dễ test, dễ swap provider
- Phase 3 có thể thêm **Gemini Live** session riêng nếu cần duplex — vẫn sync transcript về `chat`

---

## Phased scope

### V1 — Dialogue voice (Phase 2)

| Area        | Deliverable                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| Input       | Push-to-talk mic trên `DialogueInput`; transcript preview trước send       |
| Output      | TTS readback cho NPC lines (`npc-speaking`); user toggle global           |
| API         | `POST /api/voice/transcribe`, `POST /api/voice/speak`                       |
| UX          | Mic states: idle / listening / transcribing; disable khi `isBusy`         |
| Persistence | Lưu text transcript only (giống typed message)                              |
| Surfaces    | `DialogueOverlay` (Reception, staff, task-scoped assistant panel)           |

**Không làm V1:**

- Always-on listening / wake word
- Voice cho Archive Room, Task Board (text-only overlays)
- Staff workflow voice (async layer)

### V2 — Polish (Phase 3, cùng chiptune SFX)

| Area     | Deliverable                                                              |
| -------- | ------------------------------------------------------------------------ |
| Input    | Streaming partial transcript; voice choice selection                     |
| Output   | Sentence-chunk TTS during stream (bắt đầu sau first sentence)            |
| Audio UX | Chiptune blip SFX mic on/off; optional 8-bit voice filter post-processing |
| Settings | Per-user prefs: `voiceInputEnabled`, `voiceOutputEnabled`, `locale`      |

### V3 — Live session (TBD)

- Gemini Live API hoặc WebRTC duplex cho “phone call với Assistant”
- Interrupt barge-in khi user nói trong lúc TTS
- Đánh giá cost/latency trước khi commit

---

## Cấu trúc thư mục (đề xuất)

Khớp layout hiện tại (`components/dialogue`, `hooks`, `lib`, `app/api`):

```
src/
├── app/api/voice/
│   ├── transcribe/route.ts      # Audio blob → text
│   └── speak/route.ts           # Text → audio (base64 or stream)
├── components/dialogue/
│   ├── dialogue-input.tsx       # + VoiceControl slot
│   └── voice-control.tsx        # Push-to-talk pixel mic button
├── hooks/
│   ├── use-voice-input.ts       # MediaRecorder, transcribe API
│   ├── use-voice-output.ts      # speak API, queue, interrupt
│   └── use-voice-preferences.ts # localStorage / user settings
└── lib/voice/
    ├── constants.ts             # MIME types, max duration, locales
    ├── server/
    │   ├── transcribe.ts        # Provider call (Gemini audio)
    │   └── synthesize.ts        # TTS provider call
    └── types.ts                 # VoiceTranscribeResult, VoiceSpeakRequest
```

**Integration points (existing):**

| File | Change |
| ---- | ------ |
| `dialogue-input.tsx` | Render `VoiceControl`; merge STT text vào textarea |
| `use-dialogue-engine.ts` | Optional callback `onNpcLineComplete` → trigger TTS |
| `dialogue-overlay.tsx` | Wire `useVoiceOutput`; stop TTS on close/Esc |
| `choice-menu.tsx` | Optional voice pick via STT → `selectChoice` |
| `lib/chat/persistence.ts` | No change — messages remain text |

---

## API (planned)

Chi tiết REST bổ sung vào [API.md](API.md#voice-planned).

### `POST /api/voice/transcribe`

**Auth:** session required

**Request:** `multipart/form-data`

| Field    | Type   | Required | Description                    |
| -------- | ------ | -------- | ------------------------------ |
| `audio`  | file   | yes      | WebM/Opus or WAV, max 60s V1   |
| `chatId` | uuid   | no       | Audit / rate context           |
| `locale` | string | no       | e.g. `vi`, `en-US`             |

**Response:**

```json
{
  "text": "Viết blog về AI agents cho startup founders",
  "durationMs": 4200,
  "locale": "vi"
}
```

### `POST /api/voice/speak`

**Auth:** session required

**Request:**

```json
{
  "text": "Đã giao cho Alex. Bạn có thể tiếp tục chat.",
  "speakerId": "assistant",
  "locale": "vi"
}
```

**Response V1:** `audio/mpeg` or JSON `{ "audioBase64": "...", "contentType": "audio/mpeg" }`

**Limits:** truncate at ~500 chars per request V1; strip markdown for TTS

---

## UI/UX

Xem [UI-UX.md — Voice in Dialogue](UI-UX.md#voice-in-dialogue-planned).

| State           | Mic                         | TTS                                    |
| --------------- | --------------------------- | -------------------------------------- |
| `npc-speaking`  | Hidden / disabled           | Play after typewriter if enabled       |
| `player-choice` | Optional hold-to-speak      | Stop any playing NPC audio             |
| `player-input`  | Push-to-talk + text field   | Disabled                               |
| `isBusy`        | Disabled                    | Queue or skip until stream ends        |

**Pixel mic button** — cùng design system `#16`:

```
┌──────────────────────────────────────────────────┐
│  ▼ Boss (bạn)                                    │
│  [transcript preview while holding mic...]         │
│                              [🎤] [Gửi ▶] [📎]   │
└──────────────────────────────────────────────────┘
```

- 🎤 hold = listening (border pulse `--color-sun-glow`)
- Release = transcribing spinner on mic
- Error = brief pixel toast "Couldn't hear that — try again"

**Accessibility:**

- Keyboard-only path unchanged
- `aria-pressed` on mic; live region for transcript
- Captions: dialogue text vẫn hiển thị (voice không thay thế visual)

---

## Provider strategy

Project đã dùng **Google Gemini** (`@ai-sdk/google`).

| Capability | V1 recommendation | Fallback |
| ---------- | ------------------- | -------- |
| STT        | Gemini multimodal audio input (server-side) | Browser `SpeechRecognition` (Chrome only) |
| TTS        | Google Cloud Text-to-Speech or Gemini TTS API | `speechSynthesis` (dev/local only) |

**Env vars (planned):**

```bash
# Existing
GOOGLE_GENERATIVE_AI_API_KEY=

# Optional V1 — if using Cloud TTS separately
GOOGLE_CLOUD_TTS_API_KEY=
# or service account for TTS
```

**Cost controls V1:**

- Max recording 60s per utterance
- Rate limit per user (defer to Phase 4 Redis — document intent in API)
- Skip TTS when `voiceOutputEnabled === false`

---

## Data model

**V1: no schema change.** Transcripts persist as existing `chat_message` text parts.

**V2 (optional):** `user.metadata.voicePreferences`:

```typescript
interface VoicePreferences {
  inputEnabled: boolean;
  outputEnabled: boolean;
  locale: string;
  speakerVoiceId?: string; // TTS voice mapping per assistant/staff
}
```

**Không lưu raw audio** in V1 (privacy + storage). Optional debug flag in dev only.

---

## Dialogue state integration

```typescript
// hooks/use-voice-session.ts (conceptual)
interface UseVoiceSessionOptions {
  chatId: string;
  speakerId: string;
  enabled: boolean;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}

interface UseVoiceSessionResult {
  state: "idle" | "listening" | "transcribing" | "speaking";
  startListening: () => void;
  stopListening: () => void;
  stopSpeaking: () => void;
  isSupported: boolean;
}
```

Hook compose trong `DialogueOverlayPanel` — không đặt logic voice trong `ToolLoopAgent`.

---

## Testing & eval

| Test type | Scope |
| --------- | ----- |
| Unit      | `lib/voice/server/transcribe` mock provider; markdown strip for TTS |
| Integration | `POST /api/voice/transcribe` with fixture audio blob |
| E2E       | Playwright: hold mic → mock transcribe → message in dialogue log |
| Manual    | VI + EN short phrases; hire/delegate vocabulary |

**Eval (future):** STT word error rate on 20 in-domain phrases (staff names, "delegate", "blog").

---

## Risks

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Browser mic permissions denied | Feature unusable | Clear pixel prompt; fallback text-only |
| STT accuracy (Vietnamese) | Wrong delegate/hire | Show transcript before send V1; user edit |
| TTS latency | Breaks RPG pacing | Start TTS after typewriter; allow skip |
| Audio autoplay policies | TTS silent until gesture | First mic use unlocks audio context |
| Cost per minute | High usage bills | Duration caps; off by default for output |
| Gemini Live API churn | V3 blocked | V1/V2 provider-agnostic adapter layer |

---

## Acceptance criteria (V1)

- [ ] Push-to-talk in `DialogueOverlay` produces text message → same `/api/chat` stream as keyboard
- [ ] NPC line TTS optional, toggle in session (localStorage minimum)
- [ ] Mic disabled while Assistant streaming (`isBusy`)
- [ ] Transcript appears in Dialogue Log overlay
- [ ] Works on Chrome + Firefox desktop; graceful degrade Safari
- [ ] No raw audio persisted in production

---

## Phụ thuộc

| Dependency | Required by |
| ---------- | ----------- |
| Dialogue overlay stable (#5) | V1 |
| `/api/chat` + persistence | V1 |
| Pixel design system (#16) | V1 mic button |
| Google STT/TTS or Gemini audio | V1 |
| Chiptune SFX (#ROADMAP Phase 3) | V2 polish |

## Tài liệu liên quan

- [UI-UX.md](UI-UX.md) — Dialogue states, immersion rules
- [ARCHITECTURE.md](ARCHITECTURE.md) — Client/API layers
- [API.md](API.md) — REST contract
- [VOICE-CHAT.md](VOICE-CHAT.md) — Voice input/output plan
- [ROADMAP.md](ROADMAP.md) — Phase 2/3 placement
- [PRD.md](PRD.md) — US-14 voice user story

Part of #2
