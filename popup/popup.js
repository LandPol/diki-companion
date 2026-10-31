// ==============================
// SQL.js / WASM
// ==============================

let SQL;

const sqlReady = initSqlJs({
    locateFile: (filename) =>
        chrome.runtime.getURL(
            "libraries/" + filename
        )
}).then((sql) => {
    SQL = sql;

    console.log("SQL.js WASM ready.");

    return sql;
}).catch((error) => {
    console.error(
        "SQL.js initialization error:",
        error
    );

    throw error;
});


// ==============================
// DOM elements
// ==============================

const checkbox =
    document.getElementById("darkMode");

const status =
    document.getElementById("status");

const blockAdsCheckbox =
    document.getElementById("blockAds");

const adsStatus =
    document.getElementById("adsStatus");

const searchInput =
    document.getElementById("searchWords");

const languageEnglish =
    document.getElementById("languageEnglish");

const languagePolish =
    document.getElementById("languagePolish");


// ==============================
// Application state
// ==============================

let allWords = [];
let currentSearch = "";


// ==============================
// Translations
// ==============================

const translations = {
    en: {
        appTitle:
            "Diki Companion",
        appSubtitle:
            "Your Diki learning companion",

        statusLabel: "Dark mode",
        enabled: "Enabled",
        disabled: "Disabled",

        adsStatusLabel: "Block ads",

        languageTitle: "Language",
        languageEnglish: "English",
        languagePolish: "Polish",

        vocabularyTitle:
            "My vocabulary",
        searchPlaceholder:
            "Search vocabulary...",

        addWord:
            "+ Add word",

        noSavedWords:
            "No saved words",
        noSearchResults:
            "No words found",

        clearDatabase:
            "Clear database",

        exportCsv:
            "Export CSV",
        exportAnki:
            "Export to Anki",
        exportTxt:
            "Export TXT",
        exportDatabase:
            "Export database",
        importDatabase:
            "Import database",

        wordPlaceholder:
            "Word",
        translationPlaceholder:
            "Translation",
        examplePlaceholder:
            "Example",
        exampleTranslationPlaceholder:
            "Example translation",
        tagsPlaceholder:
            "Tags, e.g. travel, B2, verbs",
        tagsHelp:
            "Separate tags with commas.",

        edit: "Edit",
        save: "Save",
        cancel: "Cancel",
        add: "Add",

        deleteWord:
            "Delete word",

        emptyWordError:
            "Word cannot be empty.",

        duplicateEdit:
            "This word with this translation already exists.",

        duplicateAdd:
            "This word with this translation is already saved.",

        clearConfirmation:
            "Are you sure you want to delete all saved words?",

        noWordsToExport:
            "There are no words to export.",

        ankiExportError:
            "Failed to create the Anki file. Check the popup console.",

        backupExportError:
            "Failed to export the database.",

        invalidBackup:
            "Invalid backup file.",

        invalidBackupData:
            "The backup file contains invalid data.",

        importConfirmation:
            "Import will replace the current vocabulary.\n\n" +
            "Number of words in the file: ",

        importConfirmationSuffix:
            "\n\nDo you want to continue?",

        importSuccess:
            "Import completed.\nImported words: ",

        importError:
            "Failed to import the database.\n\n" +
            "The file may be invalid."
    },

    pl: {
        appTitle:
            "Diki Companion",
        appSubtitle:
            "Twój partner w nauce z Diki",

        statusLabel: "Ciemny motyw",
        enabled: "Włączony",
        disabled: "Wyłączony",

        adsStatusLabel: "Blokuj reklamy",

        languageTitle: "Język",
        languageEnglish: "Angielski",
        languagePolish: "Polski",

        vocabularyTitle:
            "Moje słówka",
        searchPlaceholder:
            "Szukaj słówka...",

        addWord: 
            "+ Dodaj słówko",

        noSavedWords:
            "Brak zapisanych słówek",
        noSearchResults:
            "Nie znaleziono słówek",

        clearDatabase:
            "Wyczyść bazę",

        exportCsv:
            "Eksportuj CSV",
        exportAnki:
            "Eksportuj do Anki",
        exportTxt: 
            "Eksportuj TXT",
        exportDatabase:
            "Eksportuj bazę",
        importDatabase:
            "Importuj bazę",

        wordPlaceholder:
            "Słówko",
        translationPlaceholder:
            "Tłumaczenie",
        examplePlaceholder:
            "Przykład",
        exampleTranslationPlaceholder:
            "Tłumaczenie przykładu",
        tagsPlaceholder:
            "Tagi, np. podróże, B2, czasowniki",
        tagsHelp:
            "Oddzielaj tagi przecinkami.",

        edit: "Edytuj",
        save: "Zapisz",
        cancel: "Anuluj",
        add: "Dodaj",

        deleteWord:
            "Usuń słówko",

        emptyWordError:
            "Słówko nie może być puste.",

        duplicateEdit:
            "Takie słówko z tym tłumaczeniem jest już zapisane.",

        duplicateAdd:
            "To słówko z tym tłumaczeniem jest już zapisane.",

        clearConfirmation:
            "Czy na pewno chcesz usunąć wszystkie zapisane słówka?",

        noWordsToExport:
            "Brak słówek do eksportu.",

        ankiExportError:
            "Nie udało się utworzyć pliku Anki. Sprawdź konsolę popupu.",

        backupExportError:
            "Nie udało się wyeksportować bazy.",

        invalidBackup:
            "Nieprawidłowy plik backupu.",

        invalidBackupData:
            "Plik zawiera nieprawidłowe dane.",

        importConfirmation:
            "Import zastąpi obecną bazę słówek.\n\n" +
            "Liczba słówek w pliku: ",

        importConfirmationSuffix:
            "\n\nCzy chcesz kontynuować?",

        importSuccess:
            "Import zakończony.\nZaimportowano: ",

        importError:
            "Nie udało się zaimportować bazy.\n\n" +
            "Plik może być nieprawidłowy."
    }
};


// ==============================
// Translation helpers
// ==============================

function getLanguageText(language) {
    return (
        translations[language] ||
        translations.en
    );
}

function getCurrentLanguage() {
    return (
        languagePolish.checked
            ? "pl"
            : "en"
    );
}

function setLanguage(language) {
    const lang =
        translations[language]
            ? language
            : "en";

    const text =
        getLanguageText(lang);

    document.getElementById(
        "appTitle"
    ).textContent =
        text.appTitle;

    document.getElementById(
        "appSubtitle"
    ).textContent =
        text.appSubtitle;

    document.getElementById(
        "statusLabel"
    ).textContent =
        text.statusLabel;

    document.getElementById(
        "adsStatusLabel"
    ).textContent =
        text.adsStatusLabel;

    document.getElementById(
        "languageTitle"
    ).textContent =
        text.languageTitle;

    document.getElementById(
        "languageEnglishLabel"
    ).textContent =
        text.languageEnglish;

    document.getElementById(
        "languagePolishLabel"
    ).textContent =
        text.languagePolish;

    document.getElementById(
        "vocabularyTitle"
    ).textContent =
        text.vocabularyTitle;

    searchInput.placeholder =
        text.searchPlaceholder;

    document.getElementById(
        "addWord"
    ).textContent =
        text.addWord;

    document.getElementById(
        "clearWords"
    ).textContent =
        text.clearDatabase;

    document.getElementById(
        "exportCsv"
    ).textContent =
        text.exportCsv;

    document.getElementById(
        "exportAnki"
    ).textContent =
        text.exportAnki;

    document.getElementById(
        "exportTxt"
    ).textContent = 
        text.exportTxt;

    document.getElementById(
        "exportBackup"
    ).textContent =
        text.exportDatabase;

    document.getElementById(
        "importBackup"
    ).textContent =
        text.importDatabase;

    const emptyState =
        document.getElementById(
            "emptyWordsState"
        );

    if (emptyState) {
        emptyState.textContent =
            text.noSavedWords;
    }

    updateStatus(
        checkbox.checked,
        lang
    );

    updateAdsStatus(
        blockAdsCheckbox.checkbox,
        lang
    );
}


// ==============================
// Dark mode
// ==============================

function updateStatus(
    enabled,
    language = "en"
) {
    const text =
        getLanguageText(language);

    status.textContent =
        enabled
            ? text.enabled
            : text.disabled;

    status.classList.toggle(
        "active",
        enabled
    );
}

function updateAdsStatus(
    enabled,
    language = "en"
) {
    const text =
        getLanguageText(language);

    adsStatus.textContent =
        enabled
            ? text.enabled
            : text.disabled;

    adsStatus.classList.toggle(
        "active",
        enabled
    );
}

// ==============================
// Language
// ==============================

async function changeLanguage(language) {
    await chrome.storage.local.set({
        language
    });

    if (language === "pl") {
        languagePolish.checked = true;
        languageEnglish.checked = false;
    } else {
        languageEnglish.checked = true;
        languagePolish.checked = false;
    }

    setLanguage(language);
}

languageEnglish.addEventListener(
    "change",
    () => {
        if (languageEnglish.checked) {
            changeLanguage("en");
        }
    }
);

languagePolish.addEventListener(
    "change",
    () => {
        if (languagePolish.checked) {
            changeLanguage("pl");
        }
    }
);


// ==============================
// Vocabulary
// ==============================

function getSearchableText(item) {
    const tags =
        Array.isArray(item.tags)
            ? item.tags
            : [];

    return [
        item.word,
        item.translation,
        item.example,
        item.example_translation,
        ...tags
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function loadWords() {
    const wordsList =
        document.getElementById("wordsList");

    const wordCount =
        document.getElementById("wordCount");

    if (!wordsList || !wordCount) {
        return;
    }

    chrome.storage.local.get(
        ["words"],
        (result) => {
            const words =
                result.words || [];

            allWords = words;

            wordCount.textContent =
                words.length;

            const query =
                currentSearch
                    .trim()
                    .toLowerCase();

            const visibleWords =
                words
                    .map((item, index) => ({
                        item,
                        originalIndex: index
                    }))
                    .filter(
                        ({ item }) =>
                            !query ||
                            getSearchableText(
                                item
                            ).includes(query)
                    );

            wordsList.innerHTML = "";

            if (visibleWords.length === 0) {
                renderEmptyState(
                    wordsList,
                    query
                );

                return;
            }

            visibleWords.forEach(
                ({
                    item,
                    originalIndex
                }) => {
                    renderWordCard(
                        wordsList,
                        item,
                        originalIndex
                    );
                }
            );
        }
    );
}

function renderEmptyState(
    wordsList,
    hasSearchQuery
) {
    const emptyState =
        document.createElement("div");

    emptyState.className =
        "empty-state";

    const language =
        getCurrentLanguage();

    const text =
        getLanguageText(language);

    emptyState.textContent =
        hasSearchQuery
            ? text.noSearchResults
            : text.noSavedWords;

    wordsList.appendChild(
        emptyState
    );
}

function renderWordCard(
    wordsList,
    item,
    originalIndex
) {
    const card =
        document.createElement("div");

    card.className =
        "word-card";

    // Word
    const word =
        document.createElement("div");

    word.className =
        "word";

    word.textContent =
        item.word || "";

    card.appendChild(word);

    // Translation
    const translation =
        document.createElement("div");

    translation.className =
        "translation";

    translation.textContent =
        item.translation || "";

    card.appendChild(
        translation
    );

    // Example
    if (item.example) {
        const example =
            document.createElement("div");

        example.className =
            "example";

        example.textContent =
            item.example;

        card.appendChild(
            example
        );
    }

    // Tags
    if (
        Array.isArray(item.tags) &&
        item.tags.length > 0
    ) {
        const tags =
            document.createElement("div");

        tags.className =
            "tags";

        item.tags.forEach(
            (tagText) => {
                const tag =
                    document.createElement(
                        "span"
                    );

                tag.className =
                    "tag";

                tag.textContent =
                    tagText;

                tags.appendChild(tag);
            }
        );

        card.appendChild(tags);
    }

    // Example translation
    if (item.example_translation) {
        const exampleTranslation =
            document.createElement("div");

        exampleTranslation.className =
            "example-translation";

        exampleTranslation.textContent =
            item.example_translation;

        card.appendChild(
            exampleTranslation
        );
    }

    // Actions
    const actions =
        document.createElement("div");

    actions.className =
        "word-actions";

    // Edit button
    const editButton =
        document.createElement("button");

    editButton.className =
        "edit-word";

    editButton.textContent =
        getLanguageText(
            getCurrentLanguage()
        ).edit;

    editButton.addEventListener(
        "click",
        () => {
            startEditing(
                card,
                item,
                originalIndex
            );
        }
    );

    actions.appendChild(
        editButton
    );

    // Delete button
    const deleteButton =
        document.createElement("button");

    deleteButton.className =
        "delete-word";

    deleteButton.textContent =
        "×";

    deleteButton.title =
        getLanguageText(
            getCurrentLanguage()
        ).deleteWord;

    deleteButton.addEventListener(
        "click",
        async () => {
            const result =
                await chrome.storage.local.get(
                    ["words"]
                );

            const currentWords =
                result.words || [];

            currentWords.splice(
                originalIndex,
                1
            );

            await chrome.storage.local.set({
                words: currentWords
            });

            loadWords();
        }
    );

    card.appendChild(
        deleteButton
    );

    card.appendChild(
        actions
    );

    wordsList.appendChild(
        card
    );
}

if (searchInput) {
    searchInput.addEventListener(
        "input",
        () => {
            currentSearch =
                searchInput.value;

            loadWords();
        }
    );
}


// ==============================
// Word editing
// ==============================

function createInput(
    className,
    type,
    value,
    placeholder
) {
    const input =
        document.createElement(
            type === "textarea"
                ? "textarea"
                : "input"
        );

    input.className =
        className;

    if (type !== "textarea") {
        input.type =
            type;
    }

    input.value =
        value || "";

    input.placeholder =
        placeholder;

    return input;
}

function getTagList(value) {
    return value
        .split(",")
        .map(
            (tag) =>
                tag.trim()
        )
        .filter(Boolean)
        .filter(
            (tag, index, array) =>
                array.findIndex(
                    (item) =>
                        item.toLowerCase() ===
                        tag.toLowerCase()
                ) === index
        );
}

function isDuplicate(
    words,
    word,
    translation,
    ignoredIndex = -1
) {
    const normalizedWord =
        word
            .trim()
            .toLowerCase();

    const normalizedTranslation =
        translation
            .trim()
            .toLowerCase();

    return words.some(
        (item, index) => {

            if (index === ignoredIndex) {
                return false;
            }

            const itemWord =
                (item.word || "")
                    .trim()
                    .toLowerCase();

            const itemTranslation =
                (item.translation || "")
                    .trim()
                    .toLowerCase();

            return (
                itemWord ===
                    normalizedWord &&
                itemTranslation ===
                    normalizedTranslation
            );
        }
    );
}

function startEditing(
    card,
    item,
    index
) {
    const text =
        getLanguageText(
            getCurrentLanguage()
        );

    card.innerHTML = "";

    // Word
    const wordInput =
        createInput(
            "edit-field word-input",
            "text",
            item.word,
            text.wordPlaceholder
        );

    card.appendChild(
        wordInput
    );

    // Translation
    const translationInput =
        createInput(
            "edit-field",
            "text",
            item.translation,
            text.translationPlaceholder
        );

    card.appendChild(
        translationInput
    );

    // Example
    const exampleInput =
        createInput(
            "edit-field example-input",
            "textarea",
            item.example,
            text.examplePlaceholder
        );

    card.appendChild(
        exampleInput
    );

    // Example translation
    const exampleTranslationInput =
        createInput(
            "edit-field example-translation-input",
            "textarea",
            item.example_translation,
            text.exampleTranslationPlaceholder
        );

    card.appendChild(
        exampleTranslationInput
    );

    // Tags
    const tagsInput =
        createInput(
            "edit-field tag-input",
            "text",
            Array.isArray(item.tags)
                ? item.tags.join(", ")
                : "",
            text.tagsPlaceholder
        );

    card.appendChild(
        tagsInput
    );

    const tagsHelp =
        document.createElement("div");

    tagsHelp.className =
        "tags-help";

    tagsHelp.textContent =
        text.tagsHelp;

    card.appendChild(
        tagsHelp
    );

    // Actions
    const actions =
        document.createElement("div");

    actions.className =
        "word-actions";

    // Save
    const saveButton =
        document.createElement("button");

    saveButton.className =
        "save-word";

    saveButton.textContent =
        text.save;

    saveButton.addEventListener(
        "click",
        async () => {

            const newWord =
                wordInput.value.trim();

            if (!newWord) {
                alert(
                    text.emptyWordError
                );

                wordInput.focus();

                return;
            }

            const newTranslation =
                translationInput.value.trim();

            const result =
                await chrome.storage.local.get(
                    ["words"]
                );

            const words =
                result.words || [];

            if (
                isDuplicate(
                    words,
                    newWord,
                    newTranslation,
                    index
                )
            ) {
                alert(
                    text.duplicateEdit
                );

                wordInput.focus();

                return;
            }

            words[index] = {
                word: newWord,

                translation:
                    newTranslation,

                example:
                    exampleInput.value.trim(),

                example_translation:
                    exampleTranslationInput
                        .value
                        .trim(),

                tags:
                    getTagList(
                        tagsInput.value
                    )
            };

            await chrome.storage.local.set({
                words
            });

            loadWords();
        }
    );

    actions.appendChild(
        saveButton
    );

    // Cancel
    const cancelButton =
        document.createElement("button");

    cancelButton.className =
        "cancel-edit";

    cancelButton.textContent =
        text.cancel;

    cancelButton.addEventListener(
        "click",
        () => {
            loadWords();
        }
    );

    actions.appendChild(
        cancelButton
    );

    card.appendChild(
        actions
    );

    wordInput.focus();
}


// ==============================
// Add new word
// ==============================

const addWordButton =
    document.getElementById("addWord");

if (addWordButton) {
    addWordButton.addEventListener(
        "click",
        showAddWordForm
    );
}

function showAddWordForm() {
    const wordsList =
        document.getElementById(
            "wordsList"
        );

    if (!wordsList) {
        return;
    }

    if (
        document.querySelector(
            ".add-word-form"
        )
    ) {
        return;
    }

    const text =
        getLanguageText(
            getCurrentLanguage()
        );

    const form =
        document.createElement("div");

    form.className =
        "add-word-form";

    // Word
    const wordInput =
        createInput(
            "edit-field word-input",
            "text",
            "",
            text.wordPlaceholder
        );

    form.appendChild(
        wordInput
    );

    // Translation
    const translationInput =
        createInput(
            "edit-field",
            "text",
            "",
            text.translationPlaceholder
        );

    form.appendChild(
        translationInput
    );

    // Tags
    const tagsInput =
        createInput(
            "edit-field tag-input",
            "text",
            "",
            text.tagsPlaceholder
        );

    form.appendChild(
        tagsInput
    );

    const tagsHelp =
        document.createElement("div");

    tagsHelp.className =
        "tags-help";

    tagsHelp.textContent =
        text.tagsHelp;

    form.appendChild(
        tagsHelp
    );

    // Example
    const exampleInput =
        createInput(
            "edit-field example-input",
            "textarea",
            "",
            text.examplePlaceholder
        );

    form.appendChild(
        exampleInput
    );

    // Example translation
    const exampleTranslationInput =
        createInput(
            "edit-field example-translation-input",
            "textarea",
            "",
            text.exampleTranslationPlaceholder
        );

    form.appendChild(
        exampleTranslationInput
    );

    // Actions
    const actions =
        document.createElement("div");

    actions.className =
        "word-actions";

    // Add
    const saveButton =
        document.createElement("button");

    saveButton.className =
        "save-word";

    saveButton.textContent =
        text.add;

    saveButton.addEventListener(
        "click",
        async () => {

            const newWord =
                wordInput.value.trim();

            if (!newWord) {
                alert(
                    text.emptyWordError
                );

                wordInput.focus();

                return;
            }

            const newTranslation =
                translationInput.value.trim();

            const result =
                await chrome.storage.local.get(
                    ["words"]
                );

            const words =
                result.words || [];

            if (
                isDuplicate(
                    words,
                    newWord,
                    newTranslation
                )
            ) {
                alert(
                    text.duplicateAdd
                );

                wordInput.focus();

                return;
            }

            words.push({
                word: newWord,

                translation:
                    newTranslation,

                example:
                    exampleInput.value.trim(),

                example_translation:
                    exampleTranslationInput
                        .value
                        .trim(),

                tags:
                    getTagList(
                        tagsInput.value
                    )
            });

            words.sort(
                (a, b) =>
                    a.word.localeCompare(
                        b.word,
                        "en",
                        {
                            sensitivity:
                                "base"
                        }
                    )
            );

            await chrome.storage.local.set({
                words
            });

            loadWords();
        }
    );

    actions.appendChild(
        saveButton
    );

    // Cancel
    const cancelButton =
        document.createElement("button");

    cancelButton.className =
        "cancel-edit";

    cancelButton.textContent =
        text.cancel;

    cancelButton.addEventListener(
        "click",
        () => {
            form.remove();
        }
    );

    actions.appendChild(
        cancelButton
    );

    form.appendChild(
        actions
    );

    wordsList.prepend(
        form
    );

    wordInput.focus();
}


// ==============================
// Clear vocabulary
// ==============================

const clearWords =
    document.getElementById(
        "clearWords"
    );

if (clearWords) {
    clearWords.addEventListener(
        "click",
        async () => {

            const text =
                getLanguageText(
                    getCurrentLanguage()
                );

            const confirmed =
                confirm(
                    text.clearConfirmation
                );

            if (!confirmed) {
                return;
            }

            await chrome.storage.local.set({
                words: []
            });

            loadWords();
        }
    );
}


// ==============================
// CSV export
// ==============================

const exportCsv =
    document.getElementById(
        "exportCsv"
    );

if (exportCsv) {
    exportCsv.addEventListener(
        "click",
        async () => {

            const text =
                getLanguageText(
                    getCurrentLanguage()
                );

            const result =
                await chrome.storage.local.get(
                    ["words"]
                );

            const words =
                result.words || [];

            if (words.length === 0) {
                alert(
                    text.noWordsToExport
                );

                return;
            }

            const rows = [
                [
                    "word",
                    "translation",
                    "example",
                    "example_translation",
                    "tags"
                ]
            ];

            words.forEach((item) => {

                const tags =
                    Array.isArray(item.tags)
                        ? item.tags.join(", ")
                        : "";

                rows.push([
                    item.word || "",
                    item.translation || "",
                    item.example || "",
                    item.example_translation || "",
                    tags
                ]);
            });

            const csv =
                rows
                    .map((row) =>
                        row
                            .map((value) => {

                                const escaped =
                                    String(value)
                                        .replace(
                                            /"/g,
                                            '""'
                                        );

                                return `"${escaped}"`;
                            })
                            .join(",")
                    )
                    .join("\r\n");

            const blob =
                new Blob(
                    [
                        "\uFEFF",
                        csv
                    ],
                    {
                        type:
                            "text/csv;charset=utf-8"
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement("a");

            link.href =
                url;

            link.download =
                "diki-vocabulary.csv";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            URL.revokeObjectURL(
                url
            );

            console.log(
                "CSV export completed."
            );
        }
    );
}


// ==============================
// Anki export
// ==============================

const exportAnki =
    document.getElementById(
        "exportAnki"
    );

if (exportAnki) {
    exportAnki.addEventListener(
        "click",
        async () => {

            const text =
                getLanguageText(
                    getCurrentLanguage()
                );

            try {
                const result =
                    await chrome.storage.local.get(
                        ["words"]
                    );

                const words =
                    result.words || [];

                if (words.length === 0) {
                    alert(
                        text.noWordsToExport
                    );

                    return;
                }

                await sqlReady;

                const model =
                    new Model({
                        name:
                            "Diki Vocabulary",

                        id:
                            1740000000000,

                        flds: [
                            {
                                name: "Front"
                            },
                            {
                                name: "Back"
                            }
                        ],

                        req: [
                            [
                                0,
                                "all",
                                [0]
                            ]
                        ],

                        tmpls: [
                            {
                                name:
                                    "Card 1",

                                qfmt:
                                    "{{Front}}",

                                afmt:
                                    "{{FrontSide}}" +
                                    "<hr id=answer>" +
                                    "{{Back}}"
                            }
                        ],

                        css: `
                            .card {
                                font-family:
                                    -apple-system,
                                    BlinkMacSystemFont,
                                    "Segoe UI",
                                    sans-serif;

                                font-size: 22px;
                                text-align: center;
                                color: #222;
                                background: #fff;
                                padding: 30px;
                            }

                            .example {
                                margin-top: 20px;
                                font-size: 17px;
                                line-height: 1.5;
                            }

                            .example-translation {
                                margin-top: 8px;
                                font-size: 15px;
                                color: #666;
                            }
                        `
                    });

                const deck =
                    new Deck(
                        1740000000001,
                        "Diki - Moje słówka"
                    );

                words.forEach((item) => {

                    const front =
                        escapeAnkiHtml(
                            item.word || ""
                        );

                    let back =
                        escapeAnkiHtml(
                            item.translation || ""
                        );

                    if (item.example) {
                        back +=
                            "<div class=\"example\">" +
                            escapeAnkiHtml(
                                item.example
                            ) +
                            "</div>";
                    }

                    if (
                        item.example_translation
                    ) {
                        back +=
                            "<div class=\"example-translation\">" +
                            escapeAnkiHtml(
                                item.example_translation
                            ) +
                            "</div>";
                    }

                    const tags =
                        Array.isArray(item.tags)
                            ? item.tags
                                .map(
                                    (tag) =>
                                        String(tag)
                                            .trim()
                                )
                                .filter(Boolean)
                                .map(
                                    normalizeAnkiTag
                                )
                            : [];

                    /*
                     * Include the translation in the
                     * stable identifier.
                     *
                     * The vocabulary allows the same
                     * English word to have multiple
                     * translations.
                     */
                    const stableId =
                        [
                            item.word || "",
                            item.translation || ""
                        ]
                            .map(
                                (value) =>
                                    String(value)
                                        .trim()
                                        .toLowerCase()
                            )
                            .join("::");

                    const note =
                        model.note([
                            front,
                            back
                        ]);

                    note.guid =
                        stableAnkiGuid(
                            stableId
                        );

                    note.tags =
                        tags;

                    deck.addNote(
                        note
                    );
                });

                const pack =
                    new Package();

                pack.addDeck(
                    deck
                );

                pack.writeToFile(
                    "diki-vocabulary.apkg"
                );

                console.log(
                    "Anki export completed."
                );

            } catch (error) {

                console.error(
                    "Anki export error:",
                    error
                );

                alert(
                    text.ankiExportError
                );
            }
        }
    );
}


// ==============================
// Anki helper functions
// ==============================

function escapeAnkiHtml(value) {
    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function normalizeAnkiTag(tag) {
    return String(tag)
        .trim()
        .replace(
            /\s+/g,
            "_"
        )
        .replace(
            /::+/g,
            "::"
        )
        .replace(
            /[^a-zA-Z0-9À-ž:_-]/g,
            ""
        );
}

function stableAnkiGuid(value) {
    let hash1 = 2166136261;
    let hash2 = 2166136261;

    for (
        let i = 0;
        i < value.length;
        i++
    ) {
        const code =
            value.charCodeAt(i);

        hash1 ^= code;

        hash1 =
            Math.imul(
                hash1,
                16777619
            );

        hash2 ^=
            code + i;

        hash2 =
            Math.imul(
                hash2,
                16777619
            );
    }

    const part1 =
        (hash1 >>> 0)
            .toString(16)
            .padStart(
                8,
                "0"
            );

    const part2 =
        (hash2 >>> 0)
            .toString(16)
            .padStart(
                8,
                "0"
            );

    return (
        "diki-" +
        part1 +
        part2
    );
}

// ==============================
//  Export vocabulary to TXT
// ==============================

function exportToTxt(words) {
    if (!words || words.length === 0) {
        return;
    }

    const lines = [
        "DIKI COMPANION — MY VOCABULARY",
        "========================================",
        ""
    ];

    words.forEach((word, index) => {
        lines.push(
            `${index + 1}. ${word.word || ""}`
        );

        lines.push(
            `   Translation: ${word.translation || ""}`
        );

        if (word.example) {
            lines.push(
                `   Example: ${word.example}`
            );
        }

        if (word.example_translation) {
            lines.push(
                `   Example translation: ${word.example_translation}`
            );
        }

        if (word.tags && word.tags.length > 0) {
            lines.push(
                `   Tags: ${word.tags.join(", ")}`
            );
        }

        lines.push("");
        lines.push("----------------------------------------");
        lines.push("");
    });

    const content =
        lines.join("\n");

    const blob =
        new Blob(
            [content],
            {
                type: "text/plain;charset=utf-8"
            }
        );

    saveAs(
        blob,
        "diki-companion-vocabulary.txt"
    );
}

// ==============================
// TXT export
// ==============================

const exportTxt =
    document.getElementById(
        "exportTxt"
    );

if (exportTxt) {
    exportTxt.addEventListener(
        "click",
        async () => {

            const text =
                getLanguageText(
                    getCurrentLanguage()
                );

            const result =
                await chrome.storage.local.get(
                    ["words"]
                );

            const words =
                result.words || [];

            if (words.length === 0) {
                alert(
                    text.noWordsToExport
                );

                return;
            }

            exportToTxt(words);
        }
    );
}

// ==============================
// Backup export
// ==============================

const exportBackup =
    document.getElementById(
        "exportBackup"
    );

if (exportBackup) {
    exportBackup.addEventListener(
        "click",
        async () => {

            const text =
                getLanguageText(
                    getCurrentLanguage()
                );

            try {
                const result =
                    await chrome.storage.local.get(
                        ["words"]
                    );

                const words =
                    result.words || [];

                if (words.length === 0) {
                    alert(
                        text.noWordsToExport
                    );

                    return;
                }

                const backup = {
                    version: 1,

                    exportedAt:
                        new Date().toISOString(),

                    words
                };

                const json =
                    JSON.stringify(
                        backup,
                        null,
                        2
                    );

                const blob =
                    new Blob(
                        [json],
                        {
                            type:
                                "application/json;charset=utf-8"
                        }
                    );

                const url =
                    URL.createObjectURL(
                        blob
                    );

                const link =
                    document.createElement(
                        "a"
                    );

                link.href =
                    url;

                link.download =
                    "diki-vocabulary-backup.json";

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();

                URL.revokeObjectURL(
                    url
                );

                console.log(
                    "Backup export completed."
                );

            } catch (error) {

                console.error(
                    "Backup export error:",
                    error
                );

                alert(
                    text.backupExportError
                );
            }
        }
    );
}


// ==============================
// Backup import
// ==============================

const importBackup =
    document.getElementById(
        "importBackup"
    );

if (importBackup) {
    importBackup.addEventListener(
        "click",
        () => {

            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "file";

            input.accept =
                ".json,application/json";

            input.addEventListener(
                "change",
                async () => {

                    const file =
                        input.files?.[0];

                    if (!file) {
                        return;
                    }

                    const text =
                        getLanguageText(
                            getCurrentLanguage()
                        );

                    try {
                        // Read file
                        const fileText =
                            await file.text();

                        const backup =
                            JSON.parse(
                                fileText
                            );

                        // Validate structure
                        if (
                            !backup ||
                            !Array.isArray(
                                backup.words
                            )
                        ) {
                            throw new Error(
                                "Invalid backup structure."
                            );
                        }

                        // Validate word entries
                        const validWords =
                            backup.words.every(
                                (item) =>
                                    item &&
                                    typeof item ===
                                        "object" &&
                                    typeof item.word ===
                                        "string"
                            );

                        if (!validWords) {
                            throw new Error(
                                "Invalid backup data."
                            );
                        }

                        // Ask for confirmation
                        const confirmed =
                            confirm(
                                text.importConfirmation +
                                backup.words.length +
                                text.importConfirmationSuffix
                            );

                        if (!confirmed) {
                            return;
                        }

                        // Normalize imported data
                        const words =
                            backup.words.map(
                                (item) => ({
                                    word:
                                        item.word
                                            .trim(),

                                    translation:
                                        typeof item.translation ===
                                            "string"
                                            ? item.translation
                                                .trim()
                                            : "",

                                    example:
                                        typeof item.example ===
                                            "string"
                                            ? item.example
                                                .trim()
                                            : "",

                                    example_translation:
                                        typeof item.example_translation ===
                                            "string"
                                            ? item.example_translation
                                                .trim()
                                            : "",

                                    tags:
                                        Array.isArray(
                                            item.tags
                                        )
                                            ? item.tags
                                                .filter(
                                                    (tag) =>
                                                        typeof tag ===
                                                        "string"
                                                )
                                                .map(
                                                    (tag) =>
                                                        tag.trim()
                                                )
                                                .filter(Boolean)
                                            : []
                                })
                            );

                        // Remove empty words
                        const cleanedWords =
                            words.filter(
                                (item) =>
                                    item.word.length > 0
                            );

                        // Save imported vocabulary
                        await chrome.storage.local.set({
                            words:
                                cleanedWords
                        });

                        console.log(
                            "Backup import completed:",
                            cleanedWords.length
                        );

                        alert(
                            text.importSuccess +
                            cleanedWords.length +
                            "."
                        );

                    } catch (error) {

                        console.error(
                            "Backup import error:",
                            error
                        );

                        alert(
                            text.importError
                        );
                    }
                }
            );

            input.click();
        }
    );
}


// ==============================
// Dark mode initialization
// ==============================

chrome.storage.local.get(
    [
        "darkMode",
        "blockAds",
        "language"
    ],
    (result) => {

        const enabled =
            result.darkMode ?? true;

        const adsEnabled =
            result.blockAds ?? false;

        const language =
            result.language || "en";

        checkbox.checked =
            enabled;

        blockAdsCheckbox.checked =
            adsEnabled;

        if (language === "pl") {
            languagePolish.checked = true;
            languageEnglish.checked = false;
        } else {
            languageEnglish.checked = true;
            languagePolish.checked = false;
        }

        setLanguage(language);

        updateAdsStatus(
            adsEnabled,
            language
        );
    }
);

checkbox.addEventListener(
    "change",
    async () => {

        const enabled =
            checkbox.checked;

        const language =
            getCurrentLanguage();

        await chrome.storage.local.set({
            darkMode: enabled
        });

        updateStatus(
            enabled,
            language
        );

        const tabs =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    type:
                        "TOGGLE_DARK_MODE",

                    enabled
                }
            ).catch(() => {});
        }
    }
);

// ==============================
// Ad blocking
// ==============================

blockAdsCheckbox.addEventListener(
    "change",
    async () => {

        const enabled =
            blockAdsCheckbox.checked;

        const language =
            getCurrentLanguage();

        await chrome.storage.local.set({
            blockAds: enabled
        });

        updateAdsStatus(
            enabled,
            language
        );

        const tabs =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    type:
                        "TOGGLE_AD_BLOCKING",

                    enabled
                }
            ).catch(() => {});
        }
    }
);

// ==============================
// Storage change listener
// ==============================

chrome.storage.onChanged.addListener(
    (changes, areaName) => {

        if (
            areaName === "local" &&
            changes.words
        ) {
            loadWords();
        }

        if (
            areaName === "local" &&
            changes.language
        ) {
            const language =
                changes.language.newValue ||
                "en";

            setLanguage(
                language
            );
        }
    }
);

// ==============================
// Initialize vocabulary
// ==============================

loadWords();