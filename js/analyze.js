/* Japanese Reading Aide — Analyze page.

   IMPORTANT: This is a working frontend prototype, not a complete Japanese
   language analyzer. It recognizes words from the small dictionary below.
   A production version needs a Japanese tokenizer and a dictionary API/backend.
*/
'use strict';

const h = React.createElement;
const STORAGE_KEY = 'jra-vocabulary-v1';
const READING_KEY = 'jra-readings-v1';

// FRONTEND-ONLY SAMPLE DICTIONARY for the original Analyze page.
// TODO (backend teammate): Store dictionary entries in MongoDB and expose
// an Express endpoint (such as GET /api/dictionary). Replace these sample
// entries with data requested from that endpoint when backend is ready.
// TODO: Add Japanese word tokenization for accurate analysis later.
// "reading" uses hiragana, and "meaning" is the English translation.
const dictionary = [
    { word: '図書館', reading: 'としょかん', meaning: 'Library' },
    { word: '日本語', reading: 'にほんご', meaning: 'Japanese language' },
    { word: '今日', reading: 'きょう', meaning: 'Today' },
    { word: '学校', reading: 'がっこう', meaning: 'School' },
    { word: '先生', reading: 'せんせい', meaning: 'Teacher' },
    { word: '学生', reading: 'がくせい', meaning: 'Student' },
    { word: '本', reading: 'ほん', meaning: 'Book' },
    { word: '読む', reading: 'よむ', meaning: 'To read' },
    { word: '読みました', reading: 'よみました', meaning: 'Read (past, polite)' },
    { word: '勉強', reading: 'べんきょう', meaning: 'Study' },
    { word: '友達', reading: 'ともだち', meaning: 'Friend' },
    { word: '言葉', reading: 'ことば', meaning: 'Word / language' },
    { word: '新しい', reading: 'あたらしい', meaning: 'New' },
    { word: '私', reading: 'わたし', meaning: 'I / me' },
    { word: '毎日', reading: 'まいにち', meaning: 'Every day' },
    { word: '猫', reading: 'ねこ', meaning: 'Cat' },
    { word: '犬', reading: 'いぬ', meaning: 'Dog' },
    { word: '食べる', reading: 'たべる', meaning: 'To eat' },
    { word: '水', reading: 'みず', meaning: 'Water' },
    { word: '時間', reading: 'じかん', meaning: 'Time' }
];

// Read saved data safely in case browser storage is empty or invalid.
function loadList(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}

// Count dictionary matches from the pasted or uploaded Japanese text.
// This is not full word segmentation: unknown Japanese words are not identified.
function analyzeText(text, knownWords) {
    const matches = [];
    const sorted = [...dictionary].sort((a, b) => b.word.length - a.word.length);
    let remaining = text;

    // Match longer words first so 本 does not steal characters from other words.
    // Scan from left to right to avoid counting overlapping dictionary matches.
    for (let i = 0; i < text.length;) {
        const found = sorted.find(entry => text.startsWith(entry.word, i));
        if (found) {
            const existing = matches.find(entry => entry.word === found.word);
            if (existing) existing.frequency += 1;
            else matches.push({ ...found, frequency: 1 });
            i += found.word.length;
        } else {
            i += 1;
        }
    }

    const total = matches.reduce((sum, word) => sum + word.frequency, 0);
    const known = matches.reduce((sum, word) => sum + (knownWords.has(word.word) ? word.frequency : 0), 0);
    const sortedMatches = matches.sort((a, b) => b.frequency - a.frequency || a.word.localeCompare(b.word));
    return { words: sortedMatches, total, known, unknown: total - known, percent: total ? Math.round(100 * known / total) : 0 };
}

// Display the upload form first, then show analysis results on the same page.
function AnalyzePage() {
    const [mode, setMode] = React.useState('paste');
    const [text, setText] = React.useState('');
    const [fileName, setFileName] = React.useState('Pasted Japanese Text');
    const [result, setResult] = React.useState(null);
    const [error, setError] = React.useState('');
    const [dragging, setDragging] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [vocabulary, setVocabulary] = React.useState(() => loadList(STORAGE_KEY));

    // Only .txt and .md files are supported in this frontend version.
    // PDF and Word files need a parser on the backend.
    function readFile(file) {
        setError('');
        if (!file) return;
        if (!/\.(txt|md)$/i.test(file.name)) {
            setError('Please choose a .txt or .md file. PDF and Word uploads are not supported yet.');
            return;
        }
        if (file.size > 1024 * 1024) {
            setError('Please choose a file smaller than 1 MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            setText(String(reader.result || ''));
            setFileName(file.name);
        };
        reader.onerror = function () { setError('Could not read the file. Please try again.'); };
        reader.readAsText(file, 'UTF-8');
    }

    function startAnalysis() {
        if (!text.trim()) { setError('Please paste Japanese text or choose a file first.'); return; }
        const knownWords = new Set(vocabulary.filter(word => word.status === 'known').map(word => word.word));
        setResult(analyzeText(text, knownWords));
        setSaved(false);
        setError('');
    }

    // Save a word in a shared localStorage format for the future Study page.
    function saveWord(word) {
        if (vocabulary.some(item => item.word === word.word)) return;
        const next = [...vocabulary, {
            word: word.word, reading: word.reading, meaning: word.meaning,
            status: 'learning', source: fileName, addedAt: new Date().toISOString()
        }];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setVocabulary(next);
    }

    // Add every newly recognized word to the flashcard vocabulary.
    function saveAllWords() {
        if (!result) return;
        const existing = new Set(vocabulary.map(item => item.word));
        const additions = result.words.filter(word => !existing.has(word.word)).map(word => ({
            word: word.word, reading: word.reading, meaning: word.meaning,
            status: 'learning', source: fileName, addedAt: new Date().toISOString()
        }));
        const next = [...vocabulary, ...additions];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setVocabulary(next);
    }

    function saveReading() {
        const readings = loadList(READING_KEY);
        readings.unshift({ id: Date.now(), title: fileName, text, date: new Date().toISOString(), analyzedWords: result.words.length });
        localStorage.setItem(READING_KEY, JSON.stringify(readings));
        setSaved(true);
    }

    function backToInput() { setResult(null); setSaved(false); }

    // Upload/paste view (prototype page 2).
    if (!result) return h('div', null,
        h('h1', null, 'Analyze a Japanese Reading'),
        h('p', { className: 'analyze-intro' }, 'Upload a file or paste Japanese text to explore vocabulary and reading statistics.'),
        h('div', { className: 'analyze-panel' },
            h('div', { className: 'input-tabs' },
                h('button', { className: mode === 'paste' ? 'selected' : '', onClick: () => setMode('paste'), type: 'button' }, 'Paste Text'),
                h('button', { className: mode === 'file' ? 'selected' : '', onClick: () => setMode('file'), type: 'button' }, 'Upload File')
            ),
            mode === 'paste'
                ? h('div', null,
                    h('label', { htmlFor: 'japanese-text' }, 'Japanese text'),
                    h('textarea', {
                        id: 'japanese-text', className: 'text-input', value: text,
                        placeholder: '例：今日は図書館で日本語の本を読みました。',
                        onChange: event => { setText(event.target.value); setFileName('Pasted Japanese Text'); }
                    })
                )
                : h('div', {
                    className: 'drop-zone' + (dragging ? ' dragging' : ''),
                    onDragOver: event => { event.preventDefault(); setDragging(true); },
                    onDragLeave: () => setDragging(false),
                    onDrop: event => { event.preventDefault(); setDragging(false); readFile(event.dataTransfer.files[0]); }
                },
                    h('p', null, 'Drag and drop a Japanese text file here'),
                    h('p', null, 'or'),
                    h('label', { className: 'file-label' }, 'Choose a File',
                        h('input', { type: 'file', accept: '.txt,.md,text/plain,text/markdown', onChange: event => readFile(event.target.files[0]) })
                    ),
                    h('p', { className: 'small-note' }, 'Supported files: .txt and .md (UTF-8, up to 1 MB)'),
                    fileName !== 'Pasted Japanese Text' && h('p', null, 'Selected: ' + fileName)
                ),
            h('p', { className: 'small-note' }, 'This prototype recognizes a limited set of Japanese words. Full Japanese analysis will require a tokenizer and dictionary service.')
        ),
        error && h('p', { className: 'status-message error-message', role: 'alert' }, error),
        h('div', { className: 'analyze-actions' },
            h('button', { type: 'button', onClick: startAnalysis }, 'Analyze Reading →')
        )
    );

    // Results view (prototype page 3).
    const newWords = result.words.filter(word => !vocabulary.some(savedWord => savedWord.word === word.word));
    return h('div', null,
        h('div', { className: 'result-header' },
            h('div', null, h('h1', null, 'Analysis Result'), h('p', null, fileName), h('p', { className: 'small-note' }, 'Analyzed ' + new Date().toLocaleDateString())),
            h('button', { className: 'save-button', type: 'button', onClick: saveReading, disabled: saved }, saved ? 'Reading Saved ✓' : 'Save this Reading')
        ),
        h('div', { className: 'stats-grid' },
            h('section', { className: 'stat-card' },
                h('h2', null, 'Vocabulary Coverage'),
                h('div', { className: 'stat-value' }, result.percent + '%'),
                h('div', { className: 'progress-track', role: 'progressbar', 'aria-valuenow': result.percent, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Recognized vocabulary coverage' },
                    h('div', { className: 'progress-fill', style: { width: result.percent + '%' } })
                ),
                h('p', { className: 'small-note' }, 'Percentage of recognized word occurrences marked as known. This is not a comprehension test.')
            ),
            h('section', { className: 'stat-card' },
                h('h2', null, 'Word Statistics'),
                h('p', { className: 'stat-line' }, h('span', null, 'Recognized word occurrences'), h('strong', null, result.total)),
                h('p', { className: 'stat-line' }, h('span', null, 'Known occurrences'), h('strong', null, result.known)),
                h('p', { className: 'stat-line' }, h('span', null, 'Learning / not known'), h('strong', null, result.unknown)),
                h('p', { className: 'stat-line' }, h('span', null, 'Unique recognized words'), h('strong', null, result.words.length))
            )
        ),
        h('section', { className: 'words-panel' },
            h('div', { className: 'result-header' },
                h('h2', null, 'Most Important Words to Learn'),
                h('button', { className: 'save-button', type: 'button', disabled: newWords.length === 0, onClick: saveAllWords },
                    newWords.length ? 'Add All to Flashcards (' + newWords.length + ')' : 'All Words Added ✓')
            ),
            result.words.length
                ? h('div', { className: 'table-scroll' }, h('table', { className: 'words-table' },
                    h('thead', null, h('tr', null, ['Word', 'Reading', 'Meaning', 'Frequency', 'Study'].map(label => h('th', { key: label, scope: 'col' }, label)))),
                    h('tbody', null, result.words.map(word => h('tr', { key: word.word },
                        h('td', null, word.word), h('td', null, word.reading), h('td', null, word.meaning),
                        h('td', null, word.frequency),
                        h('td', null, h('button', {
                            type: 'button', className: 'add-word-button',
                            disabled: vocabulary.some(item => item.word === word.word),
                            onClick: () => saveWord(word)
                        }, vocabulary.some(item => item.word === word.word) ? 'Added ✓' : '+ Add Card'))
                    )))
                ))
                : h('p', null, 'No words from the prototype dictionary were recognized. Try: 今日は図書館で日本語の本を読みました。'),
            h('p', { className: 'sample-note' }, 'Only words found in the built-in sample dictionary appear here. Other words are not counted, so these statistics do not represent the full document.'),
            h('h2', null, 'Your Reading'),
            h('p', { className: 'preview-text' }, text)
        ),
        h('div', { className: 'analyze-actions' }, h('button', { className: 'back-button', type: 'button', onClick: backToInput }, '← Analyze Another Reading'))
    );
}

ReactDOM.createRoot(document.getElementById('analyze-root')).render(h(AnalyzePage));
