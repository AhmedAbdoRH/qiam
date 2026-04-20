

## Plan: Long Press on Chat Button Opens مناجاة + Style Updates

### What Changes

**1. Add مناجاة (ChatWidget) to the Feelings page (Index.tsx)**
- Import ChatWidget into Index.tsx
- Render it alongside SelfDialogueChat (but it won't have its own floating button — it will be triggered by long press)

**2. Modify SelfDialogueChat trigger button to support long press**
- Add long press detection (1.5s) on the floating button
- On long press: instead of opening the self-dialogue, open the مناجاة
- On normal tap: open self-dialogue as usual
- This requires lifting the مناجاة open state or using a callback

**3. Refactor ChatWidget to accept external open/close control**
- Add `externalOpen` and `onExternalClose` props to ChatWidget
- When used from Index page, it won't render its own floating button — only the dialog
- When used from Divinity page, it keeps its current button

**4. Style updates for مناجاة (ChatWidget.tsx)**
- Messages: change from transparent/no-bg to `bg-gray-700/60` with inner glow (`shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]`)
- Send button: change from `bg-sky-500` to dark gray glowing style (`bg-gray-600/80` with `shadow-[0_0_15px_rgba(255,255,255,0.1)]`)

### Files Modified

| File | Change |
|------|--------|
| `src/components/ChatWidget.tsx` | Add props for external control, update message and send button styles |
| `src/components/SelfDialogueChat.tsx` | Add long press on trigger button to call `onLongPress` callback |
| `src/pages/Index.tsx` | Import ChatWidget, wire long press from SelfDialogueChat to open مناجاة |

