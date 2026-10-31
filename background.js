/* ==============================
   Service worker initialization
   ============================== */

console.log("BACKGROUND.JS STARTED");


/* ==============================
   Message handling
   ============================== */

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        console.log(
            "BACKGROUND RECEIVED:",
            message
        );

        if (message.type !== "SAVE_WORD") {
            return;
        }

        saveWord(message.wordData)
            .then(() => {
                console.log(
                    "WORD SAVED:",
                    message.wordData
                );

                sendResponse({
                    success: true
                });
            })
            .catch((error) => {
                console.error(
                    "SAVE ERROR:",
                    error
                );

                sendResponse({
                    success: false
                });
            });

        // Keep the message channel open for the async response.
        return true;
    }
);


/* ==============================
   Word storage
   ============================== */

async function saveWord(wordData) {
    const result =
        await chrome.storage.local.get(
            ["words"]
        );

    const words =
        result.words || [];

    const normalizedWord =
        wordData.word
            .trim()
            .toLowerCase();

    const normalizedTranslation =
        (wordData.translation || "")
            .trim()
            .toLowerCase();


    /* ==============================
       Duplicate check
       ============================== */

    /*
     * The same word with the same translation
     * is treated as a duplicate.
     *
     * The same word with a different translation
     * is allowed.
     */

    const alreadyExists =
        words.some(
            (item) => {
                const itemWord =
                    (item.word || "")
                        .trim()
                        .toLowerCase();

                const itemTranslation =
                    (item.translation || "")
                        .trim()
                        .toLowerCase();

                return (
                    itemWord === normalizedWord &&
                    itemTranslation ===
                        normalizedTranslation
                );
            }
        );

    if (alreadyExists) {
        console.log(
            "WORD ALREADY EXISTS:",
            wordData.word,
            "→",
            wordData.translation
        );

        return;
    }


    /* ==============================
       Create new word
       ============================== */

    const newWord = {
        word:
            wordData.word
                .trim(),

        translation:
            wordData.translation
                ?.trim() || "",

        example:
            wordData.example
                ?.trim() || "",

        example_translation:
            wordData.example_translation
                ?.trim() || ""
    };

    words.push(newWord);


    /* ==============================
       Sort vocabulary
       ============================== */

    words.sort(
        (a, b) =>
            a.word.localeCompare(
                b.word,
                "en",
                {
                    sensitivity: "base"
                }
            )
    );


    /* ==============================
       Persist vocabulary
       ============================== */

    await chrome.storage.local.set({
        words
    });
}