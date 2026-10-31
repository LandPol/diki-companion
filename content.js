/* ==============================
   Theme and Advertisement Control
   ============================== */

chrome.storage.local.get(
    ["darkMode", "blockAds"],
    (result) => {

        const darkModeEnabled =
            result.darkMode ?? true;

        const adsEnabled =
            result.blockAds ?? false;

        setDarkMode(
            darkModeEnabled
        );

        setAdBlocking(
            adsEnabled
        );
    }
);

// Enable or disable the dark theme.
function setDarkMode(enabled) {
    document.documentElement.classList.toggle(
        "diki-dark-mode",
        enabled
    );
}

// Enable or disable advertisement blocking.
function setAdBlocking(enabled) {

    document.documentElement.classList.toggle(
        "diki-ads-blocked",
        enabled
    );

}

// Listen for theme changes sent from the extension popup.
chrome.runtime.onMessage.addListener(
    (message) => {
        if (message.type === "TOGGLE_DARK_MODE") {
            setDarkMode(message.enabled);
        }
    }
);


/* ==============================
   Diki Vocabulary Collector
   ============================== */


/*
 * Extracts vocabulary data from the current Diki search results.
 *
 * Supports two different Diki page layouts:
 * 1. Structured layout using nativeToForeignEntrySlices.
 * 2. Simple layout using individual meaning elements.
 *
 * The returned object always follows the same format:
 * {
 *     word: English headword,
 *     translation: Polish translation,
 *     example: English example sentence,
 *     example_translation: Polish example translation
 * }
 *
 * The function also detects the translation direction to ensure
 * that vocabulary is always stored as English → Polish.
 */
function collectDikiWord() {
    const searchQuery = new URLSearchParams(
        window.location.search
    ).get("q")?.trim() || "";

    const pageTitle = (document.title || "")
        .toLocaleLowerCase("pl");

    // Determine the translation direction from the page title.
    let pageDirection = null;

    if (pageTitle.includes("tłumaczenie po polsku")) {
        pageDirection = "en-pl";
    } else if (pageTitle.includes("tłumaczenie po angielsku")) {
        pageDirection = "pl-en";
    }

    // Normalize text before comparing words and translations.
    // This removes differences caused by capitalization,
    // diacritics, punctuation, underscores, and hyphens.
    function normalizeText(value) {
        return (value || "")
            .toLocaleLowerCase("pl")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[_-]+/g, " ")
            .replace(/[^\p{L}\p{N}\s']/gu, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // Extract the original search query from a repetition link.
    // Diki stores the relevant query inside the link's URL parameter.
    function getRepetitionQuery(container) {
        if (!container) return "";

        const link = Array.from(container.children).find(
            element =>
                element.matches(
                    'a.repetitionAddOrRemoveIconAnchor[href*="url="]'
                )
        );

        if (!link) return "";

        try {
            const url = new URL(
                link.getAttribute("href"),
                window.location.origin
            );

            const innerUrl = url.searchParams.get("url");

            if (innerUrl) {
                const innerUrlObject = new URL(
                    innerUrl,
                    window.location.origin
                );

                return (
                    innerUrlObject.searchParams.get("q") || ""
                ).trim();
            }
        } catch (error) {
            console.debug(
                "Failed to read repetition link:",
                error
            );
        }

        return "";
    }

    // Extract the English headword from its pronunciation audio filename.
    // This helps identify which part of the entry contains the English word.
    function getAudioFilename(headwordElement, container) {
        const headwordContainer =
            headwordElement?.closest(".hw");

        let recordingsContainer =
            headwordContainer?.nextElementSibling;

        if (
            !recordingsContainer?.matches(
                ".recordingsAndTranscriptions"
            )
        ) {
            recordingsContainer = container?.querySelector(
                ":scope > .recordingsAndTranscriptions"
            );
        }

        if (!recordingsContainer) return "";

        const audioElement =
            recordingsContainer.querySelector(
                ".en-GB [data-audio-url], " +
                ".en-US [data-audio-url]"
            );

        const audioUrl =
            audioElement?.getAttribute("data-audio-url") || "";

        return audioUrl
            .split("/")
            .pop()
            ?.replace(/\.mp3$/i, "")
            .replace(/_/g, " ") || "";
    }

    // Retrieve all visible Polish translations from a meaning element.
    // Duplicate translations are removed before joining them.
    function getVisibleTranslations(meaning) {
        const values = Array.from(meaning.children)
            .filter(element => element.matches("span.hw"))
            .map(element =>
                element.textContent
                    .replace(/\s+/g, " ")
                    .trim()
            )
            .filter(Boolean);

        return [...new Set(values)].join("; ");
    }

    // Retrieve the first example sentence and its Polish translation.
    // Audio controls, links, and translation elements are removed
    // from the cloned element when extracting the English sentence.
    function getExample(container) {
        let example = "";
        let exampleTranslation = "";

        const exampleElement = container.querySelector(
            "div.exampleSentence"
        );

        if (!exampleElement) {
            return {
                example,
                exampleTranslation
            };
        }

        const translationElement =
            exampleElement.querySelector(
                ".exampleSentenceTranslation"
            );

        if (translationElement) {
            exampleTranslation =
                translationElement.textContent
                    .trim()
                    .replace(/^\s*\(/, "")
                    .replace(/\)\s*$/, "");
        }

        const clone = exampleElement.cloneNode(true);

        clone.querySelectorAll(
            ".exampleSentenceTranslation, " +
            ".recordingsAndTranscriptions, a"
        ).forEach(element => element.remove());

        example = clone.textContent
            .replace(/\s+/g, " ")
            .trim();

        return {
            example,
            exampleTranslation
        };
    }

    // =================================================
    // VARIANT 1: Structured Diki page layout
    // Main structure: ol.nativeToForeignEntrySlices > li
    // =================================================

    const structuredEntries = document.querySelectorAll(
        "ol.nativeToForeignEntrySlices > li"
    );

    if (structuredEntries.length > 0) {
        for (const entry of structuredEntries) {
            // Locate the English headword in the entry header.
            const headwordElement = entry.querySelector(
                ":scope > span.hw a.plainLink"
            );

            if (!headwordElement) continue;

            const englishWord =
                headwordElement.textContent.trim();

            if (!englishWord) continue;

            // Locate the Polish meaning associated with this headword.
            let meaning = null;

            // Some entries contain the meaning directly inside
            // the main <li> element, without a nested meanings list.
            // Example: the entry for "cat".
            if (entry.matches('li[class*="meaning"]')) {
                meaning = entry;
            } else {
                // Other entries store their meanings inside
                // a nested ul.nativeToForeignMeanings element.
                meaning = entry.querySelector(
                    ':scope > ul.nativeToForeignMeanings > li[class*="meaning"]'
                );
            }

            if (!meaning) continue;

            // Read the main dictionary headword.
            // This is also used to detect Polish-to-English searches
            // when the page title does not reliably identify the direction.
            const dictionaryHeadword = document.querySelector(
                ".dictionaryEntity > .hws h1 > .hw"
            )?.textContent.trim() || "";

            // Detect a Polish-to-English search using the dictionary
            // headword and the original search query.
            const isPolishToEnglishStructured =
                searchQuery &&
                normalizeText(dictionaryHeadword) ===
                    normalizeText(searchQuery) &&
                /[ąćęłńóśźż]/i.test(dictionaryHeadword);

            let polishTranslation = "";

            // Polish-to-English search:
            // The original Polish search query is the translation.
            if (
                pageDirection === "pl-en" ||
                isPolishToEnglishStructured
            ) {
                polishTranslation =
                    searchQuery ||
                    getRepetitionQuery(meaning);

            // English-to-Polish search:
            // Retrieve the visible Polish meanings from the entry.
            } else if (pageDirection === "en-pl") {
                polishTranslation =
                    getVisibleTranslations(meaning);

            } else {
                // Skip the entry if the translation direction
                // cannot be determined reliably.
                console.debug(
                    "Nie rozpoznano kierunku tłumaczenia:",
                    {
                        pageTitle,
                        dictionaryHeadword,
                        searchQuery
                    }
                );

                continue;
            }

            if (!polishTranslation) continue;

            // Retrieve the audio filename to verify the English headword.
            const audioFilename = getAudioFilename(
                headwordElement,
                entry
            );

            // Check whether the audio filename matches the English headword.
            const audioMatchesWord =
                normalizeText(audioFilename) ===
                normalizeText(englishWord);

            if (
                audioFilename &&
                !audioMatchesWord
            ) {
                console.debug(
                    "Nazwa nagrania nie odpowiada hasłu:",
                    {
                        englishWord,
                        audioFilename
                    }
                );
            }

            // Skip entries that appear to contain a Polish headword
            // instead of an English one, unless the audio confirms otherwise.
            if (
                /[ąćęłńóśźż]/i.test(englishWord) &&
                !audioMatchesWord
            ) {
                console.debug(
                    "Pominięto prawdopodobnie polskie hasło:",
                    englishWord
                );

                continue;
            }

            // Retrieve the example sentence and its translation.
            const {
                example,
                exampleTranslation
            } = getExample(meaning);

            // Build the standardized vocabulary object.
            const result = {
                word: englishWord,
                translation: polishTranslation,
                example,
                example_translation: exampleTranslation
            };

            // Log the extracted data for debugging purposes.
            console.log(
                "DIKI PARSER - STRUCTURED:",
                {
                    searchQuery,
                    audioFilename,
                    result
                }
            );

            return result;
        }

        // No valid entry was found in the structured page layout.
        console.debug(
            "Nie udało się odczytać poprawnego wpisu z rozbudowanej struktury Diki."
        );

        return null;
    }

    // =================================================
    // VARIANT 2: Simple Diki page layout
    // Main structure: li.meaning...
    // =================================================

    const entries = document.querySelectorAll(
        'li[class*="meaning"]'
    );

    for (const meaning of entries) {
        // Locate the headword in the current meaning element.
        const wordElement = meaning.querySelector(
            ":scope > span.hw a.plainLink"
        );

        if (!wordElement) continue;

        const word = wordElement.textContent.trim();

        if (!word) continue;

        // Retrieve the search query stored in the repetition link.
        const translation =
            getRepetitionQuery(meaning);

        if (!translation) continue;

        // Retrieve the pronunciation audio filename for language detection.
        const audioFilename = getAudioFilename(
            wordElement,
            meaning
        );

        // Normalize all values before comparing them.
        const normalizedAudio =
            normalizeText(audioFilename);

        const normalizedWord =
            normalizeText(word);

        const normalizedTranslation =
            normalizeText(translation);

        // Determine whether the audio belongs to the displayed word
        // or to the translation stored in the repetition link.
        const audioMatchesWord =
            normalizedAudio !== "" &&
            normalizedWord === normalizedAudio;

        const audioMatchesTranslation =
            normalizedAudio !== "" &&
            normalizedTranslation === normalizedAudio;

        let englishWord = "";
        let polishTranslation = "";

        // If the audio identifies exactly one side,
        // use it to determine the English-to-Polish order.
        // Audio identification takes priority over the page title.
        if (
            normalizedAudio &&
            audioMatchesWord !== audioMatchesTranslation
        ) {
            if (audioMatchesWord) {
                englishWord = word;
                polishTranslation = translation;
            } else {
                englishWord = translation;
                polishTranslation = word;
            }

        // English-to-Polish search:
        // The repetition query contains the English headword.
        } else if (pageDirection === "en-pl") {
            englishWord = translation;
            polishTranslation = word;

        // Polish-to-English search:
        // The displayed word is English and the repetition query is Polish.
        } else if (pageDirection === "pl-en") {
            englishWord = word;
            polishTranslation = translation;

        } else {
            // Skip the entry if neither audio nor page title
            // provides enough information to determine the direction.
            console.debug(
                "Nie rozpoznano kierunku tłumaczenia:",
                {
                    pageTitle,
                    word,
                    translation
                }
            );

            continue;
        }

        // Ensure that both values are available and are not identical.
        if (
            !englishWord ||
            !polishTranslation ||
            normalizeText(englishWord) ===
                normalizeText(polishTranslation)
        ) {
            continue;
        }

        // Reject entries that appear to have a Polish word
        // incorrectly assigned as the English headword.
        // An audio match can confirm the correct language assignment.
        if (
            /[ąćęłńóśźż]/i.test(englishWord) &&
            !(
                audioMatchesTranslation ||
                audioMatchesWord
            )
        ) {
            console.debug(
                "Pominięto prawdopodobnie polskie hasło:",
                englishWord
            );

            continue;
        }

        // Retrieve the example sentence and its Polish translation.
        const {
            example,
            exampleTranslation
        } = getExample(meaning);

        // Build the standardized vocabulary object.
        const result = {
            word: englishWord,
            translation: polishTranslation,
            example,
            example_translation: exampleTranslation
        };

        // Log the extracted data for debugging purposes.
        console.log(
            "DIKI PARSER - SIMPLE:",
            {
                searchQuery,
                word,
                translation,
                audioFilename,
                result
            }
        );

        return result;
    }

    // No valid vocabulary entry was found in either parsing attempt.
    console.debug("Nie znaleziono poprawnego wpisu Diki.");

    return null;
}


/* ==============================
   Save Current Vocabulary Entry
   ============================== */

// Collect the current Diki entry and send it to the background script.
// If no valid entry is found, do not send a save request.
function saveCurrentDikiWord() {
    const wordData =
        collectDikiWord();

    if (!wordData) {
        return false;
    }

    console.log(
        "Found word:",
        wordData
    );

    chrome.runtime.sendMessage({
        type: "SAVE_WORD",
        wordData
    });

    return true;
}


/* ==============================
   Wait for Diki Search Results
   ============================== */

// Check periodically for loaded Diki results.
// Stop as soon as a valid entry has been saved.
// After 20 unsuccessful attempts, stop checking.
function waitForDikiResults() {
    let attempts = 0;

    const interval =
        setInterval(
            () => {
                attempts++;

                if (saveCurrentDikiWord()) {
                    clearInterval(interval);

                    return;
                }

                if (attempts >= 20) {
                    clearInterval(interval);

                    console.log(
                        "No Diki results found."
                    );
                }
            },
            500
        );
}


/* ==============================
   Initialization
   ============================== */

// Start checking for Diki results after the document is ready.
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        waitForDikiResults
    );
} else {
    waitForDikiResults();
}