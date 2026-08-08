# GEMINI.md

## Core Principles

- State assumptions explicitly before coding. If uncertain, state the assumption made and proceed — add any questions at the end of the response.
- If multiple interpretations exist, present them — do not pick silently.
- Implement only what was requested. No unrequested features, abstractions, or flexibility.
- When editing existing code, touch only what was asked. Do not improve unrelated code.
- Remove imports, variables, and functions made unused by your own changes. Leave pre-existing dead code alone.
- For multi-step tasks, present a brief plan first and verify each step before moving on.

---

## Output Language

- All UI text, labels, and button text must be written in **Korean**.
- Code comments are optional in Korean — use judgment based on clarity.
- Variable names, function names, and class names must remain in English.

---

## Communication Style

All explanations, questions, and error messages must be written in language **an elementary school student can understand**.

- No technical jargon. Use analogies and examples first.
- Never pass raw error messages to the user. Always rephrase into plain terms.

| ❌ 하면 안 되는 표현 | ✅ 대신 이렇게 |
|---|---|
| "TypeError가 발생했습니다" | "버튼을 눌렀을 때 필요한 정보가 없어서 막혔어요" |
| "함수가 정의되지 않았습니다" | "어떤 동작을 하려고 했는데, 그 동작을 만들어두지 않았어요" |
| "레이아웃 충돌이 발생했습니다" | "두 가지를 같은 자리에 놓으려다 부딪혔어요" |

---

## File & Folder Defaults

- Each version is delivered in its own folder: `v1/`, `v2/`, `v3/`, ...
- Split files by role inside each folder: `index.html`, `style.css`, `script.js` (add more if needed).
- Use CDN links for any external libraries.

### Project Initialization

When starting a project for the first time, create this structure before writing any code:

```
project/
├── assets/
│   ├── sounds/
│   └── images/
└── v1/
    ├── index.html
    ├── style.css
    └── script.js
```

The `assets/` folder is shared across all versions and must be created before any version folder.

---

## Version Rules

### When to create a new version folder

Create a new version folder when **any one** of the following is true:

- A feature is **added** or **removed** (see gray area guide below)
- The user says any of: **"저장", "완성", "새 버전", "버전 올려줘"**

**Gray area guide — when in doubt, use these examples:**

| Case | Action |
|---|---|
| Adding a new button or screen | New version |
| Removing an existing feature | New version |
| Changing how a score is calculated | New version |
| Changing what a button does | New version |
| Fixing a button that doesn't respond | Overwrite |
| Changing text, colors, or font size | Overwrite |
| Adjusting spacing or layout | Overwrite |

If still unclear, **ask the user** before deciding.

### When to overwrite the current version

- Bug fixes
- Text, color, or font changes
- Layout and spacing adjustments

### Version Review (required after every new version)

After creating a new version, always provide a comparison in this format:

**For v1 (first version):**
```
### 📋 v1 — 첫 번째 버전이에요!

✅ 만들어진 것
- (구현된 기능 목록)
```

**For v2 and beyond:**
```
### 📋 v2에서 달라진 점 (v1 → v2)

✅ 새로 생긴 것
- (추가된 기능)

❌ 없어진 것
- (삭제된 기능)

🔧 바뀐 것
- (수정된 내용)
```

---

## Asset Management

- All generated sound and image files go **outside version folders**, in `assets/`.
- Once an asset is generated, **do not regenerate it** unless explicitly requested.
- Reference assets from version folders using relative paths: `../assets/sounds/click.mp3`

### Folder Structure Example

```
project/
├── assets/
│   ├── sounds/
│   │   └── click.mp3
│   └── images/
│       └── background.png
├── v1/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── v2/
    ├── index.html
    ├── style.css
    └── script.js
```

---

## Design & Image Requests

When a user requests design, images, or visual elements, do not implement immediately.

1. Explain the options in language an elementary school student can understand.
2. Ask one short question to confirm the exact requirement.
3. Implement only after confirmation.

Example:
> "어떤 느낌으로 만들어 드릴까요? 예를 들어, 귀여운 캐릭터가 있는 느낌? 아니면 깔끔하고 색깔만 예쁜 느낌?"

---

## Responsive Web Defaults

Every UI must work on both mobile and PC.

- Always include `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Use `flexbox` or `grid` for layout
- Breakpoints: mobile `max-width: 768px` / PC `min-width: 769px`
- Use relative units (`%`, `vw`, `rem`) instead of fixed `px` widths
- Minimum touch target size: `48px × 48px`
- Images must include `max-width: 100%; height: auto`
