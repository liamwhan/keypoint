const KeyState: KeyState = {
    CtrlDown: false,
    AltDown: false,
    ShiftDown: false,
    MetaKeyDown: false,
    KeyCode: ""
};

const keyDownListener = window.addEventListener("keydown", (e) => {
    KeyState.CtrlDown = e.ctrlKey;
    KeyState.AltDown = e.altKey;
    KeyState.ShiftDown = e.shiftKey;
    KeyState.MetaKeyDown = e.metaKey;
    KeyState.KeyCode = e.key;

    window.PS.Publish(Channel.KEYDOWN, e.key, KeyState);
});



const keyUpListener = window.addEventListener("keyup", (e) => {
    KeyState.CtrlDown = e.ctrlKey;
    KeyState.AltDown = e.altKey;
    KeyState.ShiftDown = e.shiftKey;
    KeyState.MetaKeyDown = e.metaKey;
    KeyState.KeyCode = e.key;
    window.PS.Publish(Channel.KEYUP, e.key, KeyState);
});



