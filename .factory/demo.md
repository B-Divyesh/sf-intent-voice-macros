# Say the Action demo

Open <https://intent-voice-macros.sociobot.in/?demo=1#workspace> or choose **Try it with sample data** on the first screen.

The demo starts with three approved commands for `support.example`:

- `focus ticket search` focuses a sample ticket-search field.
- `scroll to activity` moves to the sample activity list.
- `delete draft reply` opens the same Cancel / Run action safety choice used by the extension.

The banner stays visible while demo mode is active. **Reset demo** restores the three commands, the draft, and two realistic activity entries. **Start for real** deletes the demo workspace before returning home.

Demo state uses only `localStorage` key `demo:intent-voice-macros:workspace`. Demo mode never reads or writes `sb_license:intent-voice-macros` or extension storage. License return tokens are ignored in demo mode. Tests intercept billing fixtures, so the demo never calls checkout or spends money.
